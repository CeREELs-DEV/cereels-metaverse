import {stationForecourt} from './station-plan.js';
import {roads,sites,distanceToSegment} from './plan.js';

export const sidewalkWidth=2.5;
export const junctions=[{id:'sejong-jongno',x:-43,z:-5,ew:8,ns:10},{id:'donhwa-jongno',x:58,z:-5,ew:8,ns:6},{id:'sejong-eulji',x:-43,z:60,ew:7,ns:10},{id:'donhwa-eulji',x:58,z:60,ew:7,ns:6,southClosed:true}];
export const crossingPlan=[...junctions.flatMap(j=>[
 ...(!j.southClosed?[{x:j.x,z:j.z+j.ew/2+3,axis:'ns',length:j.ns}]:[]),
 {x:j.x,z:j.z-j.ew/2-3,axis:'ns',length:j.ns},
 {x:j.x+j.ns/2+3,z:j.z,axis:'ew',length:j.ew},
 {x:j.x-j.ns/2-3,z:j.z,axis:'ew',length:j.ew}
]),{x:-43,z:116,axis:'ns',length:8},{x:-4,z:86,axis:'ns',length:5},{x:-58,z:160,axis:'ns',length:7}];
export const signalHeads=junctions.flatMap(j=>[
 ...(!j.southClosed?[{id:j.id,axis:'ns',x:j.x+j.ns/2+1,z:j.z+j.ew/2+2,yaw:0}]:[]),
 {id:j.id,axis:'ns',x:j.x-j.ns/2-1,z:j.z-j.ew/2-2,yaw:Math.PI},
 {id:j.id,axis:'ew',x:j.x+j.ns/2+2,z:j.z-j.ew/2-1,yaw:Math.PI/2},
 {id:j.id,axis:'ew',x:j.x-j.ns/2-2,z:j.z+j.ew/2+1,yaw:-Math.PI/2}
]);
export function signalPhase(time){const t=((time%28)+28)%28;return t<12?{index:0,elapsed:t}:t<14?{index:1,elapsed:t-12}:t<26?{index:2,elapsed:t-14}:{index:3,elapsed:t-26};}
export function greenFor(axis,index){return axis==='ns'?index===0:index===2;}
export function curbTrees(solids=[]){const out=[];
 for(const r of roads)for(let i=1;i<r.points.length;i++){
  const a=r.points[i-1],b=r.points[i],vertical=a[0]===b[0],min=Math.min(a[vertical?1:0],b[vertical?1:0]),max=Math.max(a[vertical?1:0],b[vertical?1:0]);
  for(let t=Math.ceil((min+5)/12)*12;t<max-5;t+=12)for(const side of [-1,1]){
   const x=vertical?a[0]+side*(r.width/2+1.25):t,z=vertical?t:a[1]+side*(r.width/2+1.25);
   if(roads.some(q=>q!==r&&q.points.some((p,n)=>n&&distanceToSegment(x,z,q.points[n-1],p)<q.width/2+4)))continue;
   if(stationForecourt(x,z))continue;
   if(crossingPlan.some(p=>Math.hypot(x-p.x,z-p.z)<7)||sites.some(s=>Math.hypot(x-s.entry.x,z-s.entry.z)<5))continue;
   if(solids.some(s=>Math.abs(x-s.x)<s.w/2+2&&Math.abs(z-s.z)<s.d/2+2)||out.some(p=>Math.hypot(p.x-x,p.z-z)<5))continue;
   out.push({x,z,road:r.id,offset:r.width/2+1.25});
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
