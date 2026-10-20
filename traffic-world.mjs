import {createTrafficSimulation} from './shared/traffic-simulation.js';
import {createRoadBodyTest} from './shared/traffic-road.js';

export function createSharedTraffic(plan){
 let visitors=[],crowded=[];
 const near=(p,v)=>Math.hypot(v.x-p.x,v.z-p.z)<260;
 // 같은 구역의 운행 밀도는 모바일의 기존 상한 유지. 기기마다 다른 차를 고르지 않음.
 const simulation=createTrafficSimulation({plan:{...plan,bodyOnRoad:createRoadBodyTest(plan.road)},visible:p=>visitors.some(v=>near(p,v)),spawnVisible:p=>crowded.some(v=>near(p,v)),spawnDistance:180});
 let tick=0,elapsed=0;
 const snapshot=()=>({tick,time:simulation.clock,cars:simulation.cars.map(({id,model,color,taxi,x,z,turn,speed,travelled})=>({id,model,color,taxi,x,z,turn,speed,travelled})),signals:[...simulation.signals.states].map(([id,s])=>({id,index:s.index,elapsed:s.elapsed}))});
 return{
  simulation,snapshot,
  populate(point,players=[]){simulation.populate(point,players);},
  advance(dt,players){
   visitors=players;
   crowded=players.filter(p=>simulation.cars.filter(c=>near(c,p)).length>=36);
   if(!players.length){elapsed=0;return;}
   elapsed=Math.min(.25,elapsed+dt);
   while(elapsed>=.05){simulation.step(.05,players);elapsed-=.05;tick++;}
  }
 };
}
