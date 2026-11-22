'use strict';
(() => {
 const animated=()=>!paused;
 /* ── Itinéraire GPS : H3 Campus (Poissy) → Mairie de Mantes-la-Ville ──
    Vue d'ensemble, puis navigation inclinée qui suit le véhicule : zoom large et regard
    lointain sur l'A13, zoom serré en ville, puis arrivée sur la mairie. */
 const root=document.getElementById('travel-stage');
 const map=document.getElementById('travel-map'),ctx=map.getContext('2d');
 const photo=root.querySelector('.mairie-photo'),title=root.querySelector('.destination-title'),ui=root.querySelector('.gps-ui');
 const skip=document.getElementById('travel-skip'),compass=root.querySelector('.gps-compass i');
 const out={icon:document.getElementById('gps-icon'),dist:document.getElementById('gps-distance'),text:document.getElementById('gps-instruction'),time:document.getElementById('gps-time'),km:document.getElementById('gps-km'),arrival:document.getElementById('gps-arrival'),then:document.getElementById('gps-then'),speed:document.getElementById('gps-speed'),maneuver:root.querySelector('.gps-maneuver')};
 const LON0=1.88,LAT0=48.95,KX=111.32*Math.cos(LAT0*Math.PI/180),KY=110.57;
 const P=([lon,lat])=>[(lon-LON0)*KX,(lat-LAT0)*KY];
 function smooth(pts,steps=6){const o=[];for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;for(let s=0;s<steps;s++){const t=s/steps,t2=t*t,t3=t2*t;o.push([0,1].map(k=>.5*(2*p1[k]+(p2[k]-p0[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(3*p1[k]-p0[k]-3*p2[k]+p3[k])*t3)));}}o.push(pts[pts.length-1]);return o;}
 const line=c=>smooth(c.map(P));
 const ROUTE_LL=[[2.045,48.929],[2.031,48.923],[2.011,48.918],[1.990,48.915],[1.960,48.925],[1.925,48.935],[1.890,48.945],[1.860,48.952],[1.830,48.957],[1.800,48.960],[1.770,48.962],[1.745,48.963],[1.731,48.966],[1.720,48.970],[1.712,48.9745]];
 const route=line(ROUTE_LL),cum=[0];
 for(let i=1;i<route.length;i++)cum.push(cum[i-1]+Math.hypot(route[i][0]-route[i-1][0],route[i][1]-route[i-1][1]));
 const TOTAL=cum[cum.length-1],JUNCTION=cum[3*6],EXIT=cum[11*6],MINUTES=27;
 const ROADS={
  highway:[line([[2.10,48.875],[2.06,48.885],[2.02,48.900],[1.990,48.915],...ROUTE_LL.slice(4,12),[1.71,48.962],[1.68,48.960],[1.64,48.958]]),line([[1.990,48.915],[2.03,48.905],[2.07,48.902],[2.13,48.900]])],
  main:[line([[2.02,48.925],[1.98,48.930],[1.93,48.945],[1.88,48.958],[1.84,48.962],[1.80,48.967],[1.75,48.972],[1.712,48.9745]]),line([[2.04,48.935],[2.00,48.945],[1.97,48.965],[1.93,48.982],[1.90,48.990],[1.86,48.985],[1.82,48.982],[1.78,48.980],[1.74,48.985],[1.70,48.988]]),line([[2.045,48.929],[2.06,48.90],[2.07,48.88]]),line([[1.71,48.94],[1.712,48.9745],[1.715,48.995],[1.72,49.02]]),line([[1.905,48.985],[1.908,49.01],[1.91,49.03]]),line([[1.855,48.960],[1.86,48.93],[1.87,48.90]])]
 };
 const SEINE=line([[2.15,48.955],[2.10,48.948],[2.06,48.940],[2.040,48.936],[2.02,48.942],[1.995,48.950],[1.985,48.960],[1.99,48.975],[1.96,48.99],[1.93,49.000],[1.91,49.002],[1.885,48.996],[1.86,48.990],[1.83,48.988],[1.80,48.986],[1.77,48.988],[1.74,48.993],[1.72,48.996],[1.69,49.002],[1.64,49.01]]);
 function blob(lon,lat,r,sx=1,sy=1,s=1){const[cx,cy]=P([lon,lat]),pts=[];for(let i=0;i<48;i++){const a=i/48*Math.PI*2,k=r*(1+.16*Math.sin(3*a+s)+.09*Math.sin(5*a+2*s)+.05*Math.sin(8*a+3*s));pts.push([cx+Math.cos(a)*k*sx,cy+Math.sin(a)*k*sy]);}return pts;}
 const TOWNS=[[2.040,48.928,1.6,1.25,.85],[1.978,48.921,.75,1,1],[1.912,48.988,1.4,1.3,.75],[1.905,49.006,.6,1.2,.8],[1.855,48.960,1.05,1.3,.75],[1.815,48.955,.75,1.1,.9],[1.712,48.986,1.25,1.3,.7],[1.712,48.970,1.15,1.15,.85],[1.745,49.003,.8,1.2,.8],[1.680,48.980,.6,1,1],[2.004,48.941,.55,1.2,.9],[2.004,48.983,.75,1.2,.8]].map((t,i)=>({c:P(t),r:t[2],poly:blob(t[0],t[1],t[2],t[3],t[4],i*1.7)}));
 const FORESTS=[blob(2.105,48.925,2.6,.9,1.3,2),blob(1.935,48.905,1.9,1.7,.65,5),blob(1.965,48.963,.8,1.2,.8,7),blob(1.765,48.940,1.4,1.5,.7,3),blob(1.840,48.933,1.1,1.2,.8,9),blob(1.66,49.03,1.4,1.4,.8,4)];
 let seed=7;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 const LABELS=[['Mantes-la-Ville',1.712,48.9745,1],['Poissy',2.045,48.929,1],['Les Mureaux',1.912,48.988,2],['Mantes-la-Jolie',1.712,48.989,2],['Aubergenville',1.855,48.960,2],['Orgeval',1.978,48.921,3],['Épône',1.815,48.955,3],['Limay',1.745,49.004,3],['Meulan',1.905,49.008,3],['Triel-sur-Seine',2.004,48.984,3]].map(([n,lon,lat,r])=>({n,p:P([lon,lat]),r}));
 const SHIELD=P([1.875,48.949]);
 const ICONS={merge:'M8 20v-5.5c0-2.6 1.6-4.4 4.2-5.4L17 7.5M13.2 5.6 17 7.5l-1.9 3.8',straight:'M12 20V5M7 10l5-5 5 5',exit:'M9 20v-7.5c0-2.5 1.3-4.4 3.6-5.6L16 5M12 4.5h4.5V9',pin:'M12 21s-6-5.6-6-10.5a6 6 0 0 1 12 0C18 15.4 12 21 12 21zm0-8.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'};
 // Rues : quadrillage de chaque ville, découpé au contour de la ville.
 function inside(poly,[x,y]){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
 const STREETS=[];
 TOWNS.forEach(t=>{
  const base=rand()*Math.PI/2,R=t.r*1.7;
  [base,base+Math.PI/2].forEach(o=>{
   const ux=Math.cos(o),uy=Math.sin(o),nx=-uy,ny=ux;
   for(let off=-R;off<=R;off+=.13){
    if(rand()<.2)continue;const major=rand()<.16;let run=null;
    for(let s=-R;s<=R+.001;s+=.04){
     const p=[t.c[0]+nx*off+ux*s,t.c[1]+ny*off+uy*s],inn=inside(t.poly,p);
     if(inn){if(run)run[1]=p;else run=[p,p];}
     if((!inn||s+.04>R)&&run){if(Math.hypot(run[1][0]-run[0][0],run[1][1]-run[0][1])>.1)STREETS.push({pts:run,major});run=null;}
    }
   }
  });
 });
 const STOPS=[0,(JUNCTION+EXIT)/2,EXIT-.7,TOTAL];
 const state={reveal:1,blend:1,d:TOTAL,k:1,arrive:1};
 let travel=null,travelStarted=false,currentStop=3,drawFrame=0,arrivalTime='',waitFrame=0;
 function at(d){d=Math.max(0,Math.min(TOTAL,d));let i=1;while(i<cum.length-1&&cum[i]<d)i++;const t=(d-cum[i-1])/((cum[i]-cum[i-1])||1),a=route[i-1],b=route[i];return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];}
 function heading(d,w){const a=at(d-w),b=at(d+w);return Math.atan2(b[0]-a[0],b[1]-a[1]);}
 const angleLerp=(a,b,t)=>{let d=((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;return a+d*t;};
 const clamp=v=>Math.max(0,Math.min(1,v)),lerp=(a,b,t)=>a+(b-a)*t,smoothstep=(a,b,x)=>{const k=clamp((x-a)/(b-a));return k*k*(3-2*k);};
 const easeInOut=k=>-(Math.cos(Math.PI*k)-1)/2,easeOut=k=>1-Math.pow(1-k,3);
 const bounce=k=>{const n=7.5625,d=2.75;if(k<1/d)return n*k*k;if(k<2/d)return n*(k-=1.5/d)*k+.75;if(k<2.5/d)return n*(k-=2.25/d)*k+.9375;return n*(k-=2.625/d)*k+.984375;};
 /* Profil de conduite : sur l'A13, la caméra dézoome et le véhicule va plus vite à l'écran ;
    en ville elle se resserre. La vitesse affichée est simulée (50 km/h en ville, 110 sur l'A13). */
 const HW=.42;
 const zoomFactor=d=>1-(1-HW)*smoothstep(JUNCTION-.5,JUNCTION+1.2,d)*(1-smoothstep(EXIT-1.6,EXIT+.2,d));
 const realSpeed=d=>50+60*(1-zoomFactor(d))/(1-HW);
 const N=600,animT=[0],realT=[0];
 for(let i=1;i<=N;i++){const d0=TOTAL*(i-1)/N,d1=TOTAL*i/N,m=(d0+d1)/2;animT.push(animT[i-1]+zoomFactor(m)*(d1-d0));realT.push(realT[i-1]+(d1-d0)/realSpeed(m));}
 function distanceAt(k){const target=k*animT[N];let lo=0,hi=N;while(hi-lo>1){const mid=(lo+hi)>>1;if(animT[mid]<target)lo=mid;else hi=mid;}const f=(target-animT[lo])/((animT[hi]-animT[lo])||1);return TOTAL*(lo+f)/N;}
 const minutesLeft=d=>{const i=Math.max(0,Math.min(N,Math.round(d/TOTAL*N)));return MINUTES*(realT[N]-realT[i])/realT[N];};
 function palette(){return document.documentElement.dataset.theme==='dark'?{land:'#1b2029',town:'#222833',forest:'#1b2b26',water:'#1d3550',street:'#2b323f',main:'#363e4d',mainCase:'#2a303c',hw:'#4a5160',hwCase:'#2f3540',route:'#4c8df6',routeCase:'#2563c9',done:'#3b4a63',label:'#aab4c3',halo:'#1b2029',strong:'#e8edf4',pill:'#262b34'}:{land:'#f5f4f1',town:'#ecebe7',forest:'#dbecd3',water:'#b5d3f3',street:'#ffffff',main:'#ffffff',mainCase:'#dfdcd6',hw:'#fbe3a0',hwCase:'#e7c46b',route:'#1a73e8',routeCase:'#1557b0',done:'#a8c3ec',label:'#5f6368',halo:'#f5f4f1',strong:'#202124',pill:'#ffffff'};}
 function camera(w,h){
  const xs=route.map(p=>p[0]),ys=route.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const over={x:(minX+maxX)/2,y:(minY+maxY)/2,z:Math.min((w-110)/(maxX-minX),(h-190)/(maxY-minY)),r:0,ay:h*.6};
  const f=zoomFactor(state.d),look=.2+.9*(1-f),car=at(state.d);
  const nav={x:car[0],y:car[1],z:Math.max(64,w/6)*f,r:heading(Math.min(TOTAL-.06,state.d+look*.5),look*.5+.08),ay:h*.74};
  const t=state.blend,a=easeInOut(state.arrive);
  return{x:lerp(over.x,nav.x,t),y:lerp(over.y,nav.y,t),z:Math.exp(lerp(Math.log(over.z),Math.log(nav.z),t)+Math.log(2.4)*a),r:angleLerp(angleLerp(over.r,nav.r,t),0,a),ax:w/2,ay:lerp(lerp(over.ay,nav.ay,t),h*.6,a),p:(50*Math.PI/180)*t*(1-.8*a)};
 }
 function drawMap(){
  if(!ctx)return;const w=root.clientWidth,h=root.clientHeight;if(!w||!h)return;
  const zoom=root.getBoundingClientRect().width/w||1,ratio=Math.min(2,(devicePixelRatio||1)*zoom);
  if(map.width!==Math.round(w*ratio)||map.height!==Math.round(h*ratio)){map.width=Math.round(w*ratio);map.height=Math.round(h*ratio);}
  const C=palette(),cam=camera(w,h),z=cam.z,cr=Math.cos(-cam.r),sr=Math.sin(-cam.r),cp=Math.cos(cam.p),sp=Math.sin(cam.p),D=h*1.3;
  // Projection : carte tournée dans le sens de marche, puis inclinée en perspective.
  const S=([x,y])=>{const dx=(x-cam.x)*z,dy=-(y-cam.y)*z,u=dx*cr-dy*sr,v=dx*sr+dy*cr,s=D/(D+Math.max(-.8*D,-v*sp));return[cam.ax+u*s,cam.ay+v*cp*s,s];};
  const M=40,off=(a,b)=>(a[0]<-M&&b[0]<-M)||(a[0]>w+M&&b[0]>w+M)||(a[1]<-M&&b[1]<-M)||(a[1]>h+M&&b[1]>h+M);
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.fillStyle=C.land;ctx.fillRect(0,0,w,h);ctx.lineCap='round';ctx.lineJoin='round';
  const poly=(pts,fill)=>{ctx.beginPath();pts.forEach((p,i)=>{const q=S(p);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);});ctx.closePath();ctx.fillStyle=fill;ctx.fill();};
  // Trait d'épaisseur réduite au loin ; à plat, un seul tracé suffit.
  const path=(pts,color,px,from=0,to=pts.length)=>{
   if(to-from<2)return;const q=[];for(let i=from;i<to;i++)q.push(S(pts[i]));ctx.strokeStyle=color;
   if(cam.p<.02){ctx.beginPath();q.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.lineWidth=px;ctx.stroke();return;}
   for(let i=1;i<q.length;i++){const a=q[i-1],b=q[i];if(off(a,b))continue;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineWidth=px*(a[2]+b[2])/2;ctx.stroke();}
  };
  FORESTS.forEach(f=>poly(f,C.forest));TOWNS.forEach(t=>poly(t.poly,C.town));
  path(SEINE,C.water,Math.max(2.5,.17*z));
  if(z>24){ctx.globalAlpha=Math.min(.95,(z-24)/30);STREETS.forEach(s=>path(s.pts,C.street,Math.max(s.major?1.6:.9,(s.major?.05:.028)*z)));ctx.globalAlpha=1;}
  ROADS.main.forEach(r=>path(r,C.mainCase,Math.max(2,.085*z)+1.5));ROADS.main.forEach(r=>path(r,C.main,Math.max(2,.085*z)));
  ROADS.highway.forEach(r=>path(r,C.hwCase,Math.max(3,.12*z)+2));ROADS.highway.forEach(r=>path(r,C.hw,Math.max(3,.12*z)));
  const rw=Math.max(5,Math.min(13,.15*z)),end=Math.max(2,Math.round(route.length*state.reveal));let done=1;while(done<route.length&&cum[done]<state.d)done++;
  const car=at(state.d);
  path(route,C.routeCase,rw+3,0,end);path(route,C.route,rw,0,end);
  if(state.d>0){const seg=route.slice(0,done).concat([car]);path(seg,C.routeCase,rw+3);path(seg,C.done,rw);}
  // Brume au loin quand la carte est inclinée.
  if(cam.p>.02){const g=ctx.createLinearGradient(0,0,0,h*.34);g.addColorStop(0,C.land);g.addColorStop(1,C.land+'00');ctx.globalAlpha=Math.min(1,sp*1.3);ctx.fillStyle=g;ctx.fillRect(0,0,w,h*.34);ctx.globalAlpha=1;}
  const boxes=[],label=(text,[x,y],{size=11,weight=500,color=C.label,dx=0,dy=0}={})=>{ctx.font=`${weight} ${size}px Outfit,Arial,sans-serif`;const m=ctx.measureText(text).width;const lx=x-m/2+dx,ly=y+dy;const b=[lx-3,ly-size,lx+m+3,ly+4];if(lx<4||lx+m>w-4||ly<size+4||ly>h-4||boxes.some(o=>b[0]<o[2]&&b[2]>o[0]&&b[1]<o[3]&&b[3]>o[1]))return false;boxes.push(b);ctx.lineWidth=3.5;ctx.strokeStyle=C.halo;ctx.strokeText(text,lx,ly);ctx.fillStyle=color;ctx.fillText(text,lx,ly);return true;};
  const start=S(route[0]),dest=S(route[route.length-1]),carS=S(car),overview=state.blend<.5,arrive=state.arrive;
  // Interface réservée : bandeau, estimation, vitesse et boussole.
  boxes.push([0,0,w*.62,70],[0,h-58,250,h],[w-110,h-60,w,h]);
  if(state.blend>.5)boxes.push([carS[0]-28,carS[1]-28,carS[0]+28,carS[1]+28]);
  if(state.blend<.6||state.d>.4){ctx.beginPath();ctx.arc(start[0],start[1],6*Math.min(1.2,start[2]),0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle=C.strong;ctx.stroke();}
  // Destination : ondes à l'arrivée, puis repère qui retombe.
  if(state.reveal>.98){
   if(arrive>0){for(let i=0;i<3;i++){const k=(arrive*1.6+i/3)%1,r=(8+k*46)*dest[2];ctx.beginPath();ctx.ellipse(dest[0],dest[1],r,r*cp,0,0,Math.PI*2);ctx.strokeStyle=`rgba(234,67,53,${.5*(1-k)*Math.min(1,arrive*4)})`;ctx.lineWidth=2;ctx.stroke();}}
   const drop=arrive>0&&arrive<.45?(1-bounce(arrive/.45))*-30:0,s=Math.min(1.35,.9+.45*arrive);
   ctx.save();ctx.translate(dest[0],dest[1]);ctx.beginPath();ctx.ellipse(0,0,5*s,2.2*s,0,0,Math.PI*2);ctx.fillStyle='#0003';ctx.fill();ctx.translate(0,drop);ctx.scale(s,s);ctx.shadowColor='#0004';ctx.shadowBlur=6;ctx.shadowOffsetY=2;ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-3,-8,-10,-12,-10,-20);ctx.arc(0,-20,10,Math.PI,0);ctx.bezierCurveTo(10,-12,3,-8,0,0);ctx.fillStyle='#ea4335';ctx.fill();ctx.shadowColor='transparent';ctx.beginPath();ctx.arc(0,-20,3.6,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.restore();
   boxes.push([dest[0]-14*s,dest[1]-34*s,dest[0]+14*s,dest[1]+4]);
   const lab=clamp((arrive-.35)/.3);
   if(lab>0){ctx.save();ctx.globalAlpha=lab;ctx.font='600 12px Outfit,Arial,sans-serif';const text='Mairie de Mantes-la-Ville',m=ctx.measureText(text).width+20,x=Math.max(8,Math.min(w-m-8,dest[0]-m/2)),y=dest[1]-60*s-(1-lab)*6;ctx.fillStyle=C.pill;ctx.shadowColor='#0003';ctx.shadowBlur=12;ctx.shadowOffsetY=3;ctx.beginPath();ctx.roundRect(x,y,m,26,13);ctx.fill();ctx.shadowColor='transparent';ctx.fillStyle=C.strong;ctx.fillText(text,x+10,y+17);ctx.restore();boxes.push([x,y,x+m,y+26]);}
  }
  if(overview){label('H3 Campus',start,{weight:600,color:C.strong,dy:-12,size:12});if(state.reveal>.98)label('Mairie',dest,{weight:600,color:C.strong,dy:-36,size:12});}
  // Bouclier de l'autoroute, tant qu'il n'est pas trop loin.
  const sh=S(SHIELD);if(sh[2]>.7&&sh[0]>20&&sh[0]<w-20&&sh[1]>20&&sh[1]<h-20){ctx.font='700 10px Outfit,Arial,sans-serif';const m=ctx.measureText('A13').width+10;ctx.fillStyle='#c5221f';ctx.beginPath();ctx.roundRect(sh[0]-m/2,sh[1]-8,m,16,4);ctx.fill();ctx.fillStyle='#fff';ctx.fillText('A13',sh[0]-m/2+5,sh[1]+4);boxes.push([sh[0]-m/2,sh[1]-8,sh[0]+m/2,sh[1]+8]);}
  LABELS.filter(l=>overview?l.r===1:l.r<=(z>45?3:2)).forEach(l=>{const p=S(l.p);if(!overview&&p[2]<.72)return;ctx.globalAlpha=overview?1:clamp((p[2]-.72)/.15);label(l.n,p,{weight:l.r===1?600:500,size:l.r===1?12:11,color:l.r===1?C.strong:C.label,dy:overview?16:0});ctx.globalAlpha=1;});
  // Véhicule : flèche posée sur la route (aplatie avec l'inclinaison).
  const carA=state.reveal>.98&&state.d<TOTAL-.02?1:clamp(1-arrive*3);
  if(state.reveal>.98&&carA>0){const a=heading(state.d,.25)-cam.r;ctx.save();ctx.globalAlpha=carA;ctx.translate(carS[0],carS[1]);ctx.scale(1,lerp(1,cp,.7));
   const pulse=(performance.now()/1400)%1;ctx.beginPath();ctx.arc(0,0,(state.blend>.5?20:13)+pulse*10,0,Math.PI*2);ctx.fillStyle=`rgba(26,115,232,${.16*(1-pulse)})`;ctx.fill();
   ctx.beginPath();ctx.arc(0,0,state.blend>.5?20:13,0,Math.PI*2);ctx.fillStyle='#1a73e81f';ctx.fill();
   ctx.rotate(a);ctx.shadowColor='#0005';ctx.shadowBlur=6;ctx.shadowOffsetY=1;ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(9,10);ctx.lineTo(0,5.5);ctx.lineTo(-9,10);ctx.closePath();ctx.fillStyle='#fff';ctx.fill();ctx.shadowColor='transparent';ctx.beginPath();ctx.moveTo(0,-8.5);ctx.lineTo(5.8,6.6);ctx.lineTo(0,3.6);ctx.lineTo(-5.8,6.6);ctx.closePath();ctx.fillStyle=C.route;ctx.fill();ctx.restore();}
  if(compass)compass.style.transform=`rotate(${-cam.r}rad)`;
  ui.classList.toggle('is-nav',state.blend>.5);
  updateGuidance();
 }
 const km=d=>d<1?`${Math.max(50,Math.round(d*1000/50)*50)} m`:d<10?`${d.toFixed(1).replace('.',',')} km`:`${Math.round(d)} km`;
 let lastStep='';
 function guidance(d){
  if(state.arrive>.3)return{icon:'pin',dist:'Vous êtes arrivé',text:'Mairie de Mantes-la-Ville',then:'Place de la Mairie · 78711'};
  if(d<JUNCTION)return{icon:'merge',dist:km(JUNCTION-d),text:'Rejoindre l’A13 direction Rouen',then:`Puis A13 sur ${Math.round(EXIT-JUNCTION)} km`};
  if(EXIT-d>6)return{icon:'straight',dist:km(EXIT-d),text:'Continuer sur l’A13',then:'Puis sortie Mantes-la-Ville'};
  if(d<EXIT)return{icon:'exit',dist:km(EXIT-d),text:'Sortie Mantes-la-Ville',then:'Puis direction centre-ville'};
  if(TOTAL-d>.03)return{icon:'pin',dist:km(TOTAL-d),text:'Mairie de Mantes-la-Ville',then:'Place de la Mairie'};
  return{icon:'pin',dist:'Arrivée',text:'Mairie de Mantes-la-Ville',then:'Place de la Mairie · 78711'};
 }
 function updateGuidance(){
  const d=state.d,g=guidance(d),step=g.icon+g.text;
  if(step!==lastStep){out.icon.setAttribute('d',ICONS[g.icon]);out.icon.setAttribute('fill',g.icon==='pin'?'currentColor':'none');
   if(lastStep&&travel){out.maneuver.classList.remove('is-swap');void out.maneuver.offsetWidth;out.maneuver.classList.add('is-swap');}lastStep=step;}
  out.dist.textContent=g.dist;out.text.textContent=g.text;if(out.then)out.then.textContent=g.then;
  const left=TOTAL-d,arrived=left<.03||state.arrive>.3;
  out.time.textContent=arrived?'Arrivé':`${Math.max(1,Math.ceil(minutesLeft(d)))} min`;out.km.textContent=arrived?'0 m':km(left);out.arrival.textContent=arrivalTime;
  // Vitesse simulée : nulle au départ et à l'arrivée.
  if(out.speed){const ramp=travel?clamp(1.8*Math.sin(Math.PI*state.k)):1;out.speed.textContent=arrived||state.k<=0&&travel?'0':String(Math.round(realSpeed(d)*ramp/5)*5);}
 }
 function setStop(index){currentStop=index;document.querySelectorAll('[data-stop]').forEach(b=>{const active=Number(b.dataset.stop)===index;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});}
 function stopAt(d){let i=0;STOPS.forEach((s,k)=>{if(d>=s-.01)i=k;});return i;}
 function showMap(on){root.classList.toggle('is-driving',on);map.style.opacity=on?'1':'0';ui.style.opacity=on?'1':'0';title.style.opacity=on?'0':'1';skip.hidden=!on;}
 function finishTravel(){cancelAnimationFrame(waitFrame);if(travel){travel.kill();travel=null;}root.classList.remove('is-primed');Object.assign(state,{reveal:1,blend:1,d:TOTAL,k:1,arrive:1});setStop(3);showMap(false);photo.style.transform='scale(1)';drawMap();}
 function stamp(){const t=new Date(Date.now()+MINUTES*60000);arrivalTime=`${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;}
 function selectStop(index){
  cancelAnimationFrame(waitFrame);if(travel){travel.kill();travel=null;}if(index===3){finishTravel();return;}
  stamp();setStop(index);Object.assign(state,index===0?{reveal:1,blend:0,d:0,k:0,arrive:0}:{reveal:1,blend:1,d:STOPS[index],k:.5,arrive:0});showMap(true);drawMap();
 }
 // Écran prêt (carte vide) pendant la fin de la transition de page, pour éviter un éclair de la photo.
 function prime(){Object.assign(state,{reveal:0,blend:0,d:0,k:0,arrive:0});root.classList.add('is-driving','is-primed');map.style.opacity='1';ui.style.opacity='0';title.style.opacity='0';skip.hidden=false;gsap.set(photo,{scale:1.06});drawMap();}
 function playTravel(){
  cancelAnimationFrame(waitFrame);
  if(!window.gsap||!animated()){finishTravel();return;}
  const primed=root.classList.contains('is-primed');root.classList.remove('is-primed');
  if(travel)travel.kill();travelStarted=true;stamp();setStop(0);lastStep='';Object.assign(state,{reveal:0,blend:0,d:0,k:0,arrive:0});
  gsap.set(ui,{opacity:0});if(!primed)gsap.set(map,{opacity:0});root.classList.add('is-driving');skip.hidden=false;title.style.opacity='0';gsap.set(photo,{scale:1.06});drawMap();
  travel=gsap.timeline({defaults:{onUpdate:drawMap},onComplete:()=>{travel=null;}});
  travel.to(map,{opacity:1,duration:primed?.01:.45,ease:'power1.out'})
   .to(state,{reveal:1,duration:1.3,ease:'power2.inOut'},.15)
   .to(ui,{opacity:1,duration:.4},1.2)
   .to(state,{blend:1,duration:1.5,ease:'power2.inOut'},'+=.35')
   .to(state,{k:1,duration:8.6,ease:'none',onUpdate(){state.d=distanceAt(easeInOut(state.k));drawMap();const s=stopAt(state.d);if(s!==currentStop)setStop(s);}},'-=.25')
   .call(()=>setStop(3))
   .to(state,{arrive:1,duration:2.2,ease:'none'})
   .to([map,ui],{opacity:0,duration:.8,ease:'power1.inOut'},'+=.5')
   .call(()=>{root.classList.remove('is-driving');skip.hidden=true;})
   .to(photo,{scale:1,duration:1.5,ease:'power2.out'},'<-.45')
   .to(title,{opacity:1,duration:.65},'<.3');
 }
 // Démarrage une fois la transition de page et l'introduction terminées.
 function whenVisible(callback){
  cancelAnimationFrame(waitFrame);const since=performance.now();
  const check=()=>{const curtain=document.querySelector('.wow-curtain'),shell=document.getElementById('experience-shell');
   const busy=(curtain&&getComputedStyle(curtain).visibility!=='hidden')||shell?.inert;
   if(busy&&performance.now()-since<6000){waitFrame=requestAnimationFrame(check);return;}
   if(!root.closest('.route-page')?.hidden)callback();};
  waitFrame=requestAnimationFrame(check);
 }
 document.querySelectorAll('[data-stop]').forEach(b=>b.addEventListener('click',()=>selectStop(Number(b.dataset.stop))));
 document.getElementById('travel-replay').addEventListener('click',playTravel);
 skip.addEventListener('click',finishTravel);
 new ResizeObserver(()=>{cancelAnimationFrame(drawFrame);drawFrame=requestAnimationFrame(drawMap);}).observe(root);
 finishTravel();
 const svg=(content)=>`<svg viewBox="0 0 440 90" aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
 const previews={
 glpi:'<img src="GLPI%20Dashboard.png" alt="" loading="lazy"><span class="project-visual-label">SUPPORT / GLPI</span>',
 migration:svg('<g stroke="currentColor" stroke-width="1.4"><rect x="45" y="18" width="75" height="52" rx="6"/><path d="M55 32h45M55 45h45M55 58h30"/><rect x="320" y="18" width="75" height="52" rx="6"/><path d="M330 32h45M330 45h45M330 58h30"/><path opacity=".3" d="M128 45h180"/><path class="data-pulse" d="M128 45h180" stroke-width="2"/><path d="m295 38 13 7-13 7"/></g><text x="220" y="30" text-anchor="middle" fill="#bfd6ff" font-size="10" font-family="monospace">TRANSFERT DE DONNÉES</text>'),
 municipol:svg('<g stroke="currentColor" stroke-width="1.4"><rect x="40" y="20" width="70" height="43" rx="4"/><path d="M65 72h20m-10-9v9M120 44h75M245 44h75"/><rect x="195" y="15" width="50" height="60" rx="4"/><path d="M205 30h30M205 44h30M205 58h30"/><ellipse cx="355" cy="25" rx="30" ry="10"/><path d="M325 25v35c0 14 60 14 60 0V25"/><path class="data-pulse" d="M120 44h75M245 44h75" stroke-width="3"/></g>'),
 gophish:'<img src="Gophish%20Dashboard.png" alt="" loading="lazy"><span class="project-visual-label">SENSIBILISATION / GOPHISH</span>'
 };
 document.querySelectorAll('.project-row').forEach(row=>{const visual=document.createElement('div');visual.className='project-visual';visual.setAttribute('aria-hidden','true');visual.innerHTML=previews[row.dataset.project];row.prepend(visual);});
 const evidence={system:['municipol'],network:['municipol','migration'],security:['gophish'],virtual:[],script:['migration'],cloud:[]};
 function enrichSkill(){
  const detail=document.getElementById('skill-detail'),key=document.querySelector('[data-skill].active').dataset.skill;
  detail.querySelector('.skill-evidence')?.remove();const ids=evidence[key];
  if(ids.length){const box=document.createElement('div');box.className='skill-evidence';box.innerHTML='<span>PROJETS ASSOCIÉS</span><div>'+ids.map(id=>`<button data-project="${id}">${projects.find(p=>p.id===id).title} ↗</button>`).join('')+'</div>';detail.append(box);}
  if(window.gsap&&animated())gsap.fromTo(detail,{opacity:.4,y:10},{opacity:1,y:0,duration:.4,clearProps:'transform,opacity'});
 }
 document.querySelectorAll('[data-skill]').forEach(b=>b.addEventListener('click',enrichSkill));enrichSkill();
 document.querySelectorAll('[data-watch]').forEach(button=>button.addEventListener('click',()=>{if(!window.gsap||!animated())return;gsap.fromTo('#watch-detail>*',{opacity:.2,x:14},{opacity:1,x:0,stagger:.04,duration:.45,ease:'power2.out',clearProps:'transform,opacity'});}));
 document.querySelectorAll('.mission').forEach(card=>{card.addEventListener('pointermove',e=>{if(!animated())return;const box=card.getBoundingClientRect();card.style.setProperty('--mx',`${e.clientX-box.left}px`);card.style.setProperty('--my',`${e.clientY-box.top}px`);});});
 window.addEventListener('portfolio:project',()=>{if(!window.gsap||!animated())return;gsap.fromTo('#project-dialog',{opacity:0,y:18,scale:.99},{opacity:1,y:0,scale:1,duration:.55,ease:'power3.out',clearProps:'transform,opacity'});gsap.fromTo('.project-detail-hero>h2,.project-detail-subtitle,.project-detail-visual',{opacity:0,y:12},{opacity:1,y:0,stagger:.025,duration:.5,delay:.1,clearProps:'transform,opacity'});});
 window.addEventListener('portfolio:page',e=>{if(e.detail.id==='entreprise'){if(!travelStarted){travelStarted=true;if(window.gsap&&animated()){prime();whenVisible(playTravel);}else finishTravel();}else if(currentStop===3&&!travel)finishTravel();}else if(travel||root.classList.contains('is-primed')){if(!travel)travelStarted=false;finishTravel();}if(e.detail.id==='competences')enrichSkill();});
 window.addEventListener('portfolio:motion',()=>{if(paused)finishTravel();});
 window.addEventListener('portfolio:theme',drawMap);
})();

