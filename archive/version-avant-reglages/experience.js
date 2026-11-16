'use strict';
(() => {
 const routes=[['accueil','Accueil'],['profil','Profil'],['entreprise','Entreprise'],['missions','Missions'],['projets','Projets'],['competences','Compétences'],['veille','Veille technologique'],['bilan','Bilan'],['contact','Contact'],['epreuve','Tableau de synthèse']];
 const pages=routes.map(([id])=>document.getElementById(id));
 const shell=document.getElementById('experience-shell'),boot=document.getElementById('boot-screen');
 let current='accueil',transition=null,intro=null,introTimer=null,bootDone=false;
 const canAnimate=()=>!paused&&Boolean(window.gsap);
 function resetPages(){if(!window.gsap)return;pages.forEach(page=>{gsap.killTweensOf(page);gsap.set(page,{clearProps:'transform,opacity,filter'});});}
 function setPage(id,focus=true){
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
  if(focus&&bootDone)page.focus({preventScroll:true});
  window.dispatchEvent(new CustomEvent('portfolio:page',{detail:{id}}));
 }
 function entrance(id){
  if(!canAnimate())return;
  const page=document.getElementById(id);
  if(window.portfolioCurtain)return; // wow.js orchestre les entrées détaillées
  gsap.fromTo(page,{opacity:0,y:8},{opacity:1,y:0,duration:.55,ease:'power3.out',clearProps:'transform,opacity'});
 }
 function navigate(id,{historyMode='push',animate=true}={}){
  if(!routes.some(r=>r[0]===id))id='accueil';
  if(historyMode==='push'&&location.hash!==`#${id}`)history.pushState({page:id},'',`#${id}`);
  if(historyMode==='replace')history.replaceState({page:id},'',`#${id}`);
  closeMenu();if(transition){transition.kill();transition=null;}resetPages();
  if(id===current||!animate||!canAnimate()||!bootDone){setPage(id);return;}
  if(window.portfolioCurtain){
   const index=routes.findIndex(r=>r[0]===id);
   transition=window.portfolioCurtain.play(routes[index][1],index+1,()=>{resetPages();setPage(id);});
   transition.eventCallback('onComplete',()=>{transition=null;document.querySelector('.wow-curtain')?.style.setProperty('visibility','hidden');});
   return;
  }
  const previous=document.getElementById(current);
  transition=gsap.timeline({onComplete:()=>{transition=null;}});
  transition.to(previous,{opacity:0,y:-4,duration:.14,ease:'power1.in'}).call(()=>{resetPages();setPage(id);entrance(id);});
 }
 document.addEventListener('click',event=>{const link=event.target.closest('a[href^="#"]');if(!link)return;const id=link.getAttribute('href').slice(1);if(routes.some(r=>r[0]===id)){event.preventDefault();navigate(id);}});
 window.addEventListener('popstate',()=>navigate(location.hash.slice(1),{historyMode:'none'}));
 window.addEventListener('hashchange',()=>{if(location.hash.slice(1)!==current)navigate(location.hash.slice(1),{historyMode:'none'});});
 document.getElementById('previous-page').addEventListener('click',()=>{const i=routes.findIndex(r=>r[0]===current);if(i>0)navigate(routes[i-1][0]);});
 document.getElementById('next-page').addEventListener('click',()=>{const i=routes.findIndex(r=>r[0]===current);if(i<routes.length-1)navigate(routes[i+1][0]);});
 function finishIntro(){
  clearTimeout(introTimer);if(intro){intro.kill();intro=null;}if(bootDone)return;bootDone=true;shell.inert=false;document.getElementById(current).focus({preventScroll:true});
  const hide=()=>{boot.hidden=true;boot.style.cssText='';};
  if(window.gsap&&Number(getComputedStyle(boot).opacity)>.05){
   gsap.to(boot,{opacity:0,scale:1.06,filter:'blur(14px)',duration:.7,ease:'power3.inOut',onComplete:hide});
  }else hide();
  window.dispatchEvent(new Event('portfolio:ready'));entrance(current);
 }
 function startIntro(){
  clearTimeout(introTimer);if(transition){transition.kill();transition=null;resetPages();}
  if(intro)intro.kill();if(window.gsap)gsap.killTweensOf(boot);bootDone=false;boot.hidden=false;shell.inert=true;boot.style.cssText='';
  document.getElementById('skip-intro').focus({preventScroll:true});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const terminal=boot.querySelector('.boot-terminal');
  const command=document.getElementById('boot-command'),percent=document.getElementById('boot-percent');
  const lines=[...boot.querySelectorAll('.boot-line')],meter=boot.querySelector('.boot-meter span');
  const identity=document.getElementById('cipher-name'),status=document.getElementById('cipher-status');
  const name='FARÈS AREF',alphabet='01ABCDEF/+=#%';
  // Each character settles independently; resolved letters never scramble again.
  const settleAt=[2100,3000,1700,3800,2600,0,3400,2300,4100,3200];
  let previousPhase=-1;
  let frame=0,elapsed=0,last=null,cancelled=false;
  const clamp=value=>Math.max(0,Math.min(1,value));
  function draw(){
   const arrival=clamp(elapsed/650),exit=clamp((elapsed-5300)/700);
   terminal.style.opacity=String(reduced?1:arrival);
   terminal.style.transform=reduced?'none':`translateY(${(1-arrival)*8}px)`;
   boot.style.opacity=String(reduced?1:1-exit);
   const phase=Math.floor(elapsed/90);
   if(phase!==previousPhase){
    previousPhase=phase;
    identity.innerHTML=[...name].map((char,index)=>{
     if(char===' ')return '<span class="cipher-space"> </span>';
     const resolved=reduced||elapsed>=settleAt[index];
     const step=Math.floor(elapsed/(70+index*17));
     const glyph=resolved?char:alphabet[(step*step+index*7+step*3)%alphabet.length];
     return `<span class="cipher-letter ${resolved?'is-decoded':'is-encoded'}">${glyph}</span>`;
    }).join('');
   }
   boot.classList.toggle('cipher-unlocked',elapsed>=4400);
   status.textContent=elapsed<900?'SIGNAL IDENTIFIÉ':elapsed<4100?'DÉCHIFFREMENT EN COURS':elapsed<4400?'IDENTITÉ CONFIRMÉE':'ACCÈS AUTORISÉ';
   const keys=[...name].filter(char=>char!==' ');
   command.textContent=elapsed<4400?'[ '+keys.map((char,i)=>{
    const index=i<5?i:i+1;
    return elapsed>=settleAt[index]?char.charCodeAt(0).toString(16).toUpperCase().padStart(2,'0'):(reduced?'··':((Math.floor(elapsed/180)*13+i*37)%256).toString(16).padStart(2,'0').toUpperCase());
   }).join(' ')+' ]':'[ IDENTITÉ VÉRIFIÉE · ACCÈS AUTORISÉ ]';
   lines.forEach((line,index)=>{const start=[1000,4100,4400][index];line.style.opacity=String(reduced?Number(elapsed>=start):clamp((elapsed-start)/400));line.style.transform='none';});
   const progress=clamp((elapsed-700)/3700);
   percent.textContent=String(Math.round(progress*100)).padStart(2,'0');
   meter.style.transform=`scaleX(${progress})`;
  }
  // Count visible frames only: background tabs cannot consume the introduction.
  function tick(now){
   if(cancelled)return;
   if(last!==null&&!document.hidden)elapsed+=Math.min(now-last,100);
   last=now;draw();
   if(elapsed>=6000){finishIntro();return;}
   frame=requestAnimationFrame(tick);
  }
  intro={kill(){cancelled=true;cancelAnimationFrame(frame);}};
  draw();frame=requestAnimationFrame(tick);
 }
 document.getElementById('skip-intro').addEventListener('click',finishIntro);
 document.getElementById('replay-intro').addEventListener('click',startIntro);
 document.addEventListener('keydown',event=>{if(!bootDone&&event.key==='Escape')finishIntro();});
 navigate(location.hash.slice(1)||'accueil',{historyMode:'replace',animate:false});startIntro();
})();

