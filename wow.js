'use strict';
/* wow.js — animations « effet WOW » ajoutées par-dessus la navigation existante.
   Écoute les événements portfolio:page / portfolio:ready et expose
   window.portfolioCurtain, utilisé par experience.js pour les transitions. */
(() => {
 if(!window.gsap)return;
 // Les animations complètes sont jouées, sauf si « Réduire les animations » est activé.
 const isReduced=()=>typeof paused!=='undefined'&&paused;
 const finePointer=matchMedia('(pointer:fine)').matches;
 const boot=document.getElementById('boot-screen');
 const routes=['accueil','profil','entreprise','missions','projets','competences','veille','bilan','contact','epreuve'];
 const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];

 /* ---------- Ambiance ---------- */
 const ambient=document.createElement('div');ambient.className='wow-ambient';ambient.setAttribute('aria-hidden','true');
 ambient.innerHTML='<i></i><i></i><i></i><div class="wow-grid"></div>';document.body.prepend(ambient);
 const grid=$('.wow-grid',ambient);
 const progress=document.createElement('div');progress.className='wow-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);

 /* ---------- Découpage des titres en mots (et lettres pour le nom) ---------- */
 function splitWords(el){
  if(el.dataset.wowSplit)return;el.dataset.wowSplit='1';
  const walk=(node,accent)=>{
   [...node.childNodes].forEach(child=>{
    if(child.nodeType===3){
     const parts=child.textContent.split(/(\s+)/);const frag=document.createDocumentFragment();
     parts.forEach(part=>{
      if(!part)return;
      if(/^\s+$/.test(part)){frag.append(document.createTextNode(' '));return;}
      const w=document.createElement('span');w.className='wow-word'+(accent?' is-accent':'');
      const i=document.createElement('span');i.className='wow-inner';i.textContent=part;w.append(i);frag.append(w);
     });
     child.replaceWith(frag);
    }else if(child.nodeType===1&&child.tagName!=='BR'){walk(child,accent||child.tagName==='SPAN');}
   });
  };
  walk(el,false);
 }
 function splitChars(el){
  if(el.dataset.wowSplit)return;el.dataset.wowSplit='1';
  const walk=node=>[...node.childNodes].forEach(child=>{
   if(child.nodeType===3){const frag=document.createDocumentFragment();[...child.textContent].forEach(ch=>{if(ch===' '){frag.append(document.createTextNode(' '));return;}const s=document.createElement('span');s.className='wow-char';s.textContent=ch;frag.append(s);});child.replaceWith(frag);}
   else if(child.nodeType===1)walk(child);
  });
  el.setAttribute('aria-label',el.textContent.trim());walk(el);
  [...el.querySelectorAll('.wow-char')].forEach(c=>c.setAttribute('aria-hidden','true'));
 }
 const heroTitle=$('#accueil h1');splitChars(heroTitle);
 $$('#page-stage h2').forEach(splitWords);
 $$('.hero-role').forEach(splitWords);

 /* ---------- Frise ---------- */
 const timeline=$('.timeline');
 if(timeline){const l=document.createElement('span');l.className='wow-timeline-line';l.setAttribute('aria-hidden','true');l.innerHTML='<i></i>';timeline.prepend(l);}

 /* ---------- Rideau de transition ---------- */
 const curtain=document.createElement('div');curtain.className='wow-curtain';curtain.setAttribute('aria-hidden','true');
 curtain.innerHTML='<div class="wc-back"></div><div class="wc-front"><div class="wc-index"><span></span></div><div class="wc-title"><span></span></div><div class="wc-line"><i></i></div></div>';
 document.body.append(curtain);
 const back=$('.wc-back',curtain),front=$('.wc-front',curtain),cIndex=$('.wc-index span',curtain),cTitle=$('.wc-title span',curtain),cLine=$('.wc-line i',curtain);
 window.portfolioCurtain={
  play(label,number,onCovered){
   if(isReduced()){const tl=gsap.timeline();tl.call(onCovered);return tl;}
   cIndex.textContent=String(number).padStart(2,'0')+' / '+String(routes.length).padStart(2,'0');cTitle.textContent=label;
   const tl=gsap.timeline({defaults:{ease:'expo.inOut'},onComplete(){gsap.set(curtain,{visibility:'hidden'});}});
   tl.set(curtain,{visibility:'visible'})
    // Environ 2,1 s au total : le rideau couvre, le titre reste lisible, puis le rideau se lève.
    .to(back,{clipPath:'inset(0% 0% 0% 0%)',duration:.65})
    .to(front,{clipPath:'inset(0% 0% 0% 0%)',duration:.65},.1)
    .fromTo([cIndex,cTitle],{yPercent:120},{yPercent:0,duration:.7,ease:'expo.out',stagger:.06},.4)
    .fromTo(cLine,{scaleX:0},{scaleX:1,duration:.65,ease:'power3.inOut'},.4)
    .call(onCovered,null,.8)
    .to([cIndex,cTitle],{yPercent:-120,duration:.5,ease:'expo.in',stagger:.04},1.05)
    .to(front,{clipPath:'inset(0% 0% 100% 0%)',duration:.7},1.3)
    .to(back,{clipPath:'inset(0% 0% 100% 0%)',duration:.7},1.39)
    .set([back,front],{clipPath:'inset(100% 0% 0% 0%)'});
   return tl;
  }
 };

 /* ---------- Entrées de rubrique ---------- */
 const cardSel='.mission,.project-row,.timeline article,.bilan-grid article,.company-metrics>div,.watch-sidebar>button,#watch-detail,.sources>*,.contact-links a,.email-link,#contact-form>*,.identity,.tags span,.profile-copy>p,.company-story>p,.company-story>h3,.company-story>.button,.destination,.travel-stops>*,.filters button,.synthesis-cover>:not(h2),.heading-row>p,.skill-detail,.company-chain>*,.location-chip,.watch-status,.section>.small,.missions-grid~*';
 function counters(page){
  $$('.company-metrics strong',page).forEach(el=>{
   const original=el.dataset.wowValue||(el.dataset.wowValue=el.textContent);
   const m=original.match(/^(\D*)(\d+)(.*)$/);if(!m||m[3].includes('/'))return;
   const o={v:0};gsap.to(o,{v:+m[2],duration:1.8,delay:.5,ease:'power3.out',onUpdate(){el.textContent=m[1]+Math.round(o.v)+m[3];},onComplete(){el.textContent=original;}});
  });
 }
 function entrance(id,delay=0){
  const page=document.getElementById(id);if(!page||isReduced())return;
  const tl=gsap.timeline({delay});
  const words=$$('h2 .wow-inner',page);
  const eyebrows=$$('.eyebrow',page).filter(e=>!e.closest('.skill-detail,#watch-detail,.company-story'));
  if(eyebrows.length)tl.fromTo(eyebrows,{opacity:0,x:-14,letterSpacing:'.4em'},{opacity:1,x:0,letterSpacing:'.14em',duration:.9,ease:'expo.out',stagger:.06,clearProps:'opacity,transform,letterSpacing'},0);
  if(words.length)tl.fromTo(words,{yPercent:115,rotate:5},{yPercent:0,rotate:0,duration:1.05,ease:'expo.out',stagger:.055,clearProps:'transform'},.05);
  const art=$('.rubric-art',page);if(art)tl.fromTo(art,{opacity:0,scale:.8,rotate:-8},{opacity:1,scale:1,rotate:0,duration:1.1,ease:'elastic.out(1,.7)',clearProps:'all'},.25);
  const cards=$$(cardSel,page).filter(el=>el.offsetParent!==null);
  if(cards.length)tl.fromTo(cards,{opacity:0,y:36,scale:.97,filter:'blur(6px)'},{opacity:1,y:0,scale:1,filter:'blur(0px)',duration:.9,ease:'expo.out',stagger:{each:.045,from:'start'},clearProps:'opacity,transform,filter'},.25);
  const nodes=$$('.skill-node,.network-hub',page);
  if(nodes.length){tl.fromTo(nodes,{opacity:0,filter:'blur(8px)'},{opacity:1,filter:'blur(0px)',duration:.8,stagger:.07,clearProps:'opacity,filter'},.3);
   const path=$('.skill-network svg path',page);if(path){const len=4000;tl.fromTo(path,{strokeDasharray:len,strokeDashoffset:len},{strokeDashoffset:0,duration:1.6,ease:'power2.inOut',clearProps:'strokeDasharray,strokeDashoffset'},.3);}}
  const line=$('.wow-timeline-line i',page);if(line)tl.fromTo(line,{scaleY:0},{scaleY:1,duration:1.6,ease:'power3.inOut'},.3);
  if(id==='accueil')heroEntrance(tl);
  if(id==='entreprise')counters(page);
 }
 function heroEntrance(tl){
  const chars=$$('.wow-char',heroTitle);
  tl.fromTo(chars,{yPercent:110,opacity:0,rotateX:-80,filter:'blur(10px)'},{yPercent:0,opacity:1,rotateX:0,filter:'blur(0px)',duration:1.2,ease:'expo.out',stagger:.045,clearProps:'transform,opacity,filter'},.1);
  tl.fromTo('.hero-role .wow-inner',{yPercent:115},{yPercent:0,duration:1,ease:'expo.out',stagger:.06,clearProps:'transform'},.45);
  tl.fromTo('.hero-description,.hero-actions>*,.hero-bottom>*,.orbit-label',{opacity:0,y:24},{opacity:1,y:0,duration:.9,ease:'expo.out',stagger:.08,clearProps:'opacity,transform'},.7);
  tl.fromTo('#globe-scene',{opacity:0,scale:.82,rotate:-6},{opacity:1,scale:1,rotate:0,duration:2,ease:'expo.out',clearProps:'opacity,scale,rotate'},0);
  // Vague lumineuse sur les lettres du nom
  tl.to(chars,{keyframes:[{color:'#0071e3',duration:.25},{color:'#7c6cff',duration:.25},{color:getComputedStyle(heroTitle).color,duration:.5}],stagger:.06,ease:'none',clearProps:'color'},1.15);
 }
 // Changement de thème pendant la vague lumineuse du nom : on rend la main à la feuille de style.
 window.addEventListener('portfolio:theme',()=>{const chars=$$('.wow-char',heroTitle);gsap.killTweensOf(chars,'color');gsap.set(chars,{clearProps:'color'});});
 let firstShown=false;
 window.addEventListener('portfolio:page',e=>{
  const id=e.detail.id;progress.style.transform=`scaleX(${(routes.indexOf(id)+1)/routes.length})`;
  requestAnimationFrame(movePill);
  if(boot&&!boot.hidden)return; // l'introduction est encore affichée
  entrance(id,firstShown?.46:0);firstShown=true;
 });
 window.addEventListener('portfolio:ready',()=>{firstShown=true;const id=location.hash.slice(1)||'accueil';entrance(routes.includes(id)?id:'accueil',.05);});

 /* ---------- Pilule de navigation ---------- */
 const nav=$('#navigation'),pill=document.createElement('span');pill.className='wow-nav-pill';pill.setAttribute('aria-hidden','true');nav?.prepend(pill);
 let pillPlaced=false;
 function movePill(target){
  if(!nav)return;const links=$$('a[data-route]',nav);
  const horizontal=getComputedStyle(nav).display==='flex'&&links.length&&links.every(l=>Math.abs(l.offsetTop-links[0].offsetTop)<4);
  if(!horizontal){pill.classList.remove('is-visible');return;}
  const link=(target instanceof Element?target:null)||$('a.active',nav);if(!link){pill.classList.remove('is-visible');return;}
  const props={x:link.offsetLeft-10,width:link.offsetWidth+20};
  if(!pillPlaced){gsap.set(pill,props);pillPlaced=true;}else gsap.to(pill,{...props,duration:.6,ease:'expo.out'});
  pill.classList.add('is-visible');
 }
 if(nav){$$('a[data-route]',nav).forEach(a=>a.addEventListener('pointerenter',()=>movePill(a)));nav.addEventListener('pointerleave',()=>movePill());}
 window.addEventListener('resize',()=>{pillPlaced=false;movePill();});
 document.fonts?.ready.then(()=>{pillPlaced=false;movePill();});

 /* ---------- Interactions souris (désactivées au tactile) ---------- */
 if(!finePointer)return;
 // Grille de points qui suit la souris
 let gridFrame=0,gx=0,gy=0;
 window.addEventListener('pointermove',e=>{
  gx=e.clientX;gy=e.clientY;
  if(!gridFrame)gridFrame=requestAnimationFrame(()=>{grid.style.setProperty('--cx',gx+'px');grid.style.setProperty('--cy',gy+'px');gridFrame=0;});
 },{passive:true});

 // Cartes en relief 3D avec reflet
 function tilt(card,max=7){
  if(card.dataset.wowTilt)return;card.dataset.wowTilt='1';card.classList.add('wow-tilt');
  const glare=document.createElement('span');glare.className='wow-glare';glare.setAttribute('aria-hidden','true');card.append(glare);
  gsap.set(card,{transformPerspective:900});
  const rotX=gsap.quickTo(card,'rotationX',{duration:.6,ease:'power3'}),rotY=gsap.quickTo(card,'rotationY',{duration:.6,ease:'power3'});
  card.addEventListener('pointermove',e=>{if(isReduced())return;const b=card.getBoundingClientRect(),px=(e.clientX-b.left)/b.width,py=(e.clientY-b.top)/b.height;
   rotY((px-.5)*max*2);rotX((.5-py)*max*2);card.style.setProperty('--gx',px*100+'%');card.style.setProperty('--gy',py*100+'%');});
  card.addEventListener('pointerleave',()=>{rotX(0);rotY(0);});
 }
 $$('.mission,.bilan-grid article,.company-metrics>div').forEach(c=>tilt(c,7));
 $$('.project-row').forEach(c=>tilt(c,4));
 new MutationObserver(()=>$$('.project-row').forEach(c=>tilt(c,4))).observe($('#project-list')||document.body,{childList:true});

 // Boutons magnétiques
 function magnet(el,strength=.3){
  if(el.dataset.wowMagnet)return;el.dataset.wowMagnet='1';el.classList.add('wow-magnet');
  const mx=gsap.quickTo(el,'x',{duration:.5,ease:'power3'}),my=gsap.quickTo(el,'y',{duration:.5,ease:'power3'});
  el.addEventListener('pointermove',e=>{if(isReduced())return;const b=el.getBoundingClientRect();mx((e.clientX-b.left-b.width/2)*strength);my((e.clientY-b.top-b.height/2)*strength);});
  el.addEventListener('pointerleave',()=>{gsap.to(el,{x:0,y:0,duration:.9,ease:'elastic.out(1,.4)'});});
 }
 $$('.button,.brand,#previous-page,#next-page,.contact-links a,.travel-stops button,.filters button,#replay-intro').forEach(el=>magnet(el,el.classList.contains('button')?.28:.22));

 // Parallaxe du globe et du contenu du héros
 // Retour à plat dès que les animations sont réduites.
 window.addEventListener('portfolio:motion',()=>{if(!isReduced())return;gsap.killTweensOf('.wow-tilt,.wow-magnet,#globe-scene,.hero-content');gsap.set('.wow-tilt',{rotationX:0,rotationY:0});gsap.set('.wow-magnet,#globe-scene,.hero-content',{clearProps:'transform'});});
 const hero=$('#accueil'),globe=$('#globe-scene'),heroContent=$('.hero-content');
 if(hero&&globe){
  const gX=gsap.quickTo(globe,'x',{duration:1.2,ease:'power3'}),gY=gsap.quickTo(globe,'y',{duration:1.2,ease:'power3'});
  const cX=gsap.quickTo(heroContent,'x',{duration:1.2,ease:'power3'}),cY=gsap.quickTo(heroContent,'y',{duration:1.2,ease:'power3'});
  hero.addEventListener('pointermove',e=>{if(isReduced())return;const px=e.clientX/innerWidth-.5,py=e.clientY/innerHeight-.5;gX(px*-34);gY(py*-24);cX(px*10);cY(py*8);});
  hero.addEventListener('pointerleave',()=>{gX(0);gY(0);cX(0);cY(0);});
 }
})();
