// 역사·복선·광장이 공유하는 배치. 열차 반복 전환점은 건물 안과 맵 바깥.
export const stationPlan={
 x:-81,z:145.5,width:28,depth:10,
 entry:{x:-81,z:155},
 tracks:[143.5,147.5],west:-164,inside:-80,speed:4,dwell:5,
 roadZ:180,
 plot:{x:-85,z:157.5,w:46,d:35},
 plaza:{minX:-107,maxX:-63,minZ:151,maxZ:174},
 benches:[[-94,153.8],[-89.5,153.8],[-72.5,153.8],[-68,153.8],[-100,168.8],[-70,168.8]],
 trees:[[-105,153.8],[-64.5,153.8],[-105,169],[-64.5,169]]
};
export function stationTrainPose(time,index){
 const p=stationPlan,travel=(p.inside-p.west)/p.speed,period=travel+p.dwell,phase=((time+index*11)%period+period)%period;
 const distance=Math.min(travel,phase)*p.speed;
 return{x:index?p.inside-distance:p.west+distance,z:p.tracks[index],turn:index?Math.PI:0};
}
export function stationForecourt(x,z){const p=stationPlan.plaza;return x>=p.minX-1&&x<=p.maxX+2&&z>=p.minZ-1&&z<=p.maxZ+3;}
