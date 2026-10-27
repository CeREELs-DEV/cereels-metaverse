import {Room,ServerError} from '@colyseus/core';
import {schema,t} from '@colyseus/schema';
import {createSharedTraffic} from './traffic-world.mjs';
import {createExplorationTraffic} from './exploration-traffic.mjs';
import {characters as characterRoster,DEFAULT_CHARACTER} from './shared/character-roster.js';

export const MAX_VISITORS=12;
const characters=new Set(Object.keys(characterRoster));
export const cleanText=(value,max)=>typeof value==='string'?value.normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,'').trim().slice(0,max):'';
export function validPose(value,world={}){
 // 이전 호출자의 기본 도심 경계. 실행 서버는 준비된 월드의 확장 경계 사용.
 const bounds=world.bounds||{minX:-250,maxX:250,minZ:-375,maxZ:375};
 if(!value||typeof value!=='object'||![value.x,value.z,value.hx,value.hz].every(Number.isFinite)||value.x<=bounds.minX+1||value.x>=bounds.maxX-1||value.z<=bounds.minZ+1||value.z>=bounds.maxZ-1||Math.abs(value.hx)>1.01||Math.abs(value.hz)>1.01)return false;
 if(!world.boundary)return true;
 let inside=false;for(let i=0,j=world.boundary.length-1;i<world.boundary.length;j=i++){const a=world.boundary[i],b=world.boundary[j];if((a[1]>value.z)!==(b[1]>value.z)&&value.x<(b[0]-a[0])*(value.z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;
}
const Visitor=schema({name:t.string().default(''),character:t.string().default(DEFAULT_CHARACTER),x:t.float32().default(0),z:t.float32().default(0),hx:t.float32().default(1),hz:t.float32().default(1),moving:t.boolean().default(false),running:t.boolean().default(false)},'Visitor');
const Car=schema({model:t.string(),color:t.string(),taxi:t.boolean(),x:t.float32(),z:t.float32(),turn:t.float32(),speed:t.float32(),travelled:t.float32()},'Car');
const Signal=schema({index:t.uint8(),elapsed:t.float32()},'Signal');
const SeoulState=schema({visitors:t.map(Visitor),cars:t.map(Car),signals:t.map(Signal),trafficTick:t.uint32().default(0),trafficTime:t.float64().default(0)},'SeoulState');

export class SeoulRoom extends Room{
 static current=null;
 static additional=new Map();
 maxClients=MAX_VISITORS;maxMessagesPerSecond=35;autoDispose=false;
 onCreate(options={}){
  const roomId=options.world?.roomId||'seoul';
  if(roomId==='seoul'?SeoulRoom.current:SeoulRoom.additional.has(roomId))throw new ServerError(429,'서울 시험 서버가 이미 열려 있습니다.');
  if(roomId==='seoul')SeoulRoom.current=this;else SeoulRoom.additional.set(roomId,this);
  this.roomId=roomId;this.setState(new SeoulState());this.setPatchRate(100);
  this.world=options.world;this.sessions=new Map();
  if(options.traffic||options.world?.worldId==='seoul-1.3'){
   this.traffic=options.world?.worldId==='seoul-1.3'?createExplorationTraffic():createSharedTraffic(options.traffic);
   this.setSimulationInterval(dt=>{this.traffic.advance(dt/1000,[...this.state.visitors.values()]);this.publishTraffic();},50);
  }
  this.onMessage('pose',(client,value)=>{
   const player=this.state.visitors.get(client.sessionId),session=this.sessions.get(client.sessionId),now=Date.now();
   if(!player||!validPose(value,this.world))return;
   const distance=Math.hypot(value.x-player.x,value.z-player.z),movement=session.movement;
   if(movement){
    if(!Number.isSafeInteger(value.moveSeq)||value.moveSeq<=movement.seq||!Number.isFinite(value.moveTime)||value.moveTime<0)return;
    if(movement.time!==null){
     if(value.moveTime<movement.time)return;
     const elapsed=(value.moveTime-movement.time)/1000,lead=value.moveTime-movement.epoch-(now-movement.started);
     if(distance>14*elapsed+.25||lead>2000){client.send('position',{x:player.x,z:player.z});return;}
    }else{
     // 접속 요청 뒤에도 로컬 보행 지속. 첫 응답에서 현재 위치·시간 기준 확정
     movement.epoch=value.moveTime;movement.started=now;
    }
    movement.seq=value.moveSeq;movement.time=value.moveTime;
   }else{
    // 기존 열린 탭의 이전 전송 형식 호환
    if(now-session.poseTime<60)return;
    const allowance=14*Math.min(2,(now-session.moveTime)/1000)+2;
    if(distance>allowance){client.send('position',{x:player.x,z:player.z});return;}
   }
   session.poseTime=now;session.moveTime=now;
   Object.assign(player,{x:value.x,z:value.z,hx:value.hx,hz:value.hz,moving:value.moving===true,running:value.running===true});
   if(characters.has(value.character))player.character=value.character;
  });
  this.onMessage('arrive',(client,value)=>{
   const id=typeof value==='string'?value:value?.id,request=Number.isSafeInteger(value?.request)?value.request:null;
   const point=typeof id==='string'&&this.world?.entrances[id],player=this.state.visitors.get(client.sessionId),session=this.sessions.get(client.sessionId),now=Date.now();
   if(!point||!player)return;
   const respond=accepted=>client.send('position',{x:player.x,z:player.z,...(request===null?{}:{arrival:request,accepted})});
   if(now-session.arrivalTime<1500){respond(false);return;}
   session.arrivalTime=now;session.moveTime=now;Object.assign(player,{x:point.x,z:point.z,moving:false});
   if(this.traffic){this.traffic.populate(point,[...this.state.visitors.values()]);this.publishTraffic();}
   if(session.movement&&session.movement.time!==null&&Number.isFinite(value?.moveTime)&&value.moveTime>=session.movement.time)session.movement.time=value.moveTime;
   respond(true);
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
  if(this.world.characterRevision&&options.characterRevision!==this.world.characterRevision)throw new ServerError(409,'캐릭터가 업데이트되었습니다. 화면을 새로고침해 주세요.');
  if(this.world.worldId&&this.world.worldId!=='seoul'&&(options.worldId!==this.world.worldId||options.mapRevision!==this.world.mapRevision))throw new ServerError(409,'서울 버전이 다릅니다. 같은 버전 주소에서 다시 접속해 주세요.');
  const player=new Visitor(),point=validPose(options,this.world)?options:this.world.spawn;
  Object.assign(player,{name:cleanText(options.name,20)||'산책자-'+client.sessionId.slice(0,4),character:characters.has(options.character)?options.character:DEFAULT_CHARACTER,x:point.x,z:point.z});
  this.state.visitors.set(client.sessionId,player);this.sessions.set(client.sessionId,{poseTime:0,moveTime:Date.now(),chatTime:0,arrivalTime:0,movement:options.moveSeq===0&&Number.isFinite(options.moveTime)?{seq:0,time:null}:null});
  if(this.traffic){this.traffic.populate(player,[...this.state.visitors.values()]);this.publishTraffic();}
 }
 publishTraffic(){
  if(!this.traffic)return;
  const snapshot=this.traffic.snapshot(),keep=new Set(snapshot.cars.map(c=>String(c.id)));
  for(const id of this.state.cars.keys())if(!keep.has(id))this.state.cars.delete(id);
  for(const {id,...pose} of snapshot.cars){const key=String(id),car=this.state.cars.get(key)||new Car();Object.assign(car,pose);this.state.cars.set(key,car);}
  for(const {id,index,elapsed} of snapshot.signals){const signal=this.state.signals.get(id)||new Signal();Object.assign(signal,{index,elapsed});this.state.signals.set(id,signal);}
  this.state.trafficTick=snapshot.tick;this.state.trafficTime=snapshot.time;
 }
 onLeave(client){this.state.visitors.delete(client.sessionId);this.sessions.delete(client.sessionId);}
 onDispose(){if(SeoulRoom.current===this)SeoulRoom.current=null;if(SeoulRoom.additional.get(this.roomId)===this)SeoulRoom.additional.delete(this.roomId);}
}
