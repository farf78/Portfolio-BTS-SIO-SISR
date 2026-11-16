'use strict';
(() => {
 const routes=[['accueil','Accueil'],['profil','Profil'],['entreprise','Entreprise'],['missions','Missions'],['projets','Projets'],['competences','Compétences'],['epreuve','Épreuve E5'],['veille','Veille technologique'],['bilan','Bilan'],['contact','Contact']];
 const pages=routes.map(([id])=>document.getElementById(id));
 const shell=document.getElementById('experience-shell');
 const overlay=document.getElementById('page-transition');
 const boot=document.getElementById('boot-screen');
 const motionControl=document.getElementById('motion-control');
 let current='accueil',transition=null,introFrame=0,bootAnimation=null,bootDone=false;
 const canAnimate=()=>!paused;
 function setPage(id,{focus=true}={}){
  const index=routes.findIndex(r=>r[0]===id);if(index<0)return;
  pages.forEach(page=>{page.hidden=page.id!==id;page.setAttribute('aria-hidden',String(page.hidden));});
  current=id;const page=document.getElementById(id);page.scrollTop=0;
  document.title=`${routes[index][1]} — Farès Aref · Portfolio SISR`;
  document.querySelectorAll('[data-route]').forEach(link=>{const active=link.dataset.route===id;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  document.getElementById('header-page').textContent=routes[index][1].toUpperCase();
  document.getElementById('page-current').textContent=String(index+1).padStart(2,'0');
  document.getElementById('page-label').textContent=routes[index][1];
  document.getElementById('previous-page').disabled=index===0;
  document.getElementById('next-page').disabled=index===routes.length-1;
  document.querySelector('#next-page span').textContent=routes[index+1]?.[1]||'Fin';
  if(focus)page.focus({preventScroll:true});
 }
 function entrance(id){
  if(!window.gsap||!canAnimate())return;
  const page=document.getElementById(id);
  gsap.fromTo(page,{opacity:.2,scale:.97,rotateY:2,filter:'blur(5px)'},{opacity:1,scale:1,rotateY:0,filter:'blur(0px)',duration:.8,ease:'power3.out',clearProps:'transform,filter,opacity'});
  const items=page.querySelectorAll('.section-heading,.heading-row,.profile-grid>div,.mission,.project-row,.skill-network,.skill-detail,.watch-layout,.bilan-grid article,.contact-grid>div,.contact-grid>form,.hero-content>*');
  gsap.fromTo(items,{y:24,opacity:0},{y:0,opacity:1,stagger:.045,duration:.6,ease:'power3.out',clearProps:'transform,opacity'});
  if(id==='accueil')gsap.fromTo('#globe-scene',{scale:1.35,opacity:0},{scale:1,opacity:1,duration:1.8,ease:'expo.out',clearProps:'transform,opacity'});
  if(id==='entreprise'){
   gsap.fromTo('.journey-map',{scale:.85,opacity:.2},{scale:1,opacity:1,duration:1.2,ease:'expo.out',clearProps:'transform,opacity'});
   gsap.fromTo('.map-grid',{scale:3},{scale:1,duration:2,ease:'power3.out',clearProps:'transform'});
   gsap.fromTo('.city',{y:80,opacity:0},{y:0,opacity:.8,delay:.5,duration:1.2,ease:'power3.out',clearProps:'transform,opacity'});
  }
 }
 function navigate(id,{historyMode='push',animate=true}={}){
  if(!routes.some(r=>r[0]===id))id='accueil';
  if(historyMode==='push'&&location.hash!==`#${id}`)history.pushState({page:id},'',`#${id}`);
  if(historyMode==='replace')history.replaceState({page:id},'',`#${id}`);
  closeMenu();if(transition){transition.kill();transition=null;}
  if(window.gsap){gsap.killTweensOf(pages);pages.forEach(p=>gsap.set(p,{clearProps:'transform,filter,opacity'}));}
  if(id===current||!animate||!window.gsap||!canAnimate()||!bootDone){overlay.style.visibility='hidden';setPage(id,{focus:bootDone});return;}
  overlay.style.visibility='visible';document.getElementById('transition-name').textContent=routes.find(r=>r[0]===id)[1].toUpperCase();
  transition=gsap.timeline({onComplete:()=>{overlay.style.visibility='hidden';transition=null;}});
  transition.set('#transition-name',{opacity:0}).fromTo('#page-transition>span',{yPercent:105},{yPercent:0,duration:.35,stagger:.045,ease:'power3.inOut'}).to('#transition-name',{opacity:1,duration:.1}).call(()=>setPage(id)).to('#transition-name',{opacity:0,duration:.18,delay:.08}).to('#page-transition>span',{yPercent:-105,duration:.45,stagger:.045,ease:'power3.inOut'}).call(()=>entrance(id),null,'-=.3');
 }
 document.addEventListener('click',event=>{const link=event.target.closest('a[href^="#"]');if(!link)return;const id=link.getAttribute('href').slice(1);if(routes.some(r=>r[0]===id)){event.preventDefault();navigate(id);}});
 window.addEventListener('popstate',()=>navigate(location.hash.slice(1),{historyMode:'none'}));
 window.addEventListener('hashchange',()=>{if(location.hash.slice(1)!==current)navigate(location.hash.slice(1),{historyMode:'none'});});
 document.getElementById('previous-page').addEventListener('click',()=>{const i=routes.findIndex(r=>r[0]===current);if(i>0)navigate(routes[i-1][0]);});
 document.getElementById('next-page').addEventListener('click',()=>{const i=routes.findIndex(r=>r[0]===current);if(i<routes.length-1)navigate(routes[i+1][0]);});
 function finishIntro(immediate=false){
  if(bootDone)return;bootDone=true;cancelAnimationFrame(introFrame);if(bootAnimation)bootAnimation.kill();
  const complete=()=>{boot.hidden=true;shell.inert=false;document.getElementById(current).focus({preventScroll:true});entrance(current);};
  if(window.gsap&&canAnimate()&&!immediate){gsap.to(boot,{opacity:0,scale:1.12,filter:'blur(12px)',duration:.65,ease:'power3.in',onComplete:complete});}else complete();
 }
 function startIntro(){
  if(transition){transition.kill();transition=null;overlay.style.visibility='hidden';}
  bootDone=false;boot.hidden=false;shell.inert=true;boot.style.cssText='';
  document.getElementById('skip-intro').focus({preventScroll:true});
  if(!canAnimate()){finishIntro(true);return;}
  const canvas=document.getElementById('boot-particles'),ctx=canvas.getContext('2d');let width=innerWidth,height=innerHeight;
  canvas.width=width;canvas.height=height;
  let seed=128;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  const stars=Array.from({length:130},()=>({x:(rnd()-.5)*width,y:(rnd()-.5)*height,z:rnd()*width}));
  const start=performance.now();
  const labels=['INITIALISATION DE L’INTERFACE','CONNEXION À L’UNIVERS SISR','SYNCHRONISATION DES MODULES','IDENTITÉ CHARGÉE / FARÈS AREF','ACCÈS AU PORTFOLIO'];
  function render(now){
   if(bootDone)return;if(!canAnimate()){finishIntro(true);return;}
   const progress=Math.min((now-start)/3200,1);
   document.getElementById('boot-percent').textContent=`${String(Math.floor(progress*100)).padStart(2,'0')}%`;
   document.getElementById('boot-label').textContent=labels[Math.min(4,Math.floor(progress*5))];
   document.querySelector('.boot-track>span').style.width=`${progress*100}%`;
   if(ctx){ctx.clearRect(0,0,width,height);for(const star of stars){star.z-=3+progress*8;if(star.z<1)star.z=width;const x=width/2+star.x/star.z*width,y=height/2+star.y/star.z*width;const oldX=width/2+star.x/(star.z+10+progress*18)*width,oldY=height/2+star.y/(star.z+10+progress*18)*width;ctx.strokeStyle=`rgba(127,177,255,${Math.max(0,1-star.z/width)*.6})`;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(oldX,oldY);ctx.lineTo(x,y);ctx.stroke();}}
   if(progress>=1){finishIntro();return;}introFrame=requestAnimationFrame(render);
  }
  if(window.gsap){bootAnimation=gsap.timeline();bootAnimation.fromTo('.boot-core',{scale:.5,opacity:0,rotation:-50},{scale:1,opacity:1,rotation:0,duration:1.2,ease:'expo.out'}).fromTo('.boot-copy',{y:25,opacity:0},{y:0,opacity:1,duration:.7},.25);}
  introFrame=requestAnimationFrame(render);
 }
 document.getElementById('skip-intro').addEventListener('click',()=>finishIntro(true));
 document.getElementById('replay-intro').addEventListener('click',startIntro);
 document.addEventListener('keydown',e=>{if(!bootDone&&e.key==='Escape')finishIntro(true);});
 function syncMotion(){document.documentElement.classList.toggle('motion-enabled',!paused);motionControl.setAttribute('aria-pressed',String(paused));motionControl.textContent=paused?'Animations : en pause':'Animations : actives';if(paused&&transition){transition.progress(1);overlay.style.visibility='hidden';}if(paused&&window.gsap){gsap.globalTimeline.getChildren().forEach(tween=>{if(tween.targets&&tween.targets().some(t=>t instanceof Element&&t.closest('.route-page')))tween.progress(1);});}}
 motionControl.addEventListener('click',()=>{paused=!paused;updateMotion();syncMotion();});
 reduceMotion.addEventListener('change',syncMotion);syncMotion();
 document.querySelectorAll('.project-row').forEach(row=>{row.addEventListener('pointermove',event=>{if(!canAnimate()||event.pointerType==='touch')return;const r=row.getBoundingClientRect();const x=(event.clientX-r.left)/r.width-.5,y=(event.clientY-r.top)/r.height-.5;row.style.transform=`perspective(800px) rotateX(${-y*5}deg) rotateY(${x*4}deg) translateZ(3px)`;});row.addEventListener('pointerleave',()=>row.style.transform='');});
 navigate(location.hash.slice(1)||'accueil',{historyMode:'replace',animate:false});startIntro();
})();

