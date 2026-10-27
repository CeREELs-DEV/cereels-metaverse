// 회현동의 외곽은 유지하고, 비탈을 따라 집과 꺾이는 골목을 맞물리는 배치.
export const HOEHYEON={minX:-24,maxX:64,minZ:122,maxZ:174,entry:{x:26,z:119},floor:'#ddcba7'};
// 서로 다른 깊이의 집무리를 엇갈린 골목에 붙인다. 골목이 블록 전체를 관통하는 격자는 피한다.
const clusters=[
 {x:-24,end:-1,bands:[[122,132,[6.8,7.2,6]],[135,145,[10.3,11.2]],[148,159,[7.4,6.2,6.4]],[162,173,[11.4,10.1]]]},
 {x:2,end:28,bands:[[122,130,[8,6.5,8.5]],[133,141,[6.8,8.4,7.8]],[144,152,[8.7,7.4,6.9]],[155,163,[7,8.8,7.2]],[166,173,[8.3,6.5,8.2]]]},
 {x:31,end:64,bands:[[122,132,[10,9,11]],[135,145,[9.1,11.2,9.7]],[148,159,[11,9.6,9.4]],[162,173,[7,7.2,7.8,6.5]]]}
];
const rows=clusters.flatMap((cluster,k)=>cluster.bands.map(([top,bottom,widths],r)=>{
 let left=cluster.x;
 return widths.map((w,c)=>{const p={x:left+w/2,z:(top+bottom)/2,w,d:bottom-top,cluster:k,row:r,col:c};left+=w+1.5;return p;});
}));
export const hillHomes=rows.flat().map((p,i)=>{
 const family=[2,9].includes(i)?'shop':[4,11,16,22,26,32,35].includes(i)?'slab':['hip','gable','split','hip'][i%4],flat=family==='slab',upper=[4,22,32].includes(i);
 const inset=[.10,.65,.30,.0,.80][i%5],shift=(i%2?1:-1)*inset/2;
 return{...p,z:p.z+shift,d:p.d-inset,id:`hoehyeon-${i}`,district:'hoehyeon',style:'hillside',h:upper?5.4:3.25+[.25,.5,.1,.4][i%4],seed:130+i,
  kind:family==='shop'?'shophouse':flat?'slab':'french',roof:flat?'flat':family==='hip'?'hip':family==='split'?'cross-gable':'gable',family,upper,turn:[3,8,27,30,37].includes(i)?Math.PI/2:[10,18,34].includes(i)?-Math.PI/2:0};
});
export const hillLanes=[
 {id:'perimeter',width:2.6,outer:true,points:[[-25.4,120.6],[65.4,120.6],[65.4,174.4],[-25.4,174.4],[-25.4,120.6]]},
 ...clusters.flatMap((cluster,k)=>cluster.bands.slice(0,-1).map((band,r)=>({id:`cross-${k}-${r}`,width:2.1,points:[[k===0?-25.4:cluster.x-1.5,(band[1]+cluster.bands[r+1][0])/2],[k===2?65.4:cluster.end+1.5,(band[1]+cluster.bands[r+1][0])/2]]}))),
 ...[.5,29.5].map((x,i)=>({id:`climb-spine-${i}`,width:2.2,points:[[x,120.6],[x,174.4]]})),
 ...rows.flatMap((row,r)=>row.slice(0,-1).map((p,c)=>({id:`climb-passage-${r}-${c}`,width:1.4,points:[[p.x+p.w/2+.75,p.z-p.d/2-1.5],[p.x+p.w/2+.75,p.z+p.d/2+1.5]]}))),
 {id:'station-link',width:3.2,points:[[-64,150],[-49,150],[-25.4,150]]},
 {id:'north-entry',width:2.5,points:[[26,119],[26,120.6]]}
];
export const hillHomeCoordinates=hillHomes.map(p=>[p.x,p.z,p.w,p.d]);
export const hillWalks=hillLanes.map(r=>r.points);
export const onHillPaving=(x,z)=>x>=-26.8&&x<=66.8&&z>=119.3&&z<=175.8;
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function hillRelief(x,z){
 if(!onHillPaving(x,z))return 0;
 const edge=smooth((x+26.8)/12)*smooth((66.8-x)/12)*smooth((z-120)/12)*smooth((175.8-z)/8);
 return edge*(.55+1.55*smooth((153-z)/6)+1.65*smooth((139-z)/6));
}
export function hillLocalSize(p){return p.turn?{w:p.d,d:p.w}:{w:p.w,d:p.d};}
export function hillToWorld(p,x,z){const c=Math.cos(p.turn||0),s=Math.sin(p.turn||0);return{x:p.x+x*c+z*s,z:p.z-x*s+z*c};}
export function hillHouseLayout(p){
 const {w,d}=hillLocalSize(p),side=p.seed%2?1:-1;
 const rear=!p.upper&&p.family!=='slab'&&p.seed%3!==0,mw=w-1.85,md=rear?d*.63:d-1.55,mx=-side*.60,front=d/2-.975,mz=front-md/2;
 return{w,d,side,mw,md,mx,mz,front,doorX:mx+side*mw*.22,wingX:side*(w/2-.88),wingZ:-d*.18,wingW:1.6,wingD:d*.53,
  rear:rear?{x:mx-side*.25,z:-d/2+(d-md-.4)/2+.2,w:mw*.78,d:d-md-.4}:null};
}
export function hillApproach(p){const a=hillHouseLayout(p);return hillToWorld(p,a.doorX,a.front+1.28);}
