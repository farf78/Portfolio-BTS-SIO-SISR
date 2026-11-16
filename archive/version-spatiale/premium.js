'use strict';
(() => {
 const animated=()=>!paused;
 const root=document.getElementById('travel-stage');
 const map=document.getElementById('travel-map'),ctx=map.getContext('2d');
 const globe=root.querySelector('.travel-earth'),photo=root.querySelector('.mairie-photo');
 const title=root.querySelector('.destination-title'),reticle=root.querySelector('.travel-reticle');
 const region=document.getElementById('travel-region');
 const locations=[{name:'TERRE',lon:10,lat:30,scale:85},{name:'EUROPE',lon:8,lat:48,scale:420},{name:'FRANCE',lon:2.3,lat:46.6,scale:1700},{name:'ÎLE-DE-FRANCE',lon:2.15,lat:48.8,scale:11500},{name:'MANTES-LA-VILLE',lon:1.71,lat:48.97,scale:42000}];
 let travel=null,travelStarted=false,currentStop=4,state={...locations[4]},drawFrame=0;
 const rad=Math.PI/180;
 const mercator=lat=>Math.log(Math.tan(Math.PI/4+Math.max(-80,Math.min(80,lat))*rad/2));
 function drawMap(){
  if(!ctx||!window.GEOGRAPHY)return;
  const width=root.clientWidth,height=root.clientHeight;if(!width||!height)return;
  const ratio=Math.min(devicePixelRatio,1.5);
  if(map.width!==Math.round(width*ratio)||map.height!==Math.round(height*ratio)){map.width=Math.round(width*ratio);map.height=Math.round(height*ratio);}
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.fillStyle='#0a172a';ctx.fillRect(0,0,width,height);
  const scale=state.scale*width/550;
  const project=([lon,lat])=>[width/2+(lon-state.lon)*rad*scale,height/2-(mercator(lat)-mercator(state.lat))*scale];
  ctx.strokeStyle='#577caf12';ctx.lineWidth=1;
  for(let x=0;x<width;x+=45){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}
  for(let y=0;y<height;y+=45){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
  function feature(f,isDepartment=false){
   const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[];
   const code=f.properties.code;const selected=isDepartment?['75','77','78','91','92','93','94','95'].includes(code):f.properties.name==='France';
   ctx.fillStyle=selected?(code==='78'?'#375f94':'#254a78'):(isDepartment?'#152d49':'#152f4c');ctx.strokeStyle=selected?'#a3cfffaa':'#7099c866';ctx.lineWidth=selected?1.2:.6;
   polygons.forEach(polygon=>{ctx.beginPath();polygon.forEach(ring=>{ring.forEach((p,i)=>{const[x,y]=project(p);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.closePath();});ctx.fill('evenodd');ctx.stroke();});
  }
  window.GEOGRAPHY.world.features.forEach(f=>feature(f));
  if(state.scale>850)window.GEOGRAPHY.france.features.forEach(f=>feature(f,true));
  const marker=(lon,lat,label,major)=>{const[x,y]=project([lon,lat]);if(x<20||x>width-20||y<45||y>height-35)return;ctx.beginPath();ctx.arc(x,y,major?4:2.5,0,Math.PI*2);ctx.fillStyle=major?'#e2efff':'#9fbee9';ctx.fill();if(major){ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.strokeStyle='#b3d9ff88';ctx.stroke();}ctx.font=`${major?'500 ':''}11px Outfit,Arial`;ctx.fillStyle='#e0edff';ctx.fillText(label,Math.min(width-105,x+17),y-13);};
  marker(1.71,48.97,'Mantes-la-Ville',true);if(state.scale>800)marker(2.35,48.85,'Paris',false);
 }
 function setStop(index){currentStop=index;region.textContent=locations[index].name;document.querySelectorAll('[data-stop]').forEach(b=>{const active=Number(b.dataset.stop)===index;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});}
 function finishTravel(){if(travel){travel.kill();travel=null;}setStop(4);map.style.opacity='0';globe.style.opacity='0';reticle.style.opacity='0';title.style.opacity='1';photo.style.transform='scale(1.02)';document.getElementById('travel-skip').hidden=true;}
 function selectStop(index){
  if(travel){travel.kill();travel=null;}document.getElementById('travel-skip').hidden=index===4;setStop(index);
  if(index===4){finishTravel();return;}
  Object.assign(state,locations[index]);map.style.opacity=index===0?'0':'1';globe.style.opacity=index===0?'1':'0';reticle.style.opacity=index===0?'0':'.7';title.style.opacity='0';drawMap();
 }
 function playTravel(){
  if(!window.gsap||!animated()){finishTravel();return;}
  if(travel)travel.kill();travelStarted=true;setStop(0);Object.assign(state,locations[1]);drawMap();
  document.getElementById('travel-skip').hidden=false;
  gsap.set([map,title,reticle],{opacity:0});gsap.set(globe,{opacity:1,scale:1});gsap.set(photo,{scale:1.16});
  travel=gsap.timeline({onComplete:()=>{travel=null;document.getElementById('travel-skip').hidden=true;}});
  travel.to(globe,{scale:1.8,duration:1.1,ease:'power2.inOut'}).to(globe,{opacity:0,duration:.45},.75).to(map,{opacity:1,duration:.4},.75).call(()=>setStop(1),null,.85).to(reticle,{opacity:.7,duration:.4},1);
  [2,3,4].forEach((index)=>{travel.call(()=>setStop(index)).to(state,{lon:locations[index].lon,lat:locations[index].lat,scale:locations[index].scale,duration:index===4?1:1.15,ease:'power2.inOut',onUpdate:drawMap});});
  travel.to([map,reticle],{opacity:0,duration:.8},'>.15').to(photo,{scale:1.02,duration:1.5,ease:'power2.out'},'<').to(title,{opacity:1,duration:.65},'<.3');
 }
 document.querySelectorAll('[data-stop]').forEach(b=>b.addEventListener('click',()=>selectStop(Number(b.dataset.stop))));
 document.getElementById('travel-replay').addEventListener('click',playTravel);
 document.getElementById('travel-skip').addEventListener('click',finishTravel);
 new ResizeObserver(()=>{cancelAnimationFrame(drawFrame);drawFrame=requestAnimationFrame(drawMap);}).observe(root);
 finishTravel();
 const svg=(content)=>`<svg viewBox="0 0 440 90" aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
 const previews={
 glpi:'<img src="Interface%20GLPI.png" alt="" loading="lazy"><span class="project-visual-label">SUPPORT / GLPI</span>',
 migration:svg('<g stroke="currentColor" stroke-width="1.4"><rect x="45" y="18" width="75" height="52" rx="6"/><path d="M55 32h45M55 45h45M55 58h30"/><rect x="320" y="18" width="75" height="52" rx="6"/><path d="M330 32h45M330 45h45M330 58h30"/><path opacity=".3" d="M128 45h180"/><path class="data-pulse" d="M128 45h180" stroke-width="2"/><path d="m295 38 13 7-13 7"/></g><text x="220" y="30" text-anchor="middle" fill="#bfd6ff" font-size="10" font-family="monospace">TRANSFERT DE DONNÉES</text>'),
 municipol:svg('<g stroke="currentColor" stroke-width="1.4"><rect x="40" y="20" width="70" height="43" rx="4"/><path d="M65 72h20m-10-9v9M120 44h75M245 44h75"/><rect x="195" y="15" width="50" height="60" rx="4"/><path d="M205 30h30M205 44h30M205 58h30"/><ellipse cx="355" cy="25" rx="30" ry="10"/><path d="M325 25v35c0 14 60 14 60 0V25"/><path class="data-pulse" d="M120 44h75M245 44h75" stroke-width="3"/></g>'),
 epn:svg('<g stroke="currentColor" stroke-width="1.3"><path class="data-pulse" d="M220 20v20H80v15m140-15h140v15m-140-15v15"/><rect x="48" y="55" width="64" height="27" rx="4"/><rect x="188" y="55" width="64" height="27" rx="4"/><rect x="328" y="55" width="64" height="27" rx="4"/><circle cx="220" cy="17" r="12"/><path d="m214 17 4 4 8-9"/></g><text x="80" y="72" text-anchor="middle" font-size="9" fill="#c9dcff" font-family="monospace">WINDOWS</text><text x="220" y="72" text-anchor="middle" font-size="9" fill="#c9dcff" font-family="monospace">ATERA</text><text x="360" y="72" text-anchor="middle" font-size="9" fill="#c9dcff" font-family="monospace">SOPHOS</text>')
 };
 document.querySelectorAll('.project-row').forEach(row=>{const visual=document.createElement('div');visual.className='project-visual';visual.setAttribute('aria-hidden','true');visual.innerHTML=previews[row.dataset.project];row.prepend(visual);});
 const evidence={system:['municipol','epn'],network:['municipol','migration'],security:['epn'],virtual:[],script:['migration'],cloud:[]};
 function enrichSkill(){
  const detail=document.getElementById('skill-detail'),key=document.querySelector('[data-skill].active').dataset.skill;
  detail.querySelector('.skill-evidence')?.remove();const ids=evidence[key];
  if(ids.length){const box=document.createElement('div');box.className='skill-evidence';box.innerHTML='<span>PROJETS ASSOCIÉS</span><div>'+ids.map(id=>`<button data-project="${id}">${projects.find(p=>p.id===id).title} ↗</button>`).join('')+'</div>';detail.append(box);}
  if(window.gsap&&animated())gsap.fromTo(detail,{opacity:.4,y:10},{opacity:1,y:0,duration:.4,clearProps:'transform,opacity'});
 }
 document.querySelectorAll('[data-skill]').forEach(b=>b.addEventListener('click',enrichSkill));enrichSkill();
 document.querySelectorAll('[data-watch]').forEach(button=>button.addEventListener('click',()=>{if(!window.gsap||!animated())return;gsap.fromTo('#watch-detail>*',{opacity:.2,x:14},{opacity:1,x:0,stagger:.04,duration:.45,ease:'power2.out',clearProps:'transform,opacity'});}));
 document.querySelectorAll('.mission').forEach(card=>{card.addEventListener('pointermove',e=>{if(!animated())return;const box=card.getBoundingClientRect();card.style.setProperty('--mx',`${e.clientX-box.left}px`);card.style.setProperty('--my',`${e.clientY-box.top}px`);});});
 window.addEventListener('portfolio:project',()=>{if(!window.gsap||!animated())return;gsap.fromTo('#project-dialog',{opacity:0,y:35,scale:.94},{opacity:1,y:0,scale:1,duration:.5,ease:'power3.out',clearProps:'transform,opacity'});gsap.fromTo('#dialog-body>h3,#dialog-body>p,#dialog-body>.architecture,#dialog-body>.doc-links',{opacity:0,y:12},{opacity:1,y:0,stagger:.045,duration:.45,delay:.1,clearProps:'transform,opacity'});});
 window.addEventListener('portfolio:page',e=>{if(e.detail.id==='entreprise'){if(!travelStarted)playTravel();else if(currentStop===4)finishTravel();}else if(travel){finishTravel();}if(e.detail.id==='competences')enrichSkill();});
 window.addEventListener('portfolio:motion',()=>{if(paused)finishTravel();});
})();

