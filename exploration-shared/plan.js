// 1.3 전용 좌표를 설계하며 1.2 지도를 축소하지 않는다.
export const VERSION='1.3',WORLD_ID='seoul-1.3',ROOM_ID='seoul-13',MAP_REVISION='exploration-20261027-1';
export const bounds={minX:-112,maxX:112,minZ:-162,maxZ:158};
export const TOP={elevation:47,yaw:0,span:15,minSpan:12,maxSpan:60,fov:34};
export const ACTOR_SCALE=1.7;
const site=(id,name,x,z,w,d,kind,entry=[x,z+d/2+2])=>({id,name,x,z,w,d,kind,entry:{x:entry[0],z:entry[1]}});
export const sites=[
 site('gyeongbokgung','경복궁',-75,-117,60,78,'palace',[-75,-75]),
 site('central-hall','중앙청',-75,-97,27,15,'government',[-75,-88]),
 site('gwanghwamun','광화문',-75,-78,17,5,'gate',[-75,-72]),
 site('jeongdok-library','정독도서관',-13,-119,29,30,'library',[-13,-108]),
 site('changdeokgung','창덕궁 · 후원',28,-119,46,70,'garden', [28,-77]),
 site('changgyeongwon','창경원',80,-119,42,70,'zoo',[103,-111]),
 site('jongmyo','종묘',80,-39,42,48,'shrine',[80,-11]),
 site('sejong-center','세종문화회관',-81,-39,40,38,'arts',[-81,-28]),
 site('tapgol-park','파고다공원',21,-35,28,34,'park'),
 site('piccadilly','피카디리극장',46,-18,18,18,'cinema'),
 site('gukje-cinema','국제극장',-77,12,25,19,'cinema'),
 site('bosingak','보신각',-17,13,22,19,'belfry'),
 site('kcf-jongno','KCF 종로점',25,13,19,17,'kcf'),
 site('deoksugung','덕수궁',-81,44,43,28,'palace',[-56,47]),
 site('cityhall','서울시청',-17,44,29,20,'civic'),
 site('midopa','미도파백화점',-20,73,25,16,'store'),
 site('myeongdong-street','명동',20,86,52,35,'shopping',[18,88]),
 site('myeongdong-cathedral','명동성당',81,84,33,38,'cathedral',[81,96]),
 site('chungmuro','충무로',97,122,17,14,'film',[93,113]),
 site('namdaemun-market','남대문시장',-23,100,33,17,'market',[-23,110]),
 site('namdaemun','숭례문',-58,106,22,17,'gate',[-58,116]),
 site('seoul-station','서울역',-81,143,32,23,'station',[-81,151]),
 site('hoehyeon-hillside','회현동 언덕',23,137,82,30,'village',[22,119])
];
export const entrances=Object.fromEntries(sites.map(s=>[s.id,s.entry]));
export const spawn=entrances.changgyeongwon;
export const roads=[
 {id:'yulgok',name:'율곡로',width:7,points:[[-108,-72],[-43,-72],[5,-72],[58,-72],[106,-72]]},
 {id:'sejong',name:'세종로 · 태평로',width:10,points:[[-43,-73],[-43,-5],[-43,30],[-43,60],[-43,88],[-74,88],[-74,126]]},
 {id:'jongno',name:'종로',width:8,points:[[-108,-5],[-43,-5],[3,-5],[58,-5],[108,-5]]},
 {id:'cheonggye',name:'청계천 복개도로',width:6,points:[[-43,30],[58,30],[108,30]]},
 {id:'eulji',name:'을지로',width:7,points:[[-43,60],[58,60],[108,60]]},
 {id:'donhwa',name:'돈화문로',width:6,points:[[58,-72],[58,-5],[58,30],[58,60],[58,112]]},
 {id:'changgyeong',name:'창경궁로',width:5,points:[[106,-151],[106,-72],[106,-5]]},
 {id:'toegye',name:'퇴계로',width:8,points:[[-108,126],[-42,126],[-42,113],[-5,113],[58,113],[108,113]]},
 {id:'station',name:'서울역 앞길',width:7,points:[[-58,126],[-58,153]]}
];
export const mainWalks=[
 [[-35,-150],[-35,-80]],[[0,-150],[0,-80]],[[3,-65],[3,22]],
 [[-6,66],[-6,86],[5,93],[50,93]],[[8,66],[8,86],[50,86]],
 [[-39,118],[-15,125],[10,125],[42,151]],[[10,125],[46,125],[55,151]],
 [[-75,-72],[-75,-85],[-90,-85],[-90,-105],[-75,-105]],
 [[-58,116],[-58,120],[-38,120],[-23,110]],
 [[-29,84],[-29,110]],[[66,-151],[66,-78]]
];
export const worldData={worldId:WORLD_ID,mapRevision:MAP_REVISION,roomId:ROOM_ID,spawn,bounds,entrances};
export function distanceToSegment(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);}
export function nearRoad(x,z,padding=0){return roads.some(r=>r.points.some((p,i)=>i&&distanceToSegment(x,z,r.points[i-1],p)<r.width/2+padding));}
export function inSite(x,z,padding=0){return sites.some(s=>Math.abs(x-s.x)<s.w/2+padding&&Math.abs(z-s.z)<s.d/2+padding);}
export function canWalk(x,z,solids=[]){return x>bounds.minX+2&&x<bounds.maxX-2&&z>bounds.minZ+2&&z<bounds.maxZ-2&&!solids.some(s=>Math.abs(x-s.x)<s.w/2+.4&&Math.abs(z-s.z)<s.d/2+.4);}
export function moveWithCollision(p,dx,dz,solids){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.35));let x=p.x,z=p.z;for(let i=0;i<steps;i++){if(canWalk(x+dx/steps,z,solids))x+=dx/steps;if(canWalk(x,z+dz/steps,solids))z+=dz/steps;}return{x,z};}
