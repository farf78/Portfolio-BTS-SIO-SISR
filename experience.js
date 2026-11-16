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
  if(window.gsap&&!paused&&Number(getComputedStyle(boot).opacity)>.05){
   gsap.to(boot,{opacity:0,scale:1.06,filter:'blur(14px)',duration:.7,ease:'power3.inOut',onComplete:hide});
  }else hide();
  window.dispatchEvent(new Event('portfolio:ready'));entrance(current);
 }
 function startIntro(){
  clearTimeout(introTimer);if(transition){transition.kill();transition=null;resetPages();}
  if(intro)intro.kill();if(window.gsap)gsap.killTweensOf(boot);bootDone=false;boot.hidden=false;shell.inert=true;boot.style.cssText='';
  document.getElementById('skip-intro').focus({preventScroll:true});
  // Déchiffrement du dossier : la clé se verrouille octet par octet, puis le nom et les
  // informations passent du texte chiffré au texte en clair, et le cadenas s'ouvre.
  // « Réduire les animations » joue la même séquence trois fois plus vite, sans fond animé.
  const quick=paused,speed=quick?3:1;
  const terminal=boot.querySelector('.boot-terminal'),percent=document.getElementById('boot-percent'),meter=boot.querySelector('.boot-meter span');
  const identity=document.getElementById('cipher-name'),status=document.getElementById('cipher-status'),keyEl=document.getElementById('cipher-key');
  const rows=[...boot.querySelectorAll('[data-decrypt]')];
  const name='FARÈS AREF',glyphs='0123456789ABCDEF#%/+=$@';
  const keyBytes=['7A','3F','C1','09','E4','5D','B2','68'];
  const pick=(a,b)=>glyphs[Math.abs(a*31+b*17+(a%13)*(b%7)*5)%glyphs.length];
  const clamp=value=>Math.max(0,Math.min(1,value));
  // Repères de la séquence, en millisecondes.
  const KEY_START=450,KEY_STEP=150,NAME_START=1750,NAME_STEP=165,ROW_START=2450,ROW_STEP=470,ROW_TIME=950,UNLOCK=4700,END=6200;
  const nameOrder=[3,0,6,1,8,0,4,7,2,5]; // ordre d'apparition des lettres (l'espace est ignoré)
  const rain=document.getElementById('boot-rain'),rainCtx=rain?.getContext('2d');
  let cells=[],rainCols=0,lastRain=-1,lastPhase=-1,frame=0,elapsed=0,last=null,cancelled=false;
  function sizeRain(){
   if(!rainCtx)return;const ratio=Math.min(devicePixelRatio||1,1.5);
   rain.width=Math.round(innerWidth*ratio);rain.height=Math.round(innerHeight*ratio);rainCtx.setTransform(ratio,0,0,ratio,0,0);
   rainCols=Math.ceil(innerWidth/30);const count=rainCols*Math.ceil(innerHeight/24);
   cells=Array.from({length:count},(_,i)=>({glyph:pick(i,i>>3),alpha:.3+((i*37)%60)/100,order:((i*97)%100)/100}));
   lastRain=-1;
  }
  // Fond de caractères chiffrés qui s'efface à mesure que le dossier est déchiffré.
  function drawRain(){
   if(!rainCtx)return;const tick=Math.floor(elapsed/90);if(tick===lastRain)return;lastRain=tick;
   rainCtx.clearRect(0,0,innerWidth,innerHeight);if(quick)return;
   const dark=document.documentElement.dataset.theme==='dark',cleared=clamp((elapsed-NAME_START)/(UNLOCK-NAME_START));
   rainCtx.font='12px "Space Mono",monospace';rainCtx.textBaseline='top';rainCtx.fillStyle=dark?'#6cb2ff':'#0071e3';
   cells.forEach((cell,i)=>{
    if((i*53+tick*7)%9===0)cell.glyph=pick(tick+i,i);
    if(cell.order<cleared)return;
    rainCtx.globalAlpha=cell.alpha*(dark?.45:.42);rainCtx.fillText(cell.glyph,(i%rainCols)*30+9,Math.floor(i/rainCols)*24+6);
   });
   rainCtx.globalAlpha=1;
  }
  function draw(){
   const arrival=clamp(elapsed/500),exit=clamp((elapsed-(END-600))/600);
   terminal.style.opacity=String(arrival);
   terminal.style.transform=quick?'none':`translateY(${(1-arrival)*10}px)`;
   boot.style.opacity=String(1-exit);
   const phase=Math.floor(elapsed/70);
   if(phase!==lastPhase){
    lastPhase=phase;
    keyEl.innerHTML=keyBytes.map((byte,i)=>elapsed>=KEY_START+i*KEY_STEP?`<b>${byte}</b>`:`<i>${pick(phase+i,i)}${pick(phase+i*3,i+5)}</i>`).join('');
    identity.innerHTML=[...name].map((char,i)=>{
     if(char===' ')return '<span class="cipher-space"> </span>';
     const resolved=elapsed>=NAME_START+nameOrder[i]*NAME_STEP;
     return `<span class="cipher-letter ${resolved?'is-decoded':'is-encoded'}">${resolved?char:pick(phase+i*3,i)}</span>`;
    }).join('');
    rows.forEach((row,r)=>{
     const text=row.dataset.decrypt,clear=Math.round(clamp((elapsed-ROW_START-r*ROW_STEP)/ROW_TIME)*text.length);
     let cipher='';for(let i=clear;i<text.length;i++)cipher+=text[i]===' '?' ':pick(phase+i*5+r,i+r*11);
     row.innerHTML=`<span class="is-clear">${text.slice(0,clear)}</span><span class="is-cipher">${cipher}</span>`;
     row.classList.toggle('is-done',clear===text.length);
    });
   }
   boot.classList.toggle('cipher-unlocked',elapsed>=UNLOCK);
   status.textContent=elapsed<KEY_START?'FICHIER CHIFFRÉ':elapsed<NAME_START?'RECHERCHE DE LA CLÉ':elapsed<UNLOCK?'DÉCHIFFREMENT EN COURS':'ACCÈS AUTORISÉ';
   const progress=clamp((elapsed-KEY_START)/(UNLOCK-KEY_START));
   percent.textContent=String(Math.round(progress*100)).padStart(2,'0');
   meter.style.transform=`scaleX(${progress})`;
   drawRain();
  }
  // Seules les images visibles comptent : un onglet en arrière-plan ne consomme pas l'introduction.
  function tick(now){
   if(cancelled)return;
   if(last!==null&&!document.hidden)elapsed+=Math.min(now-last,100)*speed;
   last=now;draw();
   if(elapsed>=END){finishIntro();return;}
   frame=requestAnimationFrame(tick);
  }
  intro={kill(){cancelled=true;cancelAnimationFrame(frame);}};
  sizeRain();draw();frame=requestAnimationFrame(tick);
 }
 document.getElementById('skip-intro').addEventListener('click',finishIntro);
 document.getElementById('replay-intro').addEventListener('click',startIntro);
 document.addEventListener('keydown',event=>{if(!bootDone&&event.key==='Escape')finishIntro();});
 navigate(location.hash.slice(1)||'accueil',{historyMode:'replace',animate:false});startIntro();
})();

