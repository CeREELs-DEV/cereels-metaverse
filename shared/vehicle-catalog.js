// 1985 전후 후보. 표본 색은 당시 제작사 사진 기준이며 HEX는 게임용 근사값이다.
// 전체 국내 출고 옵션·택시 회사별 도색의 완전한 복원으로 취급하지 않는다.
const photo=(name,hex)=>({name,hex,evidence:'period-photo'});
export const vehicleCatalog=Object.freeze([
 {id:'pony',name:'현대 포니',year:1976,body:'hatch',w:1.56,d:3.97,h:1.38,wheelbase:2.34,roundLights:true,chrome:true,taxi:true,weight:3,colors:[photo('빨강','#b93f32'),photo('파랑','#386b9f'),photo('은색','#bac1bf')]},
 {id:'pony2',name:'현대 포니2',year:1982,body:'hatch',w:1.56,d:4.03,h:1.35,wheelbase:2.34,weight:4,colors:[photo('붉은색','#a63d31'),photo('노랑','#d8b339'),photo('파랑','#497d9b'),photo('은색','#b9c0bc')]},
 {id:'brisa',name:'기아 브리사',year:1974,body:'sedan',w:1.49,d:3.87,h:1.39,wheelbase:2.29,roundLights:true,chrome:true,taxi:true,weight:2,colors:[photo('흰색','#eee9dc'),photo('노랑','#d9b53b')]},
 {id:'stellar',name:'현대 스텔라',year:1983,body:'sedan',w:1.71,d:4.42,h:1.38,wheelbase:2.58,chrome:true,taxi:true,weight:2,colors:[photo('흰색','#eeeade'),photo('금빛 갈색','#aa8151'),photo('청회색','#6d8b98')]},
 {id:'maepsy',name:'대우 맵시나',year:1983,body:'sedan',w:1.57,d:4.27,h:1.38,wheelbase:2.40,chrome:true,weight:1.4,colors:[photo('빨강','#b43e35')]},
 {id:'royale',name:'대우 로얄살롱',year:1980,body:'sedan',w:1.73,d:4.65,h:1.42,wheelbase:2.67,chrome:true,luxury:true,weight:.45,colors:[{name:'짙은 갈색',hex:'#624638',evidence:'export-photo-provisional'}]},
 {id:'pony-pickup',name:'현대 포니 픽업',year:1976,body:'pickup',w:1.56,d:4.15,h:1.40,wheelbase:2.34,roundLights:true,chrome:true,weight:1.1,colors:[photo('주황','#cf7034')]},
 {id:'bongo-truck',name:'기아 봉고 트럭',year:1980,body:'truck',w:1.65,d:4.52,h:1.98,wheelbase:2.20,roundLights:true,weight:1.2,colors:[photo('파랑','#387baf')]},
 {id:'bongo-coach',name:'기아 봉고 코치',year:1981,body:'van',w:1.65,d:4.05,h:1.99,wheelbase:2.20,roundLights:true,weight:.7,colors:[photo('청록색','#459c94')]},
 {id:'bf101',name:'새한·대우 BF101',year:1977,body:'bus',w:2.45,d:9.45,h:3.10,wheelbase:4.80,roundLights:true,windows:8,weight:1.3,colors:[{name:'서울 입석 청색·밝은 상부',hex:'#397ca6',evidence:'seoul-policy-approximation'}]},
 {id:'rb520',name:'현대 RB520 관광형',year:1984,body:'bus',w:2.496,d:10.508,h:3.249,wheelbase:5.00,rearEngine:true,roundLights:true,lampPairs:true,windows:7,weight:.9,colors:[{name:'밝은 차체·녹색 띠',hex:'#387f61',evidence:'game-approximation'}],source:'https://mobilityhumanities.org/technology-db/rb585-rb520/'}
]);
export const vehicleById=new Map(vehicleCatalog.map(v=>[v.id,v]));
export const VEHICLE_SCALE=1.15;
// 원래 치수와 구분한 지붕 높이 보정. 바퀴·차로 점유 폭과 길이는 유지.
export const VEHICLE_ROOF_RISE=.18;
export const TAXI_PAINTS=Object.freeze([{name:'초록 택시',hex:'#389463',weight:3,evidence:'user-art-direction'},{name:'노랑 택시',hex:'#d9b53b',weight:1,evidence:'game-approximation'}]);
const scaledVehicles=new Map(vehicleCatalog.map(m=>[m.id,Object.freeze({...m,w:m.w*VEHICLE_SCALE,d:m.d*VEHICLE_SCALE,h:(m.h+VEHICLE_ROOF_RISE)*VEHICLE_SCALE})]));
export function vehicleSize(id){return scaledVehicles.get(typeof id==='string'?id:id.model);}
const envelope=bus=>{const models=vehicleCatalog.filter(m=>(m.body==='bus')===bus);return{w:Math.max(...models.map(m=>m.w))*VEHICLE_SCALE+.37,d:Math.max(...models.map(m=>m.d))*VEHICLE_SCALE+.26};};
export const trafficEnvelope=Object.freeze({car:envelope(false),bus:envelope(true)});
export function vehicleVariants(model){return[...model.colors.map(c=>({model:model.id,color:c.hex,taxi:false})),...(model.taxi?TAXI_PAINTS.map(c=>({model:model.id,color:c.hex,taxi:true})):[])];}
export function chooseVehicle(random,{parked=false,busAllowed=true,active=[]}={}){
 const list=vehicleCatalog.filter(v=>(busAllowed||v.body!=='bus')&&(!parked||v.body!=='bus'));
 const weight=v=>v.weight/(1+2*active.filter(c=>c.model===v.id).length);
 let n=random()*list.reduce((n,v)=>n+weight(v),0),model=list.at(-1);
 for(const v of list){n-=weight(v);if(n<=0){model=v;break;}}
 const eligible=!!model.taxi&&(!parked||model.id==='brisa'),roll=eligible?random():1,taxi=eligible&&roll<.45;
 // 주차 배치의 난수 순서를 유지하며 초록·노랑 3:1 선택.
 let color;if(taxi){let pick=(parked?roll/.45:random())*TAXI_PAINTS.reduce((n,c)=>n+c.weight,0);color=TAXI_PAINTS.at(-1);for(const c of TAXI_PAINTS){pick-=c.weight;if(pick<0){color=c;break;}}}else color=model.colors[Math.min(model.colors.length-1,Math.floor(random()*model.colors.length))];
 return{model:model.id,color:color.hex,taxi};
}
export const vehicleBounds=v=>{const m=vehicleSize(v);return{x:v.x,z:v.z,w:m.w+.37,d:m.d+.26,turn:v.turn||0};};
