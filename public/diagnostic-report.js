const reasons={initial:'첫 입장','interrupted-start':'정상 종료 기록 없이 다시 시작',landmark:'지도 이동','third-person':'3인칭 전환','position-correction':'서버 위치 보정','graphics-lost':'그래픽 연결 중단','graphics-resume':'그래픽 중단 후 복구'};
const read=(storage,key,fallback)=>{try{const raw=storage?.getItem(key);return raw&&raw.length<100000?JSON.parse(raw)||fallback:fallback;}catch{return fallback;}};
export function collectDiagnosticReport(storage,{browser=navigator.userAgent,viewport={width:innerWidth,height:innerHeight,dpr:devicePixelRatio},now=Date.now,build='확인 중'}={}){
 const guard=read(storage,'cereels-seoul-quality-v1',{}),events=read(storage,'cereels-seoul-loading-history',[]),current=read(storage,'cereels-seoul-playback-trace-v1',null),saved=read(storage,'cereels-seoul-playback-history-v1',[]),history=Array.isArray(saved)?saved.slice(-3):[];
 return{at:new Date(now()).toISOString(),browser,viewport,build,quality:{level:guard.level,cap:guard.cap,safety:guard.safety,resources:guard.resources},events:Array.isArray(events)?events.slice(-12).map(e=>({reason:e.reason,label:reasons[e.reason]||e.reason,at:e.at,detail:e.detail})):[],playback:{current,previous:history.at(-1)||null,otherRuns:history.slice(0,-1).map(v=>({id:v.id,started:v.started,updated:v.updated,status:v.status}))}};
}
export function describeDiagnosticReport(report){
 const previous=report.playback.previous,last=previous||report.playback.current,types=last?.events?.map(e=>e.type)||[],when=previous?'직전 플레이에서':'이번 플레이에서';
 return types.includes('reload-requested')?`${when} 게임이 그래픽 복구를 위해 다시 로딩했습니다.`:types.includes('error')||types.includes('rejection')?`${when} 프로그램 오류가 기록됐습니다.`:last?'오류 기록 없이 중단됐더라도 마지막 저장 상태를 함께 확인할 수 있습니다.':'아직 플레이 기록이 없습니다. 플레이 후 다시 열어 주세요.';
}
globalThis.CereelsDiagnosticReport={collectDiagnosticReport,describeDiagnosticReport};
