'use strict';
/* settings.js — bouton « Réglages » : thème sombre, réduction des animations, mode oral.
   Les deux premiers choix sont mémorisés sur ce navigateur ; le mode oral ne l'est pas. */
(() => {
 /* Ordre de passage en mode oral : identifiant d'une rubrique, ou 'projet:<id>' pour
    ouvrir la fiche d'un projet. Réorganiser cette liste suffit à changer le déroulé. */
 const ORAL_ORDER=['accueil','profil','entreprise','missions','projets','projet:glpi','projet:migration','projet:municipol','projet:gophish','competences','veille','bilan','contact','epreuve'];
 const PAGES=[['accueil','Accueil'],['profil','Profil'],['entreprise','Entreprise'],['missions','Missions'],['projets','Projets'],['competences','Compétences'],['veille','Veille technologique'],['bilan','Bilan'],['contact','Contact'],['epreuve','Tableau de synthèse']];

 const root=document.documentElement,$=id=>document.getElementById(id);
 const store={get(k){try{return localStorage.getItem(k);}catch{return null;}},set(k,v){try{localStorage.setItem(k,v);}catch{}}};
 const toggle=$('settings-toggle'),panel=$('settings-panel');
 const themeRow=$('setting-theme'),motionRow=$('setting-motion'),oralRow=$('setting-oral');
 if(!toggle||!panel)return;

 /* ---------- Panneau ---------- */
 function openPanel(open,refocus=false){
  panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));
  if(open&&typeof closeMenu==='function')closeMenu();
  if(!open&&refocus)toggle.focus({preventScroll:true});
 }
 toggle.addEventListener('click',()=>openPanel(panel.hidden));
 document.addEventListener('click',e=>{if(!panel.hidden&&!e.target.closest('#settings'))openPanel(false);});
 document.querySelector('.menu-toggle')?.addEventListener('click',()=>openPanel(false));

 /* ---------- Thème sombre ---------- */
 function setTheme(dark,save=true){
  if(dark)root.dataset.theme='dark';else delete root.dataset.theme;
  themeRow.setAttribute('aria-checked',String(dark));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#0b0e14':'#ffffff');
  if(save)store.set('fa-theme',dark?'dark':'light');
  window.dispatchEvent(new CustomEvent('portfolio:theme',{detail:{dark}}));
 }
 themeRow.addEventListener('click',()=>setTheme(root.dataset.theme!=='dark'));
 setTheme(root.dataset.theme==='dark',false);

 /* ---------- Réduire les animations ---------- */
 function setReduced(reduced,save=true){
  paused=reduced; // variable partagée déclarée dans app.js
  root.classList.toggle('reduce-motion',reduced);root.classList.toggle('motion-enabled',!reduced);
  motionRow.setAttribute('aria-checked',String(reduced));
  if(save)store.set('fa-motion',reduced?'reduced':'full');
  window.dispatchEvent(new CustomEvent('portfolio:motion',{detail:{reduced}}));
 }
 motionRow.addEventListener('click',()=>setReduced(!paused));
 setReduced(root.classList.contains('reduce-motion'),false);

 /* ---------- Mode oral ---------- */
 const bar=$('oral-bar'),stepEl=$('oral-step'),labelEl=$('oral-label'),timerEl=$('oral-timer');
 const projectDialog=$('project-dialog'),synthesisDialog=$('synthesis-dialog');
 const projectList=typeof projects!=='undefined'?projects:[];
 const steps=ORAL_ORDER.map(entry=>{
  if(entry.startsWith('projet:')){const p=projectList.find(p=>p.id===entry.slice(7));return p?{page:'projets',project:p.id,label:'Projet — '+p.title}:null;}
  const page=PAGES.find(p=>p[0]===entry);return page?{page:page[0],label:page[1]}:null;
 }).filter(Boolean);
 let oral=false,index=0,startedAt=0,ticker=0;
 const currentPage=()=>document.querySelector('#page-stage .route-page:not([hidden])')?.id||'accueil';
 const two=n=>String(n).padStart(2,'0');
 function renderBar(){stepEl.textContent=two(index+1)+' / '+two(steps.length);labelEl.textContent=steps[index].label;}
 function renderTimer(){const s=Math.floor((Date.now()-startedAt)/1000);timerEl.textContent=two(Math.floor(s/60))+':'+two(s%60);}
 function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());}
 function go(target){
  index=Math.max(0,Math.min(steps.length-1,target));const step=steps[index];
  closeDialogs();
  if(currentPage()!==step.page)location.hash='#'+step.page; // la navigation existante prend le relais
  if(step.project&&typeof openProject==='function')openProject(step.project);
  renderBar();
 }
 function enterOral(){
  if(oral)return;oral=true;openPanel(false);root.classList.add('oral-mode');bar.hidden=false;
  const here=steps.findIndex(s=>!s.project&&s.page===currentPage());index=here<0?0:here;renderBar();
  startedAt=Date.now();renderTimer();ticker=setInterval(renderTimer,1000);
  // Plein écran si le navigateur l'accepte ; Échap reste alors disponible pour le portfolio.
  root.requestFullscreen?.().then(()=>navigator.keyboard?.lock?.(['Escape']).catch(()=>{})).catch(()=>{});
  $(currentPage())?.focus({preventScroll:true});
 }
 function exitOral(){
  if(!oral)return;oral=false;root.classList.remove('oral-mode');bar.hidden=true;clearInterval(ticker);
  navigator.keyboard?.unlock?.();if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});
  toggle.focus({preventScroll:true});
 }
 oralRow.addEventListener('click',enterOral);
 $('oral-exit').addEventListener('click',exitOral);
 timerEl.addEventListener('click',()=>{startedAt=Date.now();renderTimer();});
 // Quitter le plein écran quitte le mode oral, sauf si Échap vient de fermer une fiche.
 document.addEventListener('fullscreenchange',()=>{
  if(!oral||document.fullscreenElement)return;
  if(document.querySelector('dialog[open]')){closeDialogs();return;}
  exitOral();
 });
 // Garder le repère à jour quand on navigue à la souris pendant l'oral.
 window.addEventListener('portfolio:page',e=>{if(!oral||steps[index].page===e.detail.id)return;const i=steps.findIndex(s=>!s.project&&s.page===e.detail.id);if(i>=0){index=i;renderBar();}});
 window.addEventListener('portfolio:project',e=>{if(!oral)return;const i=steps.findIndex(s=>s.project===e.detail.id);if(i>=0){index=i;renderBar();}});

 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!panel.hidden){openPanel(false,true);return;}
  if(!oral||e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey)return;
  const shell=$('experience-shell');if(shell?.inert)return; // introduction en cours
  if(e.target.closest?.('input,textarea,select,[contenteditable]'))return;
  const dialogOpen=!!document.querySelector('dialog[open]');
  let handled=true;
  switch(e.key){
   case 'ArrowRight':case 'PageDown':go(index+1);break;
   case 'ArrowLeft':case 'PageUp':go(index-1);break;
   case ' ':if(e.target.closest?.('button,a,summary')){handled=false;break;}go(index+(e.shiftKey?-1:1));break;
   case 'Home':go(0);break;
   case 'End':go(steps.length-1);break;
   case 'Escape':if(dialogOpen){handled=false;break;}exitOral();break; // une fiche ouverte se ferme d'abord
   default:
    if(/^[0-9]$/.test(e.key)){const page=PAGES[e.key==='0'?9:Number(e.key)-1];const i=steps.findIndex(s=>!s.project&&s.page===page[0]);if(i>=0)go(i);else handled=false;}
    else handled=false;
  }
  if(handled)e.preventDefault();
 });
})();
