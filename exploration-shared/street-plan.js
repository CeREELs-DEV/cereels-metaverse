import {stationForecourt} from './station-plan.js';
import {roads,sites,distanceToSegment} from './plan.js';
import {sidewalkWidth,treeSidewalkFraction,inBareIsland,onSidewalk,roadArmWidth} from './road-plan.js';
export {sidewalkWidth};
const directions=[{name:'n',dx:0,dz:-1,axis:'ns',yaw:Math.PI,corner:'nw'},{name:'s',dx:0,dz:1,axis:'ns',yaw:0,corner:'se'},{name:'e',dx:1,dz:0,axis:'ew',yaw:Math.PI/2,corner:'ne'},{name:'w',dx:-1,dz:0,axis:'ew',yaw:-Math.PI/2,corner:'sw'}];
export const junctions=[['sejong-yulgok',-43,-72],['donhwa-yulgok',58,-72],['sejong-jongno',-43,-5],['donhwa-jongno',58,-5],['sejong-eulji',-43,60],['donhwa-eulji',58,60],['myeongdong-eulji',-4,60]].map(([id,x,z])=>{const arms=directions.map(a=>({...a,width:roadArmWidth(x,z,a.dx,a.dz)})).filter(a=>a.width);return{id,x,z,arms,ns:Math.max(0,...arms.filter(a=>a.axis==='ns').map(a=>a.width)),ew:Math.max(0,...arms.filter(a=>a.axis==='ew').map(a=>a.width))};});
export const crossingPlan=[...junctions.flatMap(j=>j.arms.map(a=>({id:j.id+'-'+a.name,junction:j.id,approach:a.name,x:j.x+a.dx*((a.axis==='ns'?j.ew:j.ns)/2+2.65),z:j.z+a.dz*((a.axis==='ns'?j.ew:j.ns)/2+2.65),axis:a.axis,length:a.width,depth:2.4}))),...[
 ['gwanghwamun',-75,-72,'ew',7],['namdaemun',-43,104,'ns',8],['myeongdong',-4,86,'ns',5],['station',-58,150,'ns',7]
].map(([id,x,z,axis,length])=>({id,x,z,axis,length,depth:2.4}))];
function corner(j,name){return{x:j.x+(name.endsWith('e')?1:-1)*(j.ns/2+.8),z:j.z+(name.startsWith('s')?1:-1)*(j.ew/2+.8)};}
export const signalPoles=junctions.flatMap(j=>['nw','ne','se','sw'].map(name=>({id:j.id+'-'+name,junction:j.id,...corner(j,name),height:j.arms.some(a=>a.corner===name)?4.9:3.1})));
export const signalHeads=junctions.flatMap(j=>j.arms.map(a=>{const p=corner(j,a.corner),half=(a.axis==='ns'?j.ew:j.ns)/2;return{id:j.id,approach:a.name,axis:a.axis,width:a.width,yaw:a.yaw,poleX:p.x,poleZ:p.z,x:a.axis==='ns'?j.x+a.dz*a.width/4:p.x,z:a.axis==='ew'?j.z-a.dx*a.width/4:p.z,height:4.6,stop:{x:j.x+a.dx*(half+4.9)+a.dz*a.width/4,z:j.z+a.dz*(half+4.9)-a.dx*a.width/4}};}));
const pedCorners={n:[['nw',Math.PI/2],['ne',-Math.PI/2]],s:[['sw',Math.PI/2],['se',-Math.PI/2]],e:[['ne',0],['se',Math.PI]],w:[['nw',0],['sw',Math.PI]]};
export const pedestrianHeads=junctions.flatMap(j=>j.arms.flatMap(a=>pedCorners[a.name].map(([name,yaw])=>{const p=corner(j,name);return{id:j.id+'-'+a.name+'-'+name,junction:j.id,crossing:j.id+'-'+a.name,x:p.x+Math.sin(yaw)*.32,z:p.z+Math.cos(yaw)*.32,yaw,height:2.65};})));
const durations=[10,2,3,10,2,4,7,3,2];
export const signalCycle=durations.reduce((a,b)=>a+b,0);
export function signalPhase(time){let t=((time%signalCycle)+signalCycle)%signalCycle;for(let index=0;index<durations.length;index++){if(t<durations[index])return{index,elapsed:t};t-=durations[index];}return{index:0,elapsed:0};}
export const greenFor=(axis,index)=>index===(axis==='ns'?0:3);
export const amberFor=(axis,index)=>index===(axis==='ns'?1:4);
export const pedestrianFor=index=>index===6||index===7;
export function curbTrees(solids=[]){const out=[];
 for(const r of roads)for(let i=1;i<r.points.length;i++){
  const a=r.points[i-1],b=r.points[i],vertical=a[0]===b[0],min=Math.min(a[vertical?1:0],b[vertical?1:0]),max=Math.max(a[vertical?1:0],b[vertical?1:0]);
  for(let t=Math.ceil((min+5)/12)*12;t<max-5;t+=12)for(const side of [-1,1]){
   const offset=r.width/2+sidewalkWidth*treeSidewalkFraction,x=vertical?a[0]+side*offset:t,z=vertical?t:a[1]+side*offset;
   if(!onSidewalk(x,z)||inBareIsland(x,z)||roads.some(q=>q!==r&&q.points.some((p,n)=>n&&distanceToSegment(x,z,q.points[n-1],p)<q.width/2+4)))continue;
   if(stationForecourt(x,z))continue;
   if(crossingPlan.some(p=>Math.hypot(x-p.x,z-p.z)<7)||sites.some(s=>Math.hypot(x-s.entry.x,z-s.entry.z)<5))continue;
   if(solids.some(s=>Math.abs(x-s.x)<s.w/2+2&&Math.abs(z-s.z)<s.d/2+2)||out.some(p=>Math.hypot(p.x-x,p.z-z)<5))continue;
   out.push({x,z,road:r.id,offset});
  }
 }return out;
}

// 같은 격자 반복 대신 작은 마당을 사이에 둔 상가 묶음
export const infillBlocks=[
 {x:-19,z:-45,front:5,homes:[[-10,-11,7,6],[3,-12,9,7],[-10,1,7,7],[4,10,8,6],[-10,19,6,5]]},
 {x:26,z:-59,front:5,homes:[[-12,0,8,6],[0,-1,7,5],[13,1,8,7]]},
 {x:42,z:-40,front:5,homes:[[0,-8,7,6],[1,5,6,7]]},
 {x:89,z:14,front:7,homes:[[-11,-3,7,7],[0,-5,8,6],[11,-2,6,7]]},
 {x:24,z:44,front:6,homes:[[-17,-2,7,6],[-5,-3,8,7],[7,-1,7,5],[18,-2,6,6]]},
 {x:88,z:44,front:6,homes:[[-11,-2,7,6],[0,-3,8,7],[12,-1,7,6]]},
 {x:-86,z:72,front:7,homes:[[-15,-4,7,6],[-4,-5,9,7],[9,-2,7,6],[-15,9,7,6],[-3,10,8,5]]},
 {x:-95,z:99,front:6,homes:[[-6,-3,7,6],[7,-5,7,7],[-6,10,7,5]]},
 {x:-55,z:13,front:6,homes:[[0,-4,6,6],[0,8,6,6]]}
];
