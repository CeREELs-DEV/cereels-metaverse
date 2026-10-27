// 역사·복선·광장이 공유하는 배치. 열차 반복 전환점은 건물 안과 맵 바깥.
export const stationPlan={
 x:-81,z:133.5,width:28,depth:10,
 entry:{x:-81,z:143},
 tracks:[131.5,135.5],west:-164,inside:-80,speed:4,dwell:5,
 roadZ:158.8,
 plot:{x:-85,z:137.5,w:46,d:33},
 plaza:{minX:-107,maxX:-63,minZ:139,maxZ:152.8},
 benches:[[-94,141.8],[-89.5,141.8],[-72.5,141.8],[-68,141.8]],
 trees:[[-105,141.8],[-64.5,141.8]]
};
export function stationTrainPose(time,index){
 const p=stationPlan,travel=(p.inside-p.west)/p.speed,period=travel+p.dwell,phase=((time+index*11)%period+period)%period;
 const distance=Math.min(travel,phase)*p.speed;
 return{x:index?p.inside-distance:p.west+distance,z:p.tracks[index],turn:index?Math.PI:0};
}
export function stationForecourt(x,z){const p=stationPlan.plaza;return x>=p.minX-1&&x<=p.maxX+2&&z>=p.minZ-1&&z<=p.maxZ+3;}
