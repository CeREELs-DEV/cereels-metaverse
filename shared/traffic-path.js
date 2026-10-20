export function pathOf(points){
 const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
 return{points,lengths,length:lengths.at(-1)};
}
export function pathAt(path,s){
 const L=path.lengths;s=Math.max(0,Math.min(path.length,s));let lo=1,hi=L.length-1;
 while(lo<hi){const mid=(lo+hi)>>1;if(L[mid]<s)lo=mid+1;else hi=mid;}
 const a=path.points[lo-1],b=path.points[lo],d=Math.hypot(b[0]-a[0],b[1]-a[1])||1,t=(s-L[lo-1])/d;
 return{x:a[0]+(b[0]-a[0])*t,z:a[1]+(b[1]-a[1])*t,dx:(b[0]-a[0])/d,dz:(b[1]-a[1])/d,turn:Math.atan2(-(b[0]-a[0]),-(b[1]-a[1]))};
}
