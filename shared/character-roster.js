// Shared player scale keeps the camera and ground contact identical on a swap.
const artwork=(name,label,shortName)=>{
 const original=name==='odie',prefix=`assets/seoul/characters/${name}_`,dirs={front:'front',right:'front_right',back:'back',backRight:'back_right'};
 const files=Object.fromEntries(Object.entries(dirs).map(([key,direction])=>[key,prefix+(original?'retouch_still_':'paper_')+direction+'.png']));
 const walk=Object.fromEntries(Object.entries(dirs).map(([key,direction])=>[key,prefix+(original?'retouch_walk_':'paper_walk_')+direction+'.png']));
 return {label,shortName,height:1.55,groundOffset:.12,files,animations:{walk:{columns:4,rows:1,fps:6,files:walk},run:{columns:4,rows:1,fps:9,files:walk},idle:{columns:1,rows:1,fps:1,files}}};
};
const ellaFiles=Object.fromEntries(Object.entries({front:'front',right:'threequarter',side:'side',backRight:'back_threequarter',back:'back'}).map(([key,suffix])=>[key,`assets/seoul/characters/ella_walkcycle5_${suffix}.png`]));
export const DEFAULT_CHARACTER='ella',CHARACTER_REVISION='ella-20261027';
export const characters={
 ella:{label:'Ella',shortName:'엘라',height:1.55*.65,groundOffset:.12,directionCount:8,mirrorSources:['right','side','backRight'],portrait:'assets/seoul/characters/ella_portrait.svg',files:ellaFiles,animations:{walk:{columns:4,rows:1,fps:6,files:ellaFiles},run:{columns:4,rows:1,fps:9,files:ellaFiles},idle:{columns:4,rows:1,fps:1,stillFrame:0,files:ellaFiles},greet:{columns:4,rows:1,fps:1,stillFrame:0,files:ellaFiles}}},
 visitor:artwork('odie','Player · Young Odie','오디'),
 cleo:artwork('cleo','Young Cleo','클레오'),
 eustace:artwork('eustace','Young Eustice','유스티스'),
 taemi:artwork('taemi','Taemi','태미'),
};
export const normalizeCharacter=id=>Object.hasOwn(characters,id)?id:DEFAULT_CHARACTER;
// 이전 기본 오디만 한 번 전환하고 이후 명시적 선택은 보존
export const initialCharacter=saved=>saved?.character==='visitor'&&saved.characterRevision!==CHARACTER_REVISION?DEFAULT_CHARACTER:normalizeCharacter(saved?.character);
