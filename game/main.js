import {setChapter, silenceEffects, playEvents} from './audio.js';
import moonArt from './c2-art.json';
import fireflyArt from './c1-art.json';
import islandArt from './b2-art.json';
import rainArt from './b1-art.json';
import reedArt from './a2-art.json';
import QRCode from 'qrcode';
import {code,decode} from './save.js';
const $ = id => document.getElementById(id);
const play = $('play'), dialog = document.querySelector('dialog');
const key = 'capybara.crossing.v1';
const art = name => import.meta.env.BASE_URL+'art/'+name+'.webp';
let checkpoint=0, slot=0, variant, crossing, phase='home', action, incoming;
let historyBySlot=new Map(), revision=0;
try {checkpoint=decode(localStorage.getItem(key)) ?? 0;} catch { $('notice').textContent='O armazenamento local está indisponível. Guarde o código.'; }
function commit(n) {
  checkpoint=n;
  try {localStorage.setItem(key,code(n)); $('notice').textContent='Progresso salvo neste aparelho.';}
  catch { $('notice').textContent='Não foi possível salvar neste aparelho. Guarde o código.'; }
  progress();
}
function progress() {
  $('count').textContent=checkpoint+' de 48 travessias concluídas';
  $('meter').value=checkpoint;
  $('code').textContent=code(checkpoint);
  const url=new URL(location.pathname,location.origin);
  url.hash='save='+code(checkpoint);
  QRCode.toCanvas($('qr'),url.href,{width:172,margin:4}).catch(()=>{$('notice').textContent='QR indisponível. Use o código.';});
}
function button(label,fn,parent=play) {
  const el=document.createElement('button'); el.textContent=label; el.onclick=fn; parent.append(el); return el;
}
function scene(landed=false) {
  const box=document.createElement('div'); box.className='scene'; box.setAttribute('role','img');
  box.setAttribute('aria-label',landed?'Nina chegou ao piquenique.':'Nina espera perto da ponte com sua bolsa.');
  function sprite(name,cls){const img=new Image();img.alt='';img.className=cls;img.src=art(name);box.append(img);}
  sprite(landed?'nina':'nina-standing',landed?'landed':'nina');
  if(!landed) sprite('bag-'+(variant?.overlay.food || 'closed'),'bag');
  play.append(box);
}
const names=['Nina','Beto','Lia','Tico','Sol','Duda','Caju','Pip',"Iara","Maré","Jubi","Bia","Noé","Luma","Tuca","Zizi","Mina","Lelé","Rui","Neco","Pati","Dani","Tami","Nilo","Sabi","a capivara de chapéu amarelo","Cora","Nani","Bento","Lua","Vivi","Teo","Yara","Miro","Avi","Ivo","Rosa","Bela","Léo","Nara","Téo","Pipa","Iris","Malu","Pipa","Bento","Sol","Fafá"];
const titles=['Um lugar no piquenique','Três pedras, uma entrega','A cesta na jangada','A pequena onda','O caminho pela margem','Capacete e patins','Abrigo da chuva','O último lugar',"Um barco vermelho hoje","O sino no cais","O tapete azul","Uma corda entre os juncos","O caminho mais curto","Uma ajudinha do vento","O lado seco da ponte","Lanternas nas duas pontas","A primeira marca da chuva","O abrigo de folha","A pedra que sumiu","Quando a corda fica esticada","O caminho seco mais longo","Espere pela bandeira","Um mapa de antes da chuva","A cesta entre os juncos","As duas luzes","O voo para o encontro","O cachecol, não a bandana","A balsa que ainda não chegou","De quem é o remo?","Duas luzes, uma lanterna","As etiquetas foram trocadas","A passagem protegida","A ponte que não estava aberta","Sem marolas perto do ninho","Um aviso corrigido","O laço de duas voltas","Um espacinho, por favor","Um lugar para os cestos","A lanterna virada","Silêncio perto do ninho","Um convite sem obrigação","A canoa de quem chegou cedo","O cais sob o salgueiro","Boas-vindas para todos","O passeio da boia luminosa","O trenó arco-íris","A balsa que faz quá","Fafá e a pequena frota"];
function chapterNumber(n) {
  if(n <= 8)return {id:'A1',number:n};
  if(n <= 16)return {id:'A2',number:n-8};
  if(n <= 26)return {id:'B1',number:n-16};
  if(n <= 36)return {id:'B2',number:n-26};
  if(n<=44)return {id:'C1',number:n-36};
  return {id:'C2',number:n-44};
}
function arrival(n) {
  if(n===26)return 'A capivara de chapéu amarelo chegou ao lago da chuva!';
  const destination=n<=8?'ao piquenique':n<=16?'à margem dos juncos':n<=26?'ao lago da chuva':n<=36?'à ilha':n<=44?'à curva dos vaga-lumes':'às águas ao luar';
  return names[n-1]+' chegou '+destination+'!';
}
function illustratedScene(n,landed,activity) {
  const chapter=chapterNumber(n),directory=chapter.id.toLowerCase()+'/';
  const manifest={A2:reedArt,B1:rainArt,B2:islandArt,C1:fireflyArt,C2:moonArt}[chapter.id];
  const coreId=chapter.id+'-'+String(chapter.number).padStart(2,'0')+'.s1.v01';
  const pair=manifest[activity && !landed ? variant.id : coreId];
  const image=new Image();image.className='next';
  image.src=art(directory+(landed?'landed-'+chapter.number:pair[0]));
  image.alt=landed?arrival(n):titles[n-1];play.append(image);
  if(activity && !landed){
    const clue=new Image();clue.className='chapter-evidence';clue.src=art(directory+pair[1]);clue.alt='';
    play.append(clue);
  }
}
function chapterScene(n,stage,landed,activity) {
  const image=new Image();image.className='next';image.src=art(landed?'a1-'+n+'-landed':'a1-'+n+'-'+stage+'-whole');
  image.alt=landed?names[n-1]+' chegou ao piquenique.':titles[n-1];play.append(image);
  if(activity && !landed){
    const detail=new Image();detail.className='chapter-evidence';detail.src=art('a1-'+n+'-'+stage+'-detail');
    detail.alt='';play.append(detail);
  }
}
function home() {
  setChapter(chapterNumber(Math.min(checkpoint+1,48)).id);
  revision++; phase='home'; variant=null; play.replaceChildren();
  const title=document.createElement('h1');play.append(title);
  if(checkpoint===0){
    title.textContent='Um lugar no piquenique';scene();button('Jogar',()=>start(0));return;
  }
  if(checkpoint<names.length){
    const next=checkpoint+1;
    const chapter=chapterNumber(next);
    title.textContent=chapter.id+'-'+String(chapter.number).padStart(2,'0')+' · '+titles[checkpoint];
    if(next===2)betoScene(false);
    else if(next===3)liaScene(false);
    else if(next<=8)chapterScene(next,0,false,false);
    else illustratedScene(next,false,false);
    button('Jogar com '+names[checkpoint],()=>start(checkpoint));
  }else{
    title.textContent='Águas ao luar · Campanha concluída';
    illustratedScene(48,true,false);
    const groups=['Primeiros passos','Entre os juncos','O lago da chuva','A ilha','A curva dos vaga-lumes','Águas ao luar'];
    const viewer=document.createElement('section');viewer.className='finale-viewer';
    const heading=document.createElement('h2');heading.textContent='Ver os encontros de perto';viewer.append(heading);
    const photo=new Image();photo.className='next';photo.hidden=true;
    const caption=document.createElement('p');caption.setAttribute('role','status');
    groups.forEach((name,i)=>button(name,()=>{
      photo.src=art('c2/group-'+(i+1));photo.alt=name;photo.hidden=false;
      caption.textContent=name+' · '+[9,8,10,10,8,4][i]+' capivaras';
    },viewer));
    viewer.append(photo,caption);play.append(viewer);
  }
  const replays=document.createElement('details'),summary=document.createElement('summary');
  summary.textContent='Rejogar uma travessia';replays.append(summary);play.append(replays);
  names.slice(0,checkpoint).forEach((name,i)=>{
    const chapter=chapterNumber(i+1);
    button('Rejogar com '+name+' · '+chapter.id+'-'+String(chapter.number).padStart(2,'0'),()=>start(i),replays);
  });
}
function betoScene(landed) {
  const box=document.createElement('div');box.className='beto-board';
  const img=new Image();img.className='next';img.src=art(landed?'beto-landed':'scene');
  img.alt=landed?'Beto e Nina estão no piquenique.':'Beto espera com uma flor. Três pedras levam até Nina.';
  box.append(img);play.append(box);
  if(phase!=='play'||landed)return;
  const markers=slot>0||variant.id.endsWith('s1.v06');
  if(markers){
    for(const [i,[x,y]] of [[36,71],[51,62],[65,54]].entries()){
      const m=document.createElement('span');m.className='marker';m.style.left=x+'%';m.style.top=y+'%';m.textContent=i+1;box.append(m);
    }
  }
  const plan=document.createElement('p');plan.className='plan';plan.lang='en';
  const views={crossing:'Beto → ① → ② → ③ → Nina',surface:'Paw print ↓ ①',destination:'① → ② → ③ → ⚑ Nina',origin:'⚑ START · Beto → ① → ② → ③',height:'① ⤴ ② ⤴ ③ · Water below',banks:'Bank | ① · ② · ③ | Bank',direction:'Beto → → → Nina',row:'① ─── ② ─── ③'};
  plan.textContent=slot===0?(markers?'1 stone · 2 stone · 3 stone':'stones'):slot===1?'Beto → ① → ② → ③ → Nina':views[variant.overlay.routeFocus];play.append(plan);
}
function liaScene(landed) {
  const active=phase==='play';
  const picture=new Image();
  picture.src=art(landed?'lia-landed':active && slot===2?'lia-aboard':'lia-shore');
  picture.className='next';picture.alt=landed?'Lia chegou com sua cesta.':active && slot===2?'Lia e a cesta estão na jangada.':'Lia espera com a cesta na margem.';
  play.append(picture);
  if(active && slot<2){
    const detail=new Image();detail.src=art(slot===0?'loaded-basket':'loading-plan');
    detail.className='lia-detail';detail.alt=slot===0?'Duas goiabas dentro da cesta.':'Plano de colocação da cesta na jangada.';
    play.append(detail);
    if(slot===0){const label=document.createElement('p');label.lang='en';label.className='plan';label.textContent='guava · guava';play.append(label);}
  }
}
function crossingScene(landed=false) {
  if(crossing.ordinal<=3)[scene,betoScene,liaScene][crossing.ordinal-1](landed);
  else if(crossing.ordinal<=8)chapterScene(crossing.ordinal,slot,landed,true);
  else illustratedScene(crossing.ordinal,landed,true);
}
async function start(index) {
  const token=++revision;
  const loaders={A1:()=>import('../release/A1.json'),A2:()=>import('../release/A2.json'),B1:()=>import('../release/B1.json'),B2:()=>import('../release/B2.json'),C1:()=>import('../release/C1.json'),C2:()=>import('../release/C2.json')};
  const position=chapterNumber(index+1);
  silenceEffects();
  setChapter(position.id,true);
  const pack=await loaders[position.id]();
  const chapter=pack.default.chapter;
  if(token!==revision)return;
  crossing=chapter.crossings[position.number-1];slot=0; phase='play'; draw();
}
function draw() {
  const pool=crossing.slots[slot].variants;
  const seen=historyBySlot.get(crossing.slots[slot].id) || [];
  let next=pool.find(v=>!seen.includes(v.id));
  if(!next){const last=seen.at(-1);seen.length=0;next=pool.find(v=>v.id!==last)||pool[0];}
  seen.push(next.id);historyBySlot.set(crossing.slots[slot].id,seen);variant=next;render();
}
function render() {
  play.innerHTML='<h1></h1><p>Etapa '+(slot+1)+' de 3</p>';play.querySelector('h1').textContent=crossing.titlePTBR;
  crossingScene();
  const activity=document.createElement('div');activity.lang='en';play.append(activity);
  const clue=document.createElement('p');clue.textContent=variant.clues[0].accessibleEN;activity.append(clue);
  const prompt=document.createElement('p');prompt.id='prompt';prompt.tabIndex=-1;prompt.textContent=variant.promptEN;activity.append(prompt);prompt.focus();
  for(const choice of variant.choices) button(choice.textEN,()=>{
    if(phase!=='play')return;
    if(!variant.acceptedChoiceIds.includes(choice.id)){
      playEvents('sfx.retry');
      feedback.textContent=variant.hintPTBR;alternate.hidden=crossing.slots[slot].variants.length<2;return;
    }
    if(slot<2){
      const event=crossing.id+'.s'+(slot+1)+'.cue';
      slot++;draw();playEvents(event);return;
    }
    phase='landed';play.replaceChildren();
    const title=document.createElement('h1');title.textContent=arrival(crossing.ordinal);play.append(title);
    crossingScene(true);
    if(checkpoint===crossing.ordinal-1){
      commit(crossing.ordinal);
      playEvents(crossing.id+'.quack',crossing.id+'.s3.cue');
    }
    button('Continuar',home).focus();
  },activity);
  const feedback=document.createElement('p');feedback.setAttribute('role','status');play.append(feedback);
  const alternate=button('Tentar outra versão',draw);alternate.hidden=true;
}
function ask(mode,n) {
  action=mode;incoming=n;$('error').textContent='';$('entry').value='';$('entry').hidden=mode!=='entry';
  $('question').textContent=mode==='reset'?'Apagar o progresso salvo e voltar ao início?':mode==='entry'?'Digite seu código':'Substituir seu progresso por '+n+' de 48 travessias?';
  if(!dialog.open)dialog.showModal();
  (mode==='entry'?$('entry'):dialog.querySelector('button')).focus();
}
$('confirm').onclick=()=>{
  if(action==='entry'){const n=decode($('entry').value);if(n===null){$('error').textContent='Confira os números do código.';return;}ask('apply',n);return;}
  silenceEffects();commit(action==='reset'?0:incoming);historyBySlot.clear();dialog.close();home();
};
$('entry').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('confirm').click();}};
$('reset').onclick=()=>ask('reset');$('restore').onclick=()=>ask('entry');
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(code(checkpoint));$('notice').textContent='Código copiado.';}catch{$('notice').textContent='Selecione e copie o código na tela.';}};
window.addEventListener('storage',e=>{if(e.key!==key && e.key!==null)return;silenceEffects();checkpoint=decode(localStorage.getItem(key))??0;dialog.close();historyBySlot.clear();progress();home();});
progress();home();
if(location.hash.startsWith('#save=')){
  const n=decode(location.hash.slice(6));window.history.replaceState(null,'',location.pathname+location.search);
  if(n===null)$('notice').textContent='Código inválido. Confira o código da sua tela.';else ask('apply',n);
}

