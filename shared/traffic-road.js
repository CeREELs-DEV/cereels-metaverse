const inside=(x,z,p)=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};

// 배포 때 확정한 노면. 서버는 건물·텍스처·Three 없이 같은 차체 경계를 검사.
export function createRoadBodyTest({islands,polygons}){
 const indexed=polygons.map(s=>({...s,x0:Math.min(...s.p.map(q=>q[0])),x1:Math.max(...s.p.map(q=>q[0])),z0:Math.min(...s.p.map(q=>q[1])),z1:Math.max(...s.p.map(q=>q[1]))}));
 function asphalt(x,z){
  if(islands.some(i=>((x-i.x)/i.rx)**2+((z-i.z)/i.rz)**2<1))return false;
  for(const s of indexed)if(x>=s.x0&&x<=s.x1&&z>=s.z0&&z<=s.z1&&inside(x,z,s.p)&&!(s.hole&&inside(x,z,s.hole)))return s.kind==='asphalt';
  return false;
 }
 return(p,w,d)=>{const c=Math.cos(p.turn),s=Math.sin(p.turn);for(const x of [-w/2,0,w/2])for(let z=-d/2;z<=d/2+.001;z+=d/6)if(!asphalt(p.x+x*c+z*s,p.z-x*s+z*c))return false;return true;};
}
