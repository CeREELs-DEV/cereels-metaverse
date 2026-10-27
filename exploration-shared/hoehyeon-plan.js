// 같은 외곽 부지 안에서 집과 골목을 맞물리는 회현동 배치.
export const HOEHYEON={minX:-24,maxX:64,minZ:122,maxZ:174,entry:{x:26,z:119},floor:'#dec99e'};
const widths=[8.6,10.5,9.0,10.2,9.4,10.0,9.4],xs=[-18,-5.5,7,19.5,32,44.5,57],zs=[127.3,140.5,153,166.5],shifts=[0,1.05,-.9,.4];
export const hillHomes=zs.flatMap((z,row)=>xs.map((x,col)=>{
 const seed=row*7+col,flat=[0,5,9,14,19,24].includes(seed),store=seed===6||seed===21;
 return{id:`hoehyeon-${seed}`,district:'hoehyeon',style:'hillside',x:x+shifts[row],z:z+([-.35,.35,-.3,.25][col%4]),w:widths[col],d:[8.0,8.8,9.6,9.1][seed%4],
  h:seed===9||seed===24?4.65:2.75+(seed%3)*.15,seed:130+seed,kind:store?'shophouse':flat?'slab':'french',roof:flat?'flat':seed%4===0?'cross-gable':'gable',row,col};
}));
const crossZ=[0,1,2].map(row=>(Math.max(...hillHomes.filter(p=>p.row===row).map(p=>p.z+p.d/2))+Math.min(...hillHomes.filter(p=>p.row===row+1).map(p=>p.z-p.d/2)))/2);
export const hillLanes=[
 {id:'perimeter',width:2.6,outer:true,points:[[-25.4,120.6],[65.4,120.6],[65.4,174.4],[-25.4,174.4],[-25.4,120.6]]},
 ...crossZ.map((z,i)=>({id:`cross-${i}`,width:2.8,points:[[-25.4,z],[65.4,z]]})),
 ...[0,1,2,3,4,5].map(col=>{const points=[];for(let row=0;row<4;row++){
  const a=hillHomes[row*7+col],b=hillHomes[row*7+col+1],x=(a.x+a.w/2+b.x-b.w/2)/2;
  const top=row===0?120.6:crossZ[row-1],bottom=row===3?174.4:crossZ[row];
  points.push([x,top],[x,bottom]);
 }return{id:`climb-${col}`,width:2.05,points};}),
 {id:'station-link',width:3.2,points:[[-64,150],[-49,150],[-25.4,150]]},
 {id:'north-entry',width:2.5,points:[[26,119],[26,120.6]]}
];
export const hillHomeCoordinates=hillHomes.map(p=>[p.x,p.z,p.w,p.d]);
export const hillWalks=hillLanes.map(r=>r.points);
export const onHillPaving=(x,z)=>x>=-26.8&&x<=66.8&&z>=119.3&&z<=175.8;
export function hillApproach(p){return{x:p.x-p.w*.17,z:p.z+p.d/2+.7};}
