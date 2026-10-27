// 회현동 외곽은 유지하고 서로 붙은 집·작은 마당·꺾인 골목을 개별 배치.
export const HOEHYEON={minX:-24,maxX:64,minZ:122,maxZ:174,entry:{x:26,z:119},floor:'#ddcba7'};
// 서쪽·중앙·동쪽의 집마다 다른 앞선과 깊이. 같은 폭의 줄을 반복하지 않는다.
const parcels=[
 [-24,-12,122,131.5,'pair',true],[-9.5,1.3,122,131.5,'slab',false],
 [-24,-11.5,137,144.5,'pair',true],[-7.2,2.5,139.5,143.8,'slab',false],
 [-24,-14.2,153,161.8,'hip',true],[-10,3.5,149,161.5,'pair',true],
 [-24,-10.5,166.4,173,'pair',false],[-5.6,4.5,167.4,173,'slab',false],
 [5,23.8,122,129.6,'pair',false],[6.5,17.8,135.5,141.8,'hip',false],
 [8.5,23.8,146.6,153.8,'pair',false],[6.2,15.8,156.3,160.8,'slab',false],
 [7.3,15.8,166,173,'slab',true],[20.3,33.8,159,165.7,'pair',false],
 [28.4,40.6,122,129.7,'pair',false],[45.4,64,122,133.8,'pair',true],
 [28.3,36.8,134.5,141,'slab',false],[39.1,49.2,138.5,146.7,'hip',false],
 [52,64,138.6,146.6,'slab',true],[28.4,36.8,144,153.6,'slab',true],
 [42,48,153.4,162.7,'gable',false],[50.7,64,153,162.5,'pair',true],
 [38.4,49.5,168,173,'slab',false],[52,64,167.5,173,'gable',false]
];
export const hillHomes=parcels.map(([x0,x1,z0,z1,family,yard],i)=>({id:`hoehyeon-${i}`,parcel:true,district:'hoehyeon',style:'hillside',x:(x0+x1)/2,z:(z0+z1)/2,w:x1-x0,d:z1-z0,
 family,yard,kind:[6,22].includes(i)?'shophouse':family==='slab'?'slab':'french',seed:130+i,h:[1,18].includes(i)?5.4:3.4+(i%3)*.22,turn:0,upper:[1,18].includes(i),forecourt:yard?2.55:1.05}));
export function hillUnits(p){
 if(!p.parcel)return[p];
 if(p.family!=='pair')return[{...p,parcel:false}];
 const width=p.w-.8,left=width*(p.seed%2?.46:.56),right=width-left,depth=p.d-.3;
 return [
  {...p,id:p.id+'-a',parcelId:p.id,parcel:false,tight:true,x:p.x-width/2+left/2,z:p.z-.15,w:left,d:depth-.25,family:'slab',kind:p.kind==='shophouse'?'shophouse':'slab',upper:false,h:3.35+(p.seed%3)*.3},
  {...p,id:p.id+'-b',parcelId:p.id,parcel:false,tight:true,x:p.x+width/2-right/2,z:p.z+(p.seed%2?.25:-.30),w:right,d:depth-.5,family:p.seed%3===0?'slab':'hip',kind:'french',upper:false,h:p.seed%3===0?4.6:3.0+(p.seed%2)*.2,seed:p.seed+37}
 ];
}
export const hillDwellings=hillHomes.flatMap(hillUnits);
export const hillLanes=[
 {id:'perimeter',width:2.6,outer:true,points:[[-25.4,120.6],[65.4,120.6],[65.4,174.4],[-25.4,174.4],[-25.4,120.6]]},
 {id:'climb-main',width:2.6,points:[[26,119],[26,132],[20,132],[20,144],[26,144],[26,156],[18,156],[18,168],[22,168],[22,174.4]]},
 {id:'cross-north-west',width:2.2,points:[[-25.4,134],[-9,134],[-9,137],[4,137],[4,132],[20,132]]},
 {id:'cross-north-east',width:2.2,points:[[26,132],[43,132],[43,136],[65.4,136]]},
 {id:'cross-west',width:2.2,points:[[-25.4,150],[-12,150],[-12,146],[6,146],[6,144],[20,144]]},
 {id:'cross-east',width:2.2,points:[[26,156],[39,156],[39,151],[49,151],[49,149],[65.4,149]]},
 {id:'cross-south-west',width:2.2,points:[[-25.4,164],[-8,164],[-8,165],[7,165],[7,163],[18,163]]},
 {id:'cross-south-east',width:2.2,points:[[18,168],[36,168],[36,165],[65.4,165]]},
 {id:'climb-west-pocket',width:1.8,points:[[-12,150],[-12,164]]},
 {id:'climb-east-pocket',width:1.8,points:[[50.5,136],[50.5,149]]},
 {id:'station-link',width:3.2,points:[[-64,150],[-49,150],[-25.4,150]]}
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
 const rear=!p.tight&&!p.upper&&p.family!=='slab'&&p.seed%3!==0,mw=p.tight?w:w-1.85,front=d/2-(p.forecourt||.975),md=Math.min(rear?d*.63:d-1.55,front+d/2-.65),mx=p.tight?0:-side*.60,mz=front-md/2;
 return{w,d,side,mw,md,mx,mz,front,doorX:mx+side*mw*.22,wingX:side*(w/2-.88),wingZ:-d*.18,wingW:1.6,wingD:d*.53,
  rear:rear?{x:mx-side*.25,z:-d/2+(d-md-.4)/2+.2,w:mw*.78,d:d-md-.4}:null};
}
export function hillApproach(p){const q=p.parcel?hillUnits(p)[0]:p,a=hillHouseLayout(q);return hillToWorld(q,a.doorX,a.front+1.28);}
