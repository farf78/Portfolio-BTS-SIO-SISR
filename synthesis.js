'use strict';
(() => {
 const dialog=document.getElementById('synthesis-dialog');
 const frame=document.getElementById('synthesis-pdf');
 document.getElementById('open-synthesis').addEventListener('click',()=>{
  if(!frame.getAttribute('src'))frame.src='tbsynth%C3%A8se.pdf?v=2027-2#view=Fit';
  dialog.showModal();
  if(dialog.requestFullscreen)dialog.requestFullscreen().catch(()=>{});
 });
 document.getElementById('close-synthesis').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{if(document.fullscreenElement===dialog)document.exitFullscreen().catch(()=>{});});
})();
