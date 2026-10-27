import {stationPlan} from './station-plan.js';

export const roadBounds={minX:-112,maxX:112,minZ:-162,maxZ:178};
export const sidewalkWidth=3.125;
export const treeSidewalkFraction=.2;
export const roads=[
 {id:'yulgok',name:'율곡로',width:7,points:[[-112,-72],[-43,-72],[5,-72],[58,-72],[112,-72]]},
 {id:'sejong',name:'세종로 · 태평로',width:10,points:[[-43,-72],[-43,-5],[-43,30],[-43,60],[-43,88],[-78,88],[-78,122]]},
 {id:'jongno',name:'종로',width:8,points:[[-112,-5],[-43,-5],[3,-5],[58,-5],[112,-5]]},
 {id:'cheonggye',name:'청계천 복개도로',width:6,points:[[-43,30],[58,30],[112,30]]},
 {id:'eulji',name:'을지로',width:7,points:[[-43,60],[-4,60],[58,60],[112,60]]},
 {id:'donhwa',name:'돈화문로',width:6,points:[[58,-72],[58,-5],[58,30],[58,60]]},
 {id:'changgyeong',name:'창경궁로',width:5,points:[[106,-162],[106,-72],[106,-5]]},
 {id:'toegye',name:'퇴계로',width:8,points:[[-112,122],[-78,122],[-58,122],[-43,122],[-43,113],[-4,113],[58,113],[112,113]]},
 {id:'myeongdong-west',name:'명동 서쪽길',width:5,points:[[-4,60],[-4,113]]},
 {id:'namdaemun-east',name:'숭례문 동쪽길',width:8,widths:[10,10,8,8],points:[[-43,88],[-43,93],[-43,101],[-43,113]]},
 {id:'station',name:'서울역 앞길',width:7,points:[[-58,122],[-58,stationPlan.roadZ],[-112,stationPlan.roadZ]]}
];
// 숭례문 섬과 사방 차도 주변은 보도·가로수 없이 정리.
export const namdaemunBare={minX:-86.125,maxX:-34.875,minZ:79.875,maxZ:129.125};
export const inBareIsland=(x,z)=>x>=namdaemunBare.minX&&x<=namdaemunBare.maxX&&z>=namdaemunBare.minZ&&z<=namdaemunBare.maxZ;
export const roadSegments=roads.flatMap(r=>r.points.slice(1).map((b,i)=>({road:r.id,width:r.width,startWidth:r.widths?.[i]??r.width,endWidth:r.widths?.[i+1]??r.width,a:r.points[i],b,vertical:b[0]===r.points[i][0]})));
export function roadPolygons(padding=0){
 const out=roadSegments.map(s=>{const dx=s.b[0]-s.a[0],dz=s.b[1]-s.a[1],length=Math.hypot(dx,dz),nx=dz/length,nz=-dx/length,ha=s.startWidth/2+padding,hb=s.endWidth/2+padding;return[[s.a[0]+nx*ha,s.a[1]+nz*ha],[s.b[0]+nx*hb,s.b[1]+nz*hb],[s.b[0]-nx*hb,s.b[1]-nz*hb],[s.a[0]-nx*ha,s.a[1]-nz*ha]];});
 for(const r of roads)for(let i=1;i<r.points.length-1;i++){const a=r.points[i-1],p=r.points[i],b=r.points[i+1];if((a[0]===p[0])===(p[0]===b[0]))continue;const h=(r.widths?.[i]??r.width)/2+padding;out.push([[p[0]-h,p[1]-h],[p[0]+h,p[1]-h],[p[0]+h,p[1]+h],[p[0]-h,p[1]+h]]);}
 return out;
}
const polygonCache=new Map();
function inConvex(x,z,ring){let sign=0;for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],cross=(b[0]-a[0])*(z-a[1])-(b[1]-a[1])*(x-a[0]);if(Math.abs(cross)<1e-8)continue;const next=Math.sign(cross);if(sign&&next!==sign)return false;sign=next;}return true;}
export function nearRoad(x,z,padding=0){
 if(x<roadBounds.minX||x>roadBounds.maxX||z<roadBounds.minZ||z>roadBounds.maxZ)return false;
 if(padding>0&&inBareIsland(x,z))return nearRoad(x,z);
 if(!polygonCache.has(padding))polygonCache.set(padding,roadPolygons(padding).map(ring=>({ring,minX:Math.min(...ring.map(p=>p[0])),maxX:Math.max(...ring.map(p=>p[0])),minZ:Math.min(...ring.map(p=>p[1])),maxZ:Math.max(...ring.map(p=>p[1]))})));
 return polygonCache.get(padding).some(r=>x>=r.minX&&x<=r.maxX&&z>=r.minZ&&z<=r.maxZ&&inConvex(x,z,r.ring));
}
export const onSidewalk=(x,z)=>nearRoad(x,z,sidewalkWidth)&&!nearRoad(x,z);
export function roadArmWidth(x,z,dx,dz){let width=0;for(const s of roadSegments){const along=s.vertical?dz:dx,offset=s.vertical?Math.abs(x-s.a[0]):Math.abs(z-s.a[1]),value=s.vertical?z+dz*.5:x+dx*.5,min=Math.min(s.vertical?s.a[1]:s.a[0],s.vertical?s.b[1]:s.b[0]),max=Math.max(s.vertical?s.a[1]:s.a[0],s.vertical?s.b[1]:s.b[0]);if(along&&offset<.01&&value>min&&value<max)width=Math.max(width,s.width);}return width;}