// Fit each complete slide into the stage, without removing any content.
(() => {
 const stage = document.getElementById('page-stage');
 let frame;
 function fit() {
  const page = stage.querySelector('.route-page:not([hidden])');
  if (!page || !stage.clientHeight) return;
  if (matchMedia('(max-width:760px)').matches) {
   page.classList.remove('presentation-fit');
   ['zoom','width','height','min-height','left'].forEach(property=>page.style.removeProperty(property));
   return;
  }
  page.classList.add('presentation-fit');
  page.style.zoom = '1';
  page.style.width = `${stage.clientWidth}px`;
  page.style.height = 'auto';
  page.style.minHeight = `${stage.clientHeight}px`;
  const height = Math.max(page.scrollHeight, page.offsetHeight);
  const scale = Math.min(1, (stage.clientHeight - 2) / height);
  page.style.zoom = String(scale);
  page.style.left = `${(stage.clientWidth / scale - stage.clientWidth) / 2}px`;
  page.scrollTop = 0;
 }
 function schedule() { cancelAnimationFrame(frame); frame = requestAnimationFrame(fit); }
 window.addEventListener('portfolio:page', schedule);
 window.addEventListener('resize', schedule);
 stage.addEventListener('toggle', schedule, true);
 stage.addEventListener('load', schedule, true);
 new MutationObserver(schedule).observe(stage, {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['hidden']});
 new ResizeObserver(schedule).observe(stage);
 document.fonts.ready.then(schedule);
 schedule();
})();
