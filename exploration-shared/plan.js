import {stationPlan} from './station-plan.js';
import {roads,roadBounds as bounds,nearRoad} from './road-plan.js';
export {roads,bounds,nearRoad};
// 1.3 전용 좌표를 설계하며 1.2 지도를 축소하지 않는다.
export const VERSION='1.3',WORLD_ID='seoul-1.3',ROOM_ID='seoul-13',MAP_REVISION='exploration-20261027-7';
export const TOP={elevation:47,yaw:0,span:15,minSpan:12,maxSpan:60,fov:34};
export const ACTOR_SCALE=1.7;
const site=(id,name,x,z,w,d,kind,entry=[x,z+d/2+2])=>({id,name,x,z,w,d,kind,entry:{x:entry[0],z:entry[1]}});
export const sites=[
 site('gyeongbokgung','경복궁',-75,-118,60,78,'palace',[-75,-77.2]),
 site('central-hall','중앙청',-75,-97,27,15,'government',[-75,-88]),
 site('gwanghwamun','광화문',-75,-81.6,17,5,'gate',[-75,-77.2]),
 site('jeongdok-library','정독도서관',-13,-119,29,30,'library',[-13,-108]),
 site('changdeokgung','창덕궁 · 후원',28,-119,46,70,'garden', [28,-77]),
 site('changgyeongwon','창경원',78.5,-119,42,70,'zoo',[103,-111]),
 site('jongmyo','종묘',82,-39,34,48,'shrine',[82,-11]),
 site('sejong-center','세종문화회관',-81,-39,40,38,'arts',[-81,-28]),
 site('tapgol-park','파고다공원',21,-35,28,34,'park'),
 site('piccadilly','피카디리극장',43.7,-18,18,18,'cinema',[43.7,-11]),
 site('gukje-cinema','국제극장',-77,12,25,19,'cinema'),
 site('bosingak','보신각',-17,13,22,19,'belfry'),
 site('kcf-jongno','KCF 종로점',25,13,19,17,'kcf'),
 site('deoksugung','덕수궁',-81,44,43,28,'palace',[-56,47]),
 site('cityhall','서울시청',-17,44,29,20,'civic'),
 site('midopa','미도파백화점',-20,73,22,16,'store'),
 site('myeongdong-street','명동',30,86,72,35,'shopping',[18,88]),
 site('myeongdong-cathedral','명동성당',81,84,33,38,'cathedral',[81,96]),
 site('chungmuro','충무로',97,122,17,14,'film',[93,113]),
 site('namdaemun-market','남대문시장',-23,100,33,17,'market',[-23,110]),
 site('namdaemun','숭례문',-60,106,22,17,'gate',[-60,116]),
 {...site('seoul-station','서울역',stationPlan.x,stationPlan.z,38,25,'station',[stationPlan.entry.x,stationPlan.entry.z]),plot:stationPlan.plot},
 {...site('hoehyeon-hillside','회현동 언덕',23,137,82,30,'village',[22,119]),plot:{x:20,z:148,w:88,d:52}}
];
export const entrances=Object.fromEntries(sites.map(s=>[s.id,s.entry]));
export const spawn=entrances.changgyeongwon;
// 앞의 9동은 확장 요청 직전의 위치·크기·순서 그대로 보존한다.
export const villageHomes=[[-13,132,7,6],[0,130,8,5],[15,134,7,6],[31,132,8,6],[44,134,7,5],[-8,148,8,6],[6,146,7,5],[24,150,8,6],[42,148,7,6],
 [-10,164,8,6],[5,166,7,6],[22,165,8,6],[39,166,8,5],[54,164,7,6]];
export const villageWalks=[
 [[28.5,140],[16,140],[16,156]],
 [[-24,156],[62,156],[62,173],[-24,173],[-24,156]],
 [[55,151],[62,156]],
 [[-64,150],[-49,150],[-24,156]]
];
export const mainWalks=[
 [[-108,75],[-84,75],[-84,64],[-51,64]],
 [[-35,-150],[-35,-80]],[[0,-150],[0,-80]],[[3,-65],[3,22]],
 [[3,86],[8,92],[50,92],[64,96],[81,96]],[[22,66],[22,86],[50,86],[62,90]],
 [[-39,118],[-15,125],[10,125],[42,151]],[[10,125],[46,125],[55,151]],
 [[-75,-72],[-75,-85],[-90,-85],[-90,-105],[-75,-105]],
 [[-60,116],[-51,116],[-51,104],[-35,104],[-23,110]],
 [[-20,83],[-20,86],[3,86],[18,88]],
 [[-29,84],[-29,110]],[[66,-151],[66,-78]],...villageWalks
];
export const worldData={worldId:WORLD_ID,mapRevision:MAP_REVISION,roomId:ROOM_ID,spawn,bounds,entrances};
export function distanceToSegment(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);}
export const sitePlot=s=>s.plot||s;
export function inSite(x,z,padding=0){return sites.some(s=>{const p=sitePlot(s);return Math.abs(x-p.x)<p.w/2+padding&&Math.abs(z-p.z)<p.d/2+padding;});}
export function canWalk(x,z,solids=[]){return x>bounds.minX+2&&x<bounds.maxX-2&&z>bounds.minZ+2&&z<bounds.maxZ-2&&!solids.some(s=>Math.abs(x-s.x)<s.w/2+.4&&Math.abs(z-s.z)<s.d/2+.4);}
export function moveWithCollision(p,dx,dz,solids){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.35));let x=p.x,z=p.z;for(let i=0;i<steps;i++){if(canWalk(x+dx/steps,z,solids))x+=dx/steps;if(canWalk(x,z+dz/steps,solids))z+=dz/steps;}return{x,z};}
