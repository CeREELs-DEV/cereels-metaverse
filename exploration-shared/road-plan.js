import {stationPlan} from './station-plan.js';

export const roadBounds={minX:-112,maxX:112,minZ:-162,maxZ:178};
export const sidewalkWidth=3.125;
export const treeSidewalkFraction=.2;
export const boulevard={x:-48,width:20,lanes:4,median:3.6};
export const admiralIsland={x:-48,z:-20,w:3.6,d:7.5};
export const inRoadIsland=(x,z)=>Math.abs(x-admiralIsland.x)<admiralIsland.w/2&&Math.abs(z-admiralIsland.z)<admiralIsland.d/2;
export const mergeZone={start:4,end:24};
export function mergeSection(z){const u=Math.max(0,Math.min(1,(z-mergeZone.start)/(mergeZone.end-mergeZone.start))),t=u*u*(3-2*u);return{x:-48+5*t,width:20-10*t,median:3.6*(1-t),t};}
export const mergeSamples=Array.from({length:21},(_,i)=>{const z=mergeZone.start+i;return{z,...mergeSection(z)};});
export const roads=[
 {id:'yulgok',name:'율곡로',width:7,points:[[-112,-72],[-48,-72],[5,-72],[58,-72],[112,-72]]},
 {id:'sejong',name:'광화문 앞 세종로',...boulevard,points:[[-48,-72],[-48,-5],[-48,4]]},
 {id:'sejong-merge',name:'태평로 합류',width:20,transition:true,points:mergeSamples.map(p=>[p.x,p.z])},
 {id:'taepyeong',name:'태평로',width:10,points:[[-43,24],[-43,30],[-43,60],[-43,88],[-78,88],[-78,122]]},
 {id:'jongno',name:'종로',width:8,points:[[-112,-5],[-48,-5],[3,-5],[58,-5],[112,-5]]},
 {id:'cheonggye',name:'청계천 복개도로',width:6,points:[[-43,30],[58,30],[112,30]]},
 {id:'eulji',name:'을지로',width:7,points:[[-43,60],[-4,60],[58,60],[112,60]]},
 {id:'donhwa',name:'돈화문로',width:6,points:[[58,-72],[58,-5],[58,30],[58,60]]},
 {id:'changgyeong',name:'창경궁로',width:5,points:[[106,-162],[106,-72],[106,-5]]},
 {id:'toegye',name:'퇴계로',width:8,points:[[-112,122],[-78,122],[-58,122],[-43,122],[-43,113],[-4,113],[58,113],[112,113]]},
 {id:'myeongdong-west',name:'명동 서쪽길',width:5,points:[[-4,60],[-4,113]]},
 {id:'namdaemun-east',name:'숭례문 동쪽길',width:10,points:[[-43,88],[-43,126]]},
 {id:'station',name:'서울역 앞길',width:7,points:[[-58,122],[-58,stationPlan.roadZ],[-112,stationPlan.roadZ]]}
];
// 숭례문 섬 안쪽만 보도 제외. 사방 차도 바깥 블록의 인도는 연속 유지.
export const namdaemunBare={minX:-73,maxX:-48,minZ:93,maxZ:118};
export const inBareIsland=(x,z)=>x>=namdaemunBare.minX&&x<=namdaemunBare.maxX&&z>=namdaemunBare.minZ&&z<=namdaemunBare.maxZ;
export const roadSegments=roads.filter(r=>!r.transition).flatMap(r=>r.points.slice(1).map((b,i)=>({road:r.id,width:r.width,startWidth:r.widths?.[i]??r.width,endWidth:r.widths?.[i+1]??r.width,a:r.points[i],b,vertical:b[0]===r.points[i][0]})));
export function roadPolygons(padding=0){
 const out=roadSegments.map(s=>{const dx=s.b[0]-s.a[0],dz=s.b[1]-s.a[1],length=Math.hypot(dx,dz),ux=dx/length,uz=dz/length,nx=uz,nz=-ux,ha=s.startWidth/2+padding,hb=s.endWidth/2+padding,a=[s.a[0]-ux*padding,s.a[1]-uz*padding],b=[s.b[0]+ux*padding,s.b[1]+uz*padding];return[[a[0]+nx*ha,a[1]+nz*ha],[b[0]+nx*hb,b[1]+nz*hb],[b[0]-nx*hb,b[1]-nz*hb],[a[0]-nx*ha,a[1]-nz*ha]];});
 for(const r of roads.filter(r=>!r.transition))for(let i=1;i<r.points.length-1;i++){const a=r.points[i-1],p=r.points[i],b=r.points[i+1];if((a[0]===p[0])===(p[0]===b[0]))continue;const h=(r.widths?.[i]??r.width)/2+padding;out.push([[p[0]-h,p[1]-h],[p[0]+h,p[1]-h],[p[0]+h,p[1]+h],[p[0]-h,p[1]+h]]);}
 // 동쪽 경계는 고정하고 서쪽만 완만히 접는다. 보도는 같은 선을 바깥으로 확장한다.
 for(let i=1;i<mergeSamples.length;i++){
  const a=mergeSamples[i-1],b=mergeSamples[i],l0=a.x-a.width/2,l1=b.x-b.width/2,slope=(l1-l0)/(b.z-a.z),extra=padding*Math.sqrt(1+slope*slope);
  out.push([[l0-slope*padding-extra,a.z-padding],[-38+padding,a.z-padding],[-38+padding,b.z+padding],[l1+slope*padding-extra,b.z+padding]]);
 }
 return out;
}
const polygonCache=new Map();
function inConvex(x,z,ring){let sign=0;for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],cross=(b[0]-a[0])*(z-a[1])-(b[1]-a[1])*(x-a[0]);if(Math.abs(cross)<1e-8)continue;const next=Math.sign(cross);if(sign&&next!==sign)return false;sign=next;}return true;}
export function nearRoad(x,z,padding=0){
 if(x<roadBounds.minX||x>roadBounds.maxX||z<roadBounds.minZ||z>roadBounds.maxZ)return false;
 if(inRoadIsland(x,z))return padding>0;
 if(padding>0&&inBareIsland(x,z))return nearRoad(x,z);
 if(!polygonCache.has(padding))polygonCache.set(padding,roadPolygons(padding).map(ring=>({ring,minX:Math.min(...ring.map(p=>p[0])),maxX:Math.max(...ring.map(p=>p[0])),minZ:Math.min(...ring.map(p=>p[1])),maxZ:Math.max(...ring.map(p=>p[1]))})));
 return polygonCache.get(padding).some(r=>x>=r.minX&&x<=r.maxX&&z>=r.minZ&&z<=r.maxZ&&inConvex(x,z,r.ring));
}
export const onSidewalk=(x,z)=>nearRoad(x,z,sidewalkWidth)&&!nearRoad(x,z);
export function roadArmMedian(x,z,dx,dz){return dx===0&&x===boulevard.x&&z>=-72&&z<=4?boulevard.median:0;}
export function roadArmWidth(x,z,dx,dz){let width=0;for(const s of roadSegments){const along=s.vertical?dz:dx,offset=s.vertical?Math.abs(x-s.a[0]):Math.abs(z-s.a[1]),value=s.vertical?z+dz*.5:x+dx*.5,min=Math.min(s.vertical?s.a[1]:s.a[0],s.vertical?s.b[1]:s.b[0]),max=Math.max(s.vertical?s.a[1]:s.a[0],s.vertical?s.b[1]:s.b[0]);if(along&&offset<.01&&value>min&&value<max)width=Math.max(width,s.width);}return width;}
