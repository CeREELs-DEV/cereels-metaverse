export const SIGNAL_TIMING=Object.freeze({left:10,green:14,yellow:3,clear:1.5,walk:8,blink:3});
export function createSignalController({signalJunctions,signalByLane,movementKind}){
 const states=new Map(signalJunctions.map((j,index)=>{
  const phases=j.groups.flatMap((_,group)=>[{kind:'left',group,duration:SIGNAL_TIMING.left},{kind:'yellow',group,duration:SIGNAL_TIMING.yellow},{kind:'clear',duration:SIGNAL_TIMING.clear},{kind:'green',group,duration:SIGNAL_TIMING.green},{kind:'yellow',group,duration:SIGNAL_TIMING.yellow},{kind:'clear',duration:SIGNAL_TIMING.clear}]);
  phases.push({kind:'walk',duration:SIGNAL_TIMING.walk},{kind:'blink',duration:SIGNAL_TIMING.blink},{kind:'clear',duration:SIGNAL_TIMING.clear});
  return[j.id,{phases,index:index%j.groups.length*6,elapsed:0}];
 }));
 function reset(){let i=0;for(const [id,s] of states){s.index=i++%signalJunctions.find(j=>j.id===id).groups.length*6;s.elapsed=0;}}
 function step(dt,occupied){for(const [id,s] of states){s.elapsed+=dt;const phase=s.phases[s.index];if(s.elapsed<phase.duration)continue;
  // 진입한 긴 차량이 교차로를 다 빠져나갈 때까지 다음 통행 방향을 열지 않는다.
  if(phase.kind==='clear'&&occupied?.has(id)){s.elapsed=phase.duration;continue;}
  s.elapsed-=phase.duration;s.index=(s.index+1)%s.phases.length;
 }}
 function phase(id){const s=states.get(id);return s?{...s.phases[s.index],elapsed:s.elapsed}:null;}
 function lamps(approach){const p=phase(approach.junction),own=p?.group===approach.group;return{red:!own||p.kind==='left',yellow:own&&p.kind==='yellow',left:own&&p.kind==='left',green:own&&p.kind==='green',walk:p?.kind==='walk'||p?.kind==='blink'&&Math.floor(p.elapsed*2)%2===0};}
 function canEnter(lane,connection){const a=signalByLane.get(lane.id);if(!a)return true;const p=phase(a.junction);return p.group===a.group&&(movementKind(lane,connection)==='left'?p.kind==='left':p.kind==='green');}
 function accept(values){for(const value of values){const state=states.get(value.id);if(state&&state.phases[value.index]){state.index=value.index;state.elapsed=value.elapsed;}}}
 return{step,reset,phase,lamps,canEnter,states,accept};
}
