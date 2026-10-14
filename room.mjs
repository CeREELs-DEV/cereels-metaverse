import {Room,ServerError} from '@colyseus/core';
import {schema,t} from '@colyseus/schema';

export const MAX_VISITORS=12;
const characters=new Set(['visitor','cleo','eustace','taemi']);
export const cleanText=(value,max)=>typeof value==='string'?value.normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,'').trim().slice(0,max):'';
export function validPose(value){
 return !!value&&typeof value==='object'&&[value.x,value.z,value.hx,value.hz].every(Number.isFinite)&&Math.abs(value.x)<249&&Math.abs(value.z)<374&&Math.abs(value.hx)<=1.01&&Math.abs(value.hz)<=1.01;
}
const Visitor=schema({name:t.string().default(''),character:t.string().default('visitor'),x:t.float32().default(0),z:t.float32().default(0),hx:t.float32().default(1),hz:t.float32().default(1),moving:t.boolean().default(false),running:t.boolean().default(false)},'Visitor');
const SeoulState=schema({visitors:t.map(Visitor)},'SeoulState');

export class SeoulRoom extends Room{
 static current=null;
 maxClients=MAX_VISITORS;maxMessagesPerSecond=35;autoDispose=false;
 onCreate(options={}){
  if(SeoulRoom.current)throw new ServerError(429,'서울 시험 서버가 이미 열려 있습니다.');
  SeoulRoom.current=this;this.roomId='seoul';this.setState(new SeoulState());this.setPatchRate(100);
  this.world=options.world;this.sessions=new Map();
  this.onMessage('pose',(client,value)=>{
   const player=this.state.visitors.get(client.sessionId),session=this.sessions.get(client.sessionId),now=Date.now();
   if(!player||!validPose(value)||now-session.poseTime<60)return;
   const distance=Math.hypot(value.x-player.x,value.z-player.z),allowance=14*Math.min(2,(now-session.moveTime)/1000)+2;
   if(distance>allowance){client.send('position',{x:player.x,z:player.z});return;}
   session.poseTime=now;session.moveTime=now;
   Object.assign(player,{x:value.x,z:value.z,hx:value.hx,hz:value.hz,moving:value.moving===true,running:value.running===true});
   if(characters.has(value.character))player.character=value.character;
  });
  this.onMessage('arrive',(client,id)=>{
   const point=typeof id==='string'&&this.world?.entrances[id],player=this.state.visitors.get(client.sessionId),session=this.sessions.get(client.sessionId),now=Date.now();
   if(!point||!player)return;
   if(now-session.arrivalTime<1500){client.send('position',{x:player.x,z:player.z});return;}
   session.arrivalTime=now;session.moveTime=now;Object.assign(player,{x:point.x,z:point.z,moving:false});
   client.send('position',{x:player.x,z:player.z});
  });
  this.onMessage('chat',(client,value)=>{
   const player=this.state.visitors.get(client.sessionId),session=this.sessions.get(client.sessionId),now=Date.now(),message=cleanText(value,160);
   if(!player||!message)return;
   if(now-session.chatTime<1200){client.send('notice','메시지는 잠시 간격을 두고 보내 주세요.');return;}
   session.chatTime=now;this.broadcast('chat',{id:client.sessionId,name:player.name,text:message});
  });
  this.onMessage('name',(client,value)=>{
   const player=this.state.visitors.get(client.sessionId),name=cleanText(value,20);if(player&&name)player.name=name;
  });
 }
 onJoin(client,options={}){
  options=options&&typeof options==='object'&&!Array.isArray(options)?options:{};
  const player=new Visitor(),point=validPose(options)?options:this.world.spawn;
  Object.assign(player,{name:cleanText(options.name,20)||'산책자-'+client.sessionId.slice(0,4),character:characters.has(options.character)?options.character:'visitor',x:point.x,z:point.z});
  this.state.visitors.set(client.sessionId,player);this.sessions.set(client.sessionId,{poseTime:0,moveTime:Date.now(),chatTime:0,arrivalTime:0});
 }
 onLeave(client){this.state.visitors.delete(client.sessionId);this.sessions.delete(client.sessionId);}
 onDispose(){if(SeoulRoom.current===this)SeoulRoom.current=null;}
}
