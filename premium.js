'use strict';
(() => {
 const animated=()=>!paused;
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
 window.addEventListener('portfolio:page',e=>{if(e.detail.id==='competences')enrichSkill();});
})();

