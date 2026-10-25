import {pathAt,pathOf} from './traffic-path.js';
import {vehicleSize,vehicleBounds,chooseVehicle} from './vehicle-catalog.js';
import {createSignalController} from './signal-controller.js';
export const TRAFFIC=Object.freeze({maxActive:100,initialActive:20,intervalMin:1.2,intervalMax:2.2,spawnNear:230,retireFar:300,acceleration:1.8,braking:5.0,gap:4.0});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function bodiesOverlap(car,other,lateral=0,longitudinal=0){
 const a=vehicleBounds(car),b=vehicleBounds(other);if(distance(car,other)>(a.d+b.d)/2+longitudinal+lateral+1)return false;
 const axis=v=>[[Math.cos(v.turn),-Math.sin(v.turn)],[Math.sin(v.turn),Math.cos(v.turn)]],A=axis(car),B=axis(other),dx=other.x-car.x,dz=other.z-car.z;
 const extent=(axes,w,d,n)=>Math.abs(n[0]*axes[0][0]+n[1]*axes[0][1])*w/2+Math.abs(n[0]*axes[1][0]+n[1]*axes[1][1])*d/2;
 return [...A,...B].every(n=>Math.abs(dx*n[0]+dz*n[1])<extent(A,a.w+2*lateral,a.d+2*longitudinal,n)+extent(B,b.w,b.d,n));
}
export function vehicleContains(p,v,radius=.9){
 const m=vehicleBounds(v),c=Math.cos(v.turn),s=Math.sin(v.turn),x=p.x-v.x,z=p.z-v.z;
 return Math.hypot(Math.max(0,Math.abs(x*c-z*s)-m.w/2),Math.max(0,Math.abs(x*s+z*c)-m.d/2))<radius;
}
// 순수 시뮬레이션과 렌더링을 분리: 검사에서 실제 도로망·차체·보행 위치를 그대로 사용한다.
// 기기 화질 단계별 운행 상한. 기본값은 기존 데스크톱 기준.
export function createTrafficSimulation({plan,random=Math.random,visible=()=>false,spawnVisible=visible,spawnDistance=45,maxActive=TRAFFIC.maxActive,initialActive=TRAFFIC.initialActive}={}){
 const {trafficLanes,parkedVehicles,signalJunctions,bodyOnRoad}=plan,trafficLaneById=new Map(trafficLanes.map(l=>[l.id,l])),signalByLane=new Map(plan.signalByLane);
 const movementKind=(lane,connection)=>connection.kind||'straight';
 const limits={maxActive,initialActive};
 const cars=[],locks=new Map(),signals=createSignalController({signalJunctions,signalByLane,movementKind}),stats={spawned:0,retired:0,turns:0,stops:0,playerYields:0,signalStops:0,signalDepartures:0,laneChanges:0,parkingPasses:0};let clock=0,nextSpawn=3,id=0;
 const cells=new Map(),cellOf=c=>Math.floor(c.x/32)+','+Math.floor(c.z/32);
 const indexCar=c=>{const key=cellOf(c);if(!cells.has(key))cells.set(key,new Set());cells.get(key).add(c);c.trafficCell=key;};
 const nearby=p=>{const found=[],x=Math.floor(p.x/32),z=Math.floor(p.z/32);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const c of cells.get((x+dx)+','+(z+dz))||[])found.push(c);return found;};
 const parked=parkedVehicles.map(p=>({...p,speed:0,dx:-Math.sin(p.turn),dz:-Math.cos(p.turn),parked:true}));
 const obstacles=p=>[...nearby(p),...parked.filter(v=>distance(v,p)<65)];
 const laneEnd=lane=>Math.min(lane.length,signalByLane.get(lane.id)?.stopS??Infinity);
 function frontGap(car,pose=car,path=car.path,s=car.s){let gap=Infinity,lead=null;for(const other of obstacles(pose)){
  if(other===car)continue;
  // 굽은 길의 옆 차로를 직선 전방 장애물로 오인하지 않도록 차로 소속 우선.
  if(!path.junction&&!path.laneChange){
   if(other.parked&&other.chain===path.chain&&other.direction===path.direction&&other.lane!==path.index)continue;
   if(other.path&&!other.path.junction&&!other.path.laneChange&&other.path.chain===path.chain&&other.path.direction===path.direction&&other.path.id!==path.id)continue;
  }
  if(other.path===path&&other.s>s){const d=other.s-s-(vehicleBounds(car).d+vehicleBounds(other).d)/2-TRAFFIC.gap;if(d<gap){gap=d;lead=other;}continue;}
  const dx=other.x-pose.x,dz=other.z-pose.z,along=dx*pose.dx+dz*pose.dz,across=Math.abs(dx*pose.dz-dz*pose.dx);
  if(pose.dx*other.dx+pose.dz*other.dz>.5&&along>0&&across<(vehicleBounds(car).w+vehicleBounds(other).w)/2+.22){const d=along-(vehicleBounds(car).d+vehicleBounds(other).d)/2-TRAFFIC.gap;if(d<gap){gap=d;lead=other;}}
 }return{gap:Math.max(0,gap),lead};}
 function tryLaneChange(car,targetId,player){
  const lane=car.path,targetLane=trafficLaneById.get(targetId),m=vehicleBounds(car);
  if(lane.junction||lane.laneChange||car.lock||car.dwell>0||!lane.adjacent.includes(targetId)||vehicleSize(car.model).body==='bus'&&!targetLane.busAllowed)return false;
  if(targetLane.toNode.segs.length>1&&!targetLane.connections.some(c=>vehicleSize(car.model).body!=='bus'||c.busAllowed))return false;
  const start=car.s,end=start+Math.max(24,car.speed*4.5),targetStart=start/lane.length*targetLane.length,targetEnd=end/lane.length*targetLane.length;
  if(start<m.d/2+13||end>laneEnd(lane)-m.d/2-14||targetEnd>laneEnd(targetLane)-m.d/2-14)return false;
  // 앞뒤 시간 간격과 이미 진행 중인 합류 공간 확보. 반대 방향 차로는 후보에서 제외.
  const pose=pathAt(targetLane,targetStart);
  for(const other of obstacles(pose)){
   if(other===car)continue;const dx=other.x-pose.x,dz=other.z-pose.z,along=dx*pose.dx+dz*pose.dz,across=Math.abs(dx*pose.dz-dz*pose.dx),b=vehicleBounds(other);
   if(other.path?.laneChange&&other.path.chain===lane.chain&&other.path.direction===lane.direction&&distance(car,other)<(end-start)+m.d+b.d)return false;
   if(across>(m.w+b.w)/2+.5)continue;
   const gap=(m.d+b.d)/2+TRAFFIC.gap+(along>=0?car.speed*1.2:other.speed*1.7+Math.max(0,other.speed-car.speed)*2);
   if(Math.abs(along)<gap)return false;
  }
  const points=[];for(let i=0;i<=40;i++){const t=i/40,q=t*t*t*(10-15*t+6*t*t),a=pathAt(lane,start+(end-start)*t),b=pathAt(targetLane,targetStart+(targetEnd-targetStart)*t);points.push([a.x+(b.x-a.x)*q,a.z+(b.z-a.z)*q]);}
  const path={...pathOf(points),id:`merge-${car.id}-${stats.laneChanges}`,laneChange:true,source:lane.id,next:targetId,endS:targetEnd,chain:lane.chain,direction:lane.direction};
  // 곡선의 접선은 각 꼭짓점에서 바뀐다. 1.5m 표본 사이에 긴 버스의
  // 꼬리만 잠깐 연석을 넘는 경로도 있으므로 양쪽 접선을 먼저 검사한다.
  // 실제 운행 프레임마다 검사하지 않고 차선 변경을 결정할 때만 수행.
  for(const s of path.lengths)for(const at of [Math.max(0,s-.0001),Math.min(path.length,s+.0001)])if(!bodyOnRoad(pathAt(path,at),m.w+.04,m.d+.04))return false;
  for(let s=0;s<=path.length;s+=1.5){const candidate={...car,...pathAt(path,s)};if(!bodyOnRoad(candidate,m.w,m.d)||(Array.isArray(player)?player:[player]).some(p=>vehicleContains(p,candidate,1.25))||obstacles(candidate).some(other=>other!==car&&bodiesOverlap(candidate,other,.15,.5)))return false;}
  if(frontGap(car).lead?.parked)stats.parkingPasses++;
  car.path=path;car.s=0;car.next=null;car.laneCheckAt=clock+10+random()*10;stats.laneChanges++;return true;
 }
 const interval=()=>TRAFFIC.intervalMin+random()*(TRAFFIC.intervalMax-TRAFFIC.intervalMin);
 const crossingCache=new Map();
 function pathsSeparate(a,b){
  const key=[a.id,b.id].sort().join('/');if(crossingCache.has(key))return crossingCache.get(key);
  let safe=true;
  if(safe)for(let s=0;s<=a.length+1;s+=2){const A={model:'rb520',...pathAt(a,s)};for(let t=0;t<=b.length+1;t+=2){if(bodiesOverlap(A,{model:'rb520',...pathAt(b,t)},.2,.3)){safe=false;break;}}if(!safe)break;}
  crossingCache.set(key,safe);return safe;
 }
 function canReserve(car,turn){
  if(!locks.has(turn.junction))return true;
  const owners=cars.filter(c=>c.lock===turn.junction);if(!owners.length)return false;
  return owners.every(other=>{const path=other.path.junction?other.path:other.next;
   if(!path)return false;
   const exit=trafficLaneById.get(turn.next),otherExit=trafficLaneById.get(path.next);
   // 같은 진입 차로에서 같은 출구 도로로 향하는 뒤차는 충분한 간격으로 통과.
   if(other.lane===car.lane&&exit.chain===otherExit.chain&&exit.direction===otherExit.direction)return !!other.path.junction&&other.s>(vehicleBounds(car).d+vehicleBounds(other).d)/2+TRAFFIC.gap+2;
   return pathsSeparate(turn,path);
  });
 }
 function release(car){const owner=cars.find(c=>c!==car&&c.lock===car.lock);if(owner)locks.set(car.lock,owner.id);else locks.delete(car.lock);car.lock=null;}
 function retire(car){if(car.lock)release(car);cells.get(car.trafficCell)?.delete(car);cars.splice(cars.indexOf(car),1);stats.retired++;}
 function add(lane,s=0,spec=chooseVehicle(random,{busAllowed:lane.busAllowed&&lane.connections.some(c=>c.busAllowed),active:cars})){
  const p=pathAt(lane,s),v={...spec,...p,id:++id,path:lane,lane:lane.id,s,travelled:0,speed:0,cruise:vehicleSize(spec.model).body==='bus'?5.8:5.5+random()*3,age:0,wait:0,dwell:0,stopAt:clock+28+random()*45,laneCheckAt:clock+1+random()*4,next:null,lock:null};
  if(obstacles(v).some(c=>bodiesOverlap(v,c,.22,TRAFFIC.gap))||cars.some(c=>c.path.laneChange&&c.path.chain===lane.chain&&distance(c,v)<c.path.length+12))return null;
  const ahead=frontGap(v);if(ahead.lead?.parked&&ahead.gap<38)return null;
  cars.push(v);indexCar(v);stats.spawned++;return v;
 }
 function populate(player,blocked=[]){
  const target=Math.min(limits.maxActive,cars.length+Math.max(0,limits.initialActive-cars.filter(c=>distance(c,player)<130).length));if(cars.length>=target)return;
  const candidates=[];for(const lane of trafficLanes.filter(l=>l.connections.length)){const stop=Math.min(lane.length,signalByLane.get(lane.id)?.stopS??Infinity)-trafficSpawnMargin;for(let s=8+random()*7;s<stop;s+=15){const p=pathAt(lane,s),d=distance(p,player);if(d>18&&d<130&&!blocked.some(v=>distance(p,v)<18))candidates.push({lane,s});}}
  for(let i=candidates.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
  for(const {lane,s} of candidates){add(lane,s);if(cars.length>=target)break;}
 }
 function reset(player){for(const car of [...cars])retire(car);clock=0;nextSpawn=interval();signals.reset();populate(player);}
 function step(dt,player){
  const players=Array.isArray(player)?player:[player];if(!players.length)return;
  player=players[0];const near=p=>Math.min(...players.map(v=>distance(p,v)));
  if(!(dt>0))return;dt=Math.min(dt,.05);clock+=dt;signals.step(dt,locks);
  // 정지 거리보다 넓은 주변 칸만 확인. 화면 밖 차량도 같은 운행 규칙 유지.
  cells.clear();for(const car of cars)indexCar(car);
  if(clock>=nextSpawn){
   nextSpawn=clock+interval();
   if(cars.length<limits.maxActive){const candidates=[];
    for(const lane of trafficLanes.filter(l=>l.connections.length)){
     const queued=id=>cars.filter(c=>c.lane===id&&c.speed<.2).length;
     if(queued(lane.id)>=2||lane.connections.every(c=>queued(c.next)>=2))continue;
     const stop=Math.min(lane.length,signalByLane.get(lane.id)?.stopS??Infinity)-trafficSpawnMargin;
     // 교차로 바로 뒤의 짧은 연결 차로는 비워 기존 대기 차량의 출구 보장.
     for(let s=lane.fromNode.segs.length===1?0:32;s<stop-16;s+=32){const p=pathAt(lane,s),d=near(p);if(d<TRAFFIC.spawnNear&&d>spawnDistance&&!spawnVisible(p,12))candidates.push({lane,s});}
    }
    const start=Math.floor(random()*candidates.length);for(let i=0;i<candidates.length;i++){const {lane,s}=candidates[(start+i)%candidates.length];if(add(lane,s))break;}
   }
  }
  // 같은 신호에서 긴 대기 순으로 교차로 확보
  for(const car of [...cars].sort((a,b)=>b.wait-a.wait||a.id-b.id)){
   car.age+=dt;const m=vehicleSize(car.model);let available=Infinity,target=car.cruise;
   if((near(car)>TRAFFIC.retireFar||car.age>180)&&!visible(car,m.d)){retire(car);continue;}
   if(car.lock&&car.path.id===car.exitLane&&car.s>m.d/2+1)release(car);
   if(!car.path.junction&&!car.path.laneChange&&clock>=car.laneCheckAt){
    car.laneCheckAt=clock+1.5+random()*2;const {gap,lead}=frontGap(car),blocked=gap<52&&lead&&lead.speed<car.cruise-1;
    const needsExit=car.path.toNode.segs.length>1&&!car.path.connections.some(c=>m.body!=='bus'||c.busAllowed);
    if(blocked||needsExit||random()<.12){const choices=car.path.adjacent.map(id=>({id,lane:trafficLaneById.get(id)})).map(o=>{const s=car.s/car.path.length*o.lane.length;return{...o,room:frontGap(car,pathAt(o.lane,s),o.lane,s).gap};}).sort((a,b)=>b.room-a.room);
     for(const choice of choices)if(choice.room>Math.max(18,gap+8)||!blocked&&choice.room>45){if(tryLaneChange(car,choice.id,players))break;}
    }
   }
   if(!car.path.junction&&!car.path.laneChange&&!car.next){
    const routes=car.path.connections.filter(c=>m.body==='bus'?c.busAllowed:!c.busOnly).map(c=>({c,kind:movementKind(car.path,c)}));
    // 출구 차로가 많은 방향이 과대 선택되지 않도록 이동 방향별 확률 배정.
    const choices=routes.map(({c,kind})=>({c,weight:({straight:6,left:1,right:2}[kind])/routes.filter(r=>r.kind===kind).length/(1+cars.filter(v=>v.lane===c.next&&v.s<65).length)**2}));
    let pick=random()*choices.reduce((sum,c)=>sum+c.weight,0);car.next=choices.find(c=>(pick-=c.weight)<0)?.c||choices.at(-1)?.c||null;
   }
   const signal=!car.path.junction&&!car.path.laneChange&&signalByLane.get(car.path.id),remaining=car.path.length-car.s,gate=(signal?signal.stopS-.45:car.path.length-7)-m.d/2;
   if(!car.path.junction&&!car.path.laneChange&&car.s>gate-24){
    if(!car.next){available=Math.max(0,gate-car.s);if(car.speed<.1&&!visible(car,m.d)){retire(car);continue;}}
    else if(!car.lock){
     car.wait+=dt;
     // 차체 뒤가 교차로를 벗어나는 위치에 안전 간격이 있으면 출구 사용 가능.
     const exitClear=turn=>{
      const lane=trafficLaneById.get(turn.next),reserved=cars.filter(c=>c!==car&&c.lock===turn.junction&&c.exitLane===turn.next&&c.path.id!==turn.next);
      // 서로 다른 신호 방향이 짧은 출구 하나를 쓸 때, 오래 기다린 정지선 차량의
      // 다음 녹색 몫을 남겨 한 방향이 매 주기 출구를 선점하지 않도록 한다.
      if(cars.some(c=>c!==car&&!c.lock&&c.next?.next===turn.next&&c.wait>Math.max(35,car.wait+10)&&!c.path.junction&&!c.path.laneChange&&c.s>=laneEnd(c.path)-vehicleSize(c.model).d/2-1.45))return false;
      // 아직 출구에 도착하지 않은 선행 차량 몫도 확보해 짧은 연결 도로의 과예약 방지.
      const s=m.d/2+1.5+reserved.reduce((n,c)=>n+vehicleBounds(c).d+TRAFFIC.gap,0);if(s>laneEnd(lane)-m.d/2-.45)return false;
      const out=pathAt(lane,s);return !obstacles(out).some(other=>other!==car&&bodiesOverlap({...car,...out},other,.15,TRAFFIC.gap));
     };
     const turnClear=turn=>{
      if(movementKind(car.path,turn)==='straight')return true;
      // 도로 폭에는 들어가도 버스의 꼬리가 옆 정지 차량을 스칠 수 있다.
      // 회전 전체의 차체 영역을 먼저 확인하고, 걸리면 정지선 뒤에서 양보.
      if(car.blockedTurn?.id===turn.id&&car.blockedTurn.until>clock)return false;
      const stopped=[...cars,...parked].filter(c=>c!==car&&c.speed<.2&&distance(c,car)<turn.length+20);
      for(let s=0;stopped.length&&s<=turn.length+1;s+=1.5){const pose={...car,...pathAt(turn,s)};if(stopped.some(c=>bodiesOverlap(pose,c,.15,.2))){car.blockedTurn={id:turn.id,until:clock+.2};return false;}}return true;
     };
     const ready=signal?car.s>=gate-Math.max(1,car.speed*.75):car.s>=gate-.3&&car.speed<.15&&car.wait>1.1;
     // 정지선에서 오래 기다렸다면 현재 허용되고 비어 있는 다른 출구 선택.
     if(ready&&car.wait>35&&car.speed<.1&&(!signal||!signals.canEnter(car.path,car.next)||!exitClear(car.next)||!turnClear(car.next)||!canReserve(car,car.next))){const alternate=car.path.connections.find(c=>c!==car.next&&(m.body==='bus'?c.busAllowed:!c.busOnly)&&(!signal||signals.canEnter(car.path,c))&&exitClear(c)&&turnClear(c)&&canReserve(car,c));if(alternate)car.next=alternate;}
     const permission=!signal||signals.canEnter(car.path,car.next);
     if(permission&&ready&&canReserve(car,car.next)){
      // 출구에도 여유가 있어야 교차로에 진입한다.
      if(exitClear(car.next)&&turnClear(car.next)){if(!locks.has(car.next.junction))locks.set(car.next.junction,car.id);car.lock=car.next.junction;car.exitLane=car.next.next;car.wait=0;if(car.signalWaiting){stats.signalDepartures++;car.signalWaiting=false;}}
     }
     if(!car.lock)available=Math.min(available,Math.max(0,gate-car.s));
     if(signal&&!permission&&car.speed<.1&&car.s>=gate-.1&&!car.signalWaiting){stats.signalStops++;car.signalWaiting=true;}
    }
   }
   available=Math.min(available,frontGap(car).gap);
   for(const player of players){const px=player.x-car.x,pz=player.z-car.z,along=px*car.dx+pz*car.dz,across=Math.abs(px*car.dz-pz*car.dx);
   if(along>-m.d/2&&across<m.w/2+1.25&&along<m.d/2+16){available=Math.min(available,Math.max(0,along-m.d/2-1.65));if(car.speed>.1)stats.playerYields++;}}
   // 간혹 짧게 정차. 교차로·횡단보도 부근에서는 실행하지 않는다.
   if(clock>=car.stopAt&&!car.path.junction&&!car.path.laneChange&&!car.lock&&car.s>m.d/2+15&&remaining>m.d/2+25){car.dwell=2+random()*4;car.stopAt=clock+60+random()*60;stats.stops++;}
   if(car.dwell>0){car.dwell-=dt;target=0;}
   target=Math.min(target,Math.sqrt(Math.max(0,2*TRAFFIC.braking*available)));
   car.speed+=Math.max(-TRAFFIC.braking*dt,Math.min(TRAFFIC.acceleration*dt,target-car.speed));
   // 높은 프레임률의 작은 첫 이동도 누적. 초기 가속이 매 프레임 0으로 돌아가지 않도록 처리.
   let travel=Math.min(car.speed*dt,available);if(travel<=0)car.speed=0;
   while(travel>0){
    const move=Math.min(travel,car.path.length-car.s),candidate=pathAt(car.path,car.s+move);
    const moved={...car,...candidate};
    if(players.some(p=>vehicleContains(p,moved,1.05))||obstacles(moved).some(other=>other!==car&&bodiesOverlap(moved,other,.05,.05))){car.speed=0;break;}
    car.s+=move;car.travelled+=move;travel-=move;Object.assign(car,candidate);
    if(cellOf(car)!==car.trafficCell){cells.get(car.trafficCell)?.delete(car);indexCar(car);}
    if(car.s>=car.path.length-.00001){
     if(car.path.laneChange){const endS=car.path.endS;car.path=trafficLaneById.get(car.path.next);car.lane=car.path.id;car.s=endS;car.next=null;Object.assign(car,pathAt(car.path,car.s));}
     else if(car.path.junction){car.path=trafficLaneById.get(car.path.next);car.lane=car.path.id;car.s=0;car.next=null;stats.turns++;}
     else if(car.next&&car.lock){car.path=car.next;car.s=0;car.next=null;}
     else {car.speed=0;break;}
    }
   }
  }
 }
 return{cars,locks,signals,stats,limits,step,reset,populate,add,tryLaneChange,ownsJunction:car=>car.lock===car.path.junction&&locks.has(car.lock),get clock(){return clock;},get nextSpawn(){return nextSpawn;}};
}
const trafficSpawnMargin=8;
