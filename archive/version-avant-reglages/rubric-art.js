'use strict';
(() => {
 const blue='<circle class="rubric-pulse" cx="111" cy="69" r="3" fill="#0071e3" stroke="none"/>';
 const drawings={
 profil:'<g class="rubric-orbit"><ellipse cx="80" cy="50" rx="59" ry="29" transform="rotate(-20 80 50)"/><ellipse cx="80" cy="50" rx="45" ry="39" transform="rotate(20 80 50)" opacity=".4"/></g><rect x="53" y="24" width="54" height="54" rx="18" fill="url(#metal-profil)"/><text x="80" y="59" text-anchor="middle" fill="#485b72" stroke="none" font-size="25" font-weight="600" font-family="Arial,sans-serif">FA</text>'+blue,
 entreprise:'<path class="rubric-draw" d="M20 81h120M29 80V44h102v36M24 44h112L80 18 24 44M67 80V61h26v19M39 53h11v12H39zM110 53h11v12h-11zM57 49v22M103 49v22"/><path d="M80 18V7m0 0h14v8H80" stroke="#0071e3"/><circle cx="80" cy="37" r="5" fill="#e8eef5"/>'+blue,
 missions:'<path class="rubric-flow" d="M43 28h37v44h37M43 72h37V28h37" stroke="#0071e3"/><g fill="url(#metal-missions)"><rect x="18" y="14" width="38" height="28" rx="7"/><rect x="104" y="14" width="38" height="28" rx="7"/><rect x="18" y="58" width="38" height="28" rx="7"/><rect x="104" y="58" width="38" height="28" rx="7"/></g><path d="M29 24h16m-16 8h11M115 24h16m-16 8h11M29 68h16m-16 8h11M115 68h16m-16 8h11"/>'+blue,
 projets:'<g fill="url(#metal-projets)"><rect x="45" y="12" width="72" height="23" rx="7"/><rect x="45" y="39" width="72" height="23" rx="7"/><rect x="45" y="66" width="72" height="23" rx="7"/></g><path d="M57 23h23M57 50h23M57 77h23"/><g fill="#0071e3" stroke="none"><circle class="rubric-pulse" cx="104" cy="23" r="3"/><circle class="rubric-pulse delay-one" cx="104" cy="50" r="3"/><circle class="rubric-pulse delay-two" cx="104" cy="77" r="3"/></g>',
 competences:'<path class="rubric-flow" d="M13 25h24v12h20M13 75h24V63h20M147 25h-24v12h-20M147 75h-24V63h-20M68 5v23M92 5v23M68 95V72M92 95V72" stroke="#0071e3"/><rect x="53" y="25" width="54" height="50" rx="12" fill="url(#metal-competences)"/><rect x="66" y="38" width="28" height="24" rx="5"/><circle class="rubric-pulse" cx="80" cy="50" r="4" fill="#0071e3" stroke="none"/>',
 epreuve:'<g class="rubric-float" fill="url(#metal-epreuve)"><rect x="40" y="14" width="62" height="69" rx="8" transform="rotate(-12 71 48)"/><rect x="52" y="17" width="62" height="69" rx="8" transform="rotate(8 83 51)"/><rect x="48" y="20" width="62" height="69" rx="8"/></g><path d="M61 36h35M61 45h26M61 54h35"/><path class="rubric-draw" d="m69 70 7 6 14-15" stroke="#0071e3" stroke-width="2.5"/>',
 veille:'<circle cx="80" cy="50" r="39" fill="url(#metal-veille)"/><circle cx="80" cy="50" r="26"/><circle cx="80" cy="50" r="13"/><path d="M80 11v78M41 50h78" opacity=".4"/><g class="rubric-sweep"><path d="M80 50V11" stroke="#0071e3"/><path d="M80 50V11A39 39 0 0 1 107 22Z" fill="#0071e31a" stroke="none"/></g><circle class="rubric-pulse" cx="98" cy="32" r="3" fill="#0071e3" stroke="none"/>',
 bilan:'<path d="M22 84h116"/><g fill="url(#metal-bilan)"><rect x="30" y="63" width="30" height="21" rx="4"/><rect x="65" y="43" width="30" height="41" rx="4"/><rect x="100" y="23" width="30" height="61" rx="4"/></g><path class="rubric-draw" d="M29 48 77 21 113 9m-13-2 13 2-5 12" stroke="#0071e3"/><circle class="rubric-pulse" cx="115" cy="36" r="3" fill="#0071e3" stroke="none"/>',
 contact:'<g class="rubric-float"><rect x="28" y="28" width="104" height="59" rx="12" fill="url(#metal-contact)"/><path class="rubric-draw" d="m29 32 51 35 51-35M30 83l34-28m66 28L96 55"/><path d="m29 31 44-21q7-4 14 0l44 21" stroke="#0071e3"/></g><circle class="rubric-pulse" cx="80" cy="21" r="4" fill="#0071e3" stroke="none"/>'
 };
 Object.entries(drawings).forEach(([id,content])=>{
  const page=document.getElementById(id),heading=page?.querySelector('h2');if(!heading)return;
  const group=document.createElement('div');group.className='rubric-heading';heading.before(group);group.append(heading);
  const art=document.createElement('div');art.className='rubric-art';art.setAttribute('aria-hidden','true');
  art.innerHTML=`<svg viewBox="0 0 160 100" fill="none" stroke="#8c9caf" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" focusable="false"><defs><linearGradient id="metal-${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff"/><stop offset=".6" stop-color="#eaf0f6"/><stop offset="1" stop-color="#d3deea"/></linearGradient></defs>${content}</svg>`;group.append(art);
 });
 window.addEventListener('portfolio:page',event=>{
  document.querySelectorAll('.rubric-art').forEach(art=>art.classList.remove('rubric-active'));
  const art=document.querySelector('#'+event.detail.id+' .rubric-art');if(!art)return;
  art.classList.add('rubric-active');
  if(window.gsap){gsap.killTweensOf(art);gsap.fromTo(art,{opacity:0,y:7,scale:.96},{opacity:1,y:0,scale:1,duration:.8,delay:.12,ease:'power3.out',clearProps:'transform,opacity'});}
 });
})();