// Cale chaque rubrique dans la scène comme une diapositive, sans retirer de contenu :
// réduite si elle dépasse, agrandie sur les écrans plus grands que la maquette (1440 × 810).
(() => {
 const stage = document.getElementById('page-stage');
 let frame, memo = null;
 function fit() {
  const page = stage.querySelector('.route-page:not([hidden])');
  if (!page || !stage.clientHeight) return;
  if (matchMedia('(max-width:760px)').matches) {
   page.classList.remove('presentation-fit');memo = null;
   ['zoom','width','height','min-height','left'].forEach(property=>page.style.removeProperty(property));
   return;
  }
  page.classList.add('presentation-fit');
  const W = stage.clientWidth, H = stage.clientHeight;
  const cap = Math.max(1, Math.min(1.4, innerWidth / 1440, innerHeight / 810));
  page.style.left = '0px';page.style.height = 'auto';
  // Hauteur de mise en page à l'échelle s. Mesurée sans zoom ni hauteur minimale : les éléments
  // en cours d'animation (décalés par transform) ou décoratifs (globe) ne comptent pas.
  const natural = s => {page.style.zoom = '1';page.style.minHeight = '0px';page.style.width = `${W / s}px`;return page.offsetHeight;};
  let scale;
  if (memo && memo.id === page.id && memo.W === W && memo.H === H && natural(memo.scale) === memo.height) scale = memo.scale;
  else {
   if (natural(cap) * cap <= H) scale = cap;
   else if (cap === 1 && natural(1) <= H * 1.015) scale = 1; // pas de réduction pour quelques pixels : le texte reste net
   else {
    let low = .5, high = cap;
    for (let i = 0; i < 7; i++) {const middle = (low + high) / 2;if (natural(middle) * middle <= H) low = middle;else high = middle;}
    scale = low > 1 && low < 1.015 ? 1 : low;
   }
   memo = {id: page.id, W, H, scale, height: natural(scale)};
  }
  page.style.zoom = String(scale);
  page.style.width = `${W / scale}px`;
  page.style.minHeight = `${H / scale}px`;
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
