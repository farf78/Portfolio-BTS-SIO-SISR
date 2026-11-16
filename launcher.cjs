'use strict';
const {spawn}=require('node:child_process');
const http=require('node:http'),net=require('node:net'),crypto=require('node:crypto'),path=require('node:path');
const identity=crypto.createHash('sha256').update(__dirname.toLowerCase()).digest('hex').slice(0,16);
function health(port){return new Promise(resolve=>{const request=http.get(`http://127.0.0.1:${port}/__portfolio_health`,{timeout:800},response=>{let data='';response.on('data',chunk=>data+=chunk);response.on('end',()=>{try{resolve(JSON.parse(data).portfolio===identity);}catch{resolve(false);}});});request.on('timeout',()=>{request.destroy();resolve(false);});request.on('error',()=>resolve(false));});}
function free(port){return new Promise(resolve=>{const probe=net.createServer();probe.once('error',()=>resolve(false));probe.listen(port,'127.0.0.1',()=>probe.close(()=>resolve(true)));});}
(async()=>{
 let selected;
 for(let port=4174;port<4185;port++){
  if(await health(port)){selected=port;break;}
  if(await free(port)){
   const child=spawn(process.execPath,[path.join(__dirname,'server.cjs')],{cwd:__dirname,env:{...process.env,PORT:String(port)},windowsHide:true,detached:true,stdio:'ignore'});
   child.on('error',()=>{});child.unref();
   for(let attempt=0;attempt<20;attempt++){await new Promise(resolve=>setTimeout(resolve,200));if(await health(port)){selected=port;break;}}
   if(selected)break;
  }
 }
 if(!selected)throw new Error('Le serveur local ne peut pas démarrer. Vérifiez les autorisations réseau locales.');
 const url=`http://127.0.0.1:${selected}/#accueil`;
 console.log(`Portfolio prêt : ${url}`);
 if(!process.argv.includes('--no-open')){const child=spawn('powershell.exe',['-NoProfile','-Command',`Start-Process '${url}'`],{windowsHide:true,stdio:'ignore'});child.on('error',()=>console.log(`Ouvrez ${url} dans votre navigateur.`));}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
