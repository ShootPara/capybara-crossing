import {initAudio, setChapter, silenceEffects, playEvents} from './audio.js';
import {createAlbum} from './album.js';
import {CAPYBARA_NAMES as names} from './roster.js';
import {titleMarkup, utilityMarkup} from './title.js';
import moonArt from './c2-art.json';
import fireflyArt from './c1-art.json';
import islandArt from './b2-art.json';
import rainArt from './b1-art.json';
import reedArt from './a2-art.json';
import QRCode from 'qrcode';
import {code,decode} from './save.js';
const $ = id => document.getElementById(id);
const play = $('play'), dialog = $('restore-dialog'), albumDialog = $('album-dialog');
const titleView = $('title-view');
titleView.innerHTML = titleMarkup();
$('utility').innerHTML = utilityMarkup();
initAudio();
const album = createAlbum(albumDialog);
const key = 'capybara.crossing.v1';
const art = name => import.meta.env.BASE_URL+'art/'+name+'.webp';
const loadError = 'Não foi possível abrir esta travessia. Tente novamente.';
let checkpoint=0, slot=0, variant, crossing, phase='entry', action, incoming;
let historyBySlot=new Map(), revision=0, pendingStart=null;
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
  album.refresh(checkpoint);
}
function button(label,fn,parent=play) {
  const el=document.createElement('button'); el.type='button'; el.textContent=label; el.onclick=fn; parent.append(el); return el;
}
function primaryButton(label,fn,parent=play) {
  const control=button(label,fn,parent);
  control.className='primary';
  return control;
}
function scene(landed=false,parent=play) {
  const box=document.createElement('div'); box.className='scene'; box.setAttribute('role','img');
  box.setAttribute('aria-label',landed?'Nina chegou ao piquenique.':'Nina espera perto da ponte com sua bolsa.');
  function sprite(name,cls){const img=new Image();img.alt='';img.className=cls;img.src=art(name);box.append(img);}
  sprite(landed?'nina':'nina-standing',landed?'landed':'nina');
  if(!landed) sprite('bag-'+(variant?.overlay.food || 'closed'),'bag');
  parent.append(box);
}
const titles=['Um lugar no piquenique','Três pedras, uma entrega','A cesta na jangada','A pequena onda','O caminho pela margem','Capacete e patins','Abrigo da chuva','O último lugar',"Um barco vermelho hoje","O sino no cais","O tapete azul","Uma corda entre os juncos","O caminho mais curto","Uma ajudinha do vento","O lado seco da ponte","Lanternas nas duas pontas","A primeira marca da chuva","O abrigo de folha","A pedra que sumiu","Quando a corda fica esticada","O caminho seco mais longo","Espere pela bandeira","Um mapa de antes da chuva","A cesta entre os juncos","As duas luzes","O voo para o encontro","O cachecol, não a bandana","A balsa que ainda não chegou","De quem é o remo?","Duas luzes, uma lanterna","As etiquetas foram trocadas","A passagem protegida","A ponte que não estava aberta","Sem marolas perto do ninho","Um aviso corrigido","O laço de duas voltas","Um espacinho, por favor","Um lugar para os cestos","A lanterna virada","Silêncio perto do ninho","Um convite sem obrigação","A canoa de quem chegou cedo","O cais sob o salgueiro","Boas-vindas para todos","O passeio da boia luminosa","O trenó arco-íris","A balsa que faz quá","Fafá e a pequena frota"];
function chapterNumber(n) {
  if(n <= 8)return {id:'A1',number:n};
  if(n <= 16)return {id:'A2',number:n-8};
  if(n <= 26)return {id:'B1',number:n-16};
  if(n <= 36)return {id:'B2',number:n-26};
  if(n<=44)return {id:'C1',number:n-36};
  return {id:'C2',number:n-44};
}
function crossingCode(ordinal) {
  const chapter=chapterNumber(ordinal);
  return chapter.id+'-'+String(chapter.number).padStart(2,'0');
}
function arrival(n) {
  if(n===26)return 'A capivara de chapéu amarelo chegou ao lago da chuva!';
  const destination=n<=8?'ao piquenique':n<=16?'à margem dos juncos':n<=26?'ao lago da chuva':n<=36?'à ilha':n<=44?'à curva dos vaga-lumes':'às águas ao luar';
  return names[n-1]+' chegou '+destination+'!';
}
function illustratedScene(n,landed,activity,parent=play) {
  const chapter=chapterNumber(n),directory=chapter.id.toLowerCase()+'/';
  const manifest={A2:reedArt,B1:rainArt,B2:islandArt,C1:fireflyArt,C2:moonArt}[chapter.id];
  const coreId=chapter.id+'-'+String(chapter.number).padStart(2,'0')+'.s1.v01';
  const pair=manifest[activity && !landed ? variant.id : coreId];
  const image=new Image();image.className='next';
  image.src=art(directory+(landed?'landed-'+chapter.number:pair[0]));
  image.alt=landed?arrival(n):titles[n-1];parent.append(image);
  if(activity && !landed){
    const clue=new Image();clue.className='chapter-evidence';clue.src=art(directory+pair[1]);clue.alt='';
    parent.append(clue);
  }
}
function chapterScene(n,stage,landed,activity,parent=play) {
  const image=new Image();image.className='next';image.src=art(landed?'a1-'+n+'-landed':'a1-'+n+'-'+stage+'-whole');
  image.alt=landed?names[n-1]+' chegou ao piquenique.':titles[n-1];parent.append(image);
  if(activity && !landed){
    const detail=new Image();detail.className='chapter-evidence';detail.src=art('a1-'+n+'-'+stage+'-detail');
    detail.alt='';parent.append(detail);
  }
}
function showView(entry) {
  titleView.hidden=!entry;
  $('game-header').hidden=entry;
  $('restore').hidden=entry;
  play.hidden=entry;
}
function addReplays(parent) {
  if(!checkpoint)return;
  const replays=document.createElement('details'),summary=document.createElement('summary');
  const choices=document.createElement('div');choices.className='replay-choices';
  summary.textContent='Rejogar uma travessia';replays.append(summary,choices);parent.append(replays);
  names.slice(0,checkpoint).forEach((name,i)=>{
    button('Rejogar com '+name+' · '+crossingCode(i+1),()=>start(i),choices);
  });
}
function entry() {
  setChapter(chapterNumber(Math.min(checkpoint+1,48)).id);
  phase='entry';
  showView(true);
  const primary=$('title-play'), status=$('title-progress');
  primary.textContent=checkpoint===0?'Jogar':checkpoint===48?'Ver o lago':'Continuar';
  status.textContent=checkpoint>0 && checkpoint<48?crossingCode(checkpoint+1)+' · '+titles[checkpoint]:'';
  status.hidden=!status.textContent;
  primary.onclick=()=>checkpoint===48?home():start(checkpoint);
  const replays=$('title-replay');replays.replaceChildren();addReplays(replays);
}
function home() {
  setChapter(chapterNumber(Math.min(checkpoint+1,48)).id);
  revision++; pendingStart=null; phase='home'; variant=null; play.replaceChildren();
  showView(false);
  const title=document.createElement('h1');title.tabIndex=-1;play.append(title);
  if(checkpoint===0){
    title.textContent=titles[0];scene();primaryButton('Jogar',()=>start(0));
  }else if(checkpoint<names.length){
    const next=checkpoint+1;
    title.textContent=crossingCode(next)+' · '+titles[checkpoint];
    if(next===2)betoScene(false);
    else if(next===3)liaScene(false);
    else if(next<=8)chapterScene(next,0,false,false);
    else illustratedScene(next,false,false);
    primaryButton('Jogar com '+names[checkpoint],()=>start(checkpoint));
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
  addReplays(play);
  title.focus();
}
function betoScene(landed,parent=play) {
  const box=document.createElement('div');box.className='beto-board';
  const img=new Image();img.className='next';img.src=art(landed?'beto-landed':'scene');
  img.alt=landed?'Beto e Nina estão no piquenique.':'Beto espera com uma flor. Três pedras levam até Nina.';
  box.append(img);parent.append(box);
  if(phase!=='play'||landed)return;
  const markers=slot>0||variant.id.endsWith('s1.v06');
  if(markers){
    for(const [i,[x,y]] of [[36,71],[51,62],[65,54]].entries()){
      const m=document.createElement('span');m.className='marker';m.style.left=x+'%';m.style.top=y+'%';m.textContent=i+1;box.append(m);
    }
  }
  const plan=document.createElement('p');plan.className='plan';plan.lang='en';
  const views={crossing:'Beto → ① → ② → ③ → Nina',surface:'Paw print ↓ ①',destination:'① → ② → ③ → ⚑ Nina',origin:'⚑ START · Beto → ① → ② → ③',height:'① ⤴ ② ⤴ ③ · Water below',banks:'Bank | ① · ② · ③ | Bank',direction:'Beto → → → Nina',row:'① ─── ② ─── ③'};
  plan.textContent=slot===0?(markers?'1 stone · 2 stone · 3 stone':'stones'):slot===1?'Beto → ① → ② → ③ → Nina':views[variant.overlay.routeFocus];parent.append(plan);
}
function liaScene(landed,parent=play) {
  const active=phase==='play';
  const picture=new Image();
  picture.src=art(landed?'lia-landed':active && slot===2?'lia-aboard':'lia-shore');
  picture.className='next';picture.alt=landed?'Lia chegou com sua cesta.':active && slot===2?'Lia e a cesta estão na jangada.':'Lia espera com a cesta na margem.';
  parent.append(picture);
  if(active && slot<2){
    const detail=new Image();detail.src=art(slot===0?'loaded-basket':'loading-plan');
    detail.className='lia-detail';detail.alt=slot===0?'Duas goiabas dentro da cesta.':'Plano de colocação da cesta na jangada.';
    parent.append(detail);
    if(slot===0){const label=document.createElement('p');label.lang='en';label.className='plan';label.textContent='guava · guava';parent.append(label);}
  }
}
function crossingScene(landed=false,parent=play) {
  if(crossing.ordinal<=3)[scene,betoScene,liaScene][crossing.ordinal-1](landed,parent);
  else if(crossing.ordinal<=8)chapterScene(crossing.ordinal,slot,landed,true,parent);
  else illustratedScene(crossing.ordinal,landed,true,parent);
}
async function start(index) {
  if(pendingStart!==null)return;
  const token=++revision;
  pendingStart=token;
  const loaders={A1:()=>import('../release/A1.json'),A2:()=>import('../release/A2.json'),B1:()=>import('../release/B1.json'),B2:()=>import('../release/B2.json'),C1:()=>import('../release/C1.json'),C2:()=>import('../release/C2.json')};
  const position=chapterNumber(index+1);
  silenceEffects();
  setChapter(position.id,true);
  try {
    const pack=await loaders[position.id]();
    if(token!==revision)return;
    crossing=pack.default.chapter.crossings[position.number-1];slot=0;phase='play';
    showView(false);
    draw();
    if($('notice').textContent===loadError)$('notice').textContent='';
  } catch {
    if(token===revision)$('notice').textContent=loadError;
  } finally {
    if(pendingStart===token)pendingStart=null;
  }
}
function draw() {
  const pool=crossing.slots[slot].variants;
  const seen=historyBySlot.get(crossing.slots[slot].id) || [];
  let next=pool.find(v=>!seen.includes(v.id));
  if(!next){const last=seen.at(-1);seen.length=0;next=pool.find(v=>v.id!==last)||pool[0];}
  seen.push(next.id);historyBySlot.set(crossing.slots[slot].id,seen);variant=next;render();
}
function render() {
  play.innerHTML='<h1></h1><p class="step"></p><div class="question-layout"><div class="evidence"></div><div class="activity"><div class="answers" lang="en"></div></div></div>';
  play.querySelector('h1').textContent=crossing.titlePTBR;
  play.querySelector('.step').textContent=crossingCode(crossing.ordinal)+' · Etapa '+(slot+1)+' de 3';
  const evidence=play.querySelector('.evidence'), activity=play.querySelector('.activity');
  crossingScene(false,evidence);
  const shownVariant=variant;
  const clue=document.createElement('p');clue.lang='en';clue.textContent=shownVariant.clues[0].accessibleEN;evidence.append(clue);
  const prompt=document.createElement('p');prompt.id='prompt';prompt.lang='en';prompt.tabIndex=-1;prompt.textContent=shownVariant.promptEN;
  activity.prepend(prompt);
  if(!albumDialog.open && !dialog.open)prompt.focus();
  const answers=activity.querySelector('.answers');
  for(const choice of shownVariant.choices) button(choice.textEN,()=>{
    if(phase!=='play'||variant!==shownVariant||!answers.isConnected)return;
    if(!shownVariant.acceptedChoiceIds.includes(choice.id)){
      playEvents('sfx.retry');
      feedback.textContent=shownVariant.hintPTBR;alternate.hidden=crossing.slots[slot].variants.length<2;return;
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
    primaryButton('Continuar',home).focus();
  },answers);
  const feedback=document.createElement('p');feedback.className='feedback';feedback.setAttribute('role','status');activity.append(feedback);
  const alternate=button('Tentar outra versão',draw,activity);alternate.hidden=true;
}
function ask(mode,n,opener) {
  action=mode;incoming=n;$('error').textContent='';$('entry').value='';$('entry').hidden=mode!=='entry';
  $('question').textContent=mode==='reset'?'Apagar o progresso salvo e voltar ao início?':mode==='entry'?'Digite seu código':'Substituir seu progresso por '+n+' de 48 travessias?';
  if(!dialog.open){
    opener?.focus({preventScroll:true});
    dialog.showModal();
  }
  (mode==='entry'?$('entry'):dialog.querySelector('button[value=cancel]')).focus();
}
$('confirm').onclick=()=>{
  if(action==='entry'){const n=decode($('entry').value);if(n===null){$('error').textContent='Confira os números do código.';return;}ask('apply',n);return;}
  silenceEffects();commit(action==='reset'?0:incoming);historyBySlot.clear();dialog.close();home();
};
$('entry').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('confirm').click();}};
$('reset').onclick=e=>ask('reset',null,e.currentTarget);
$('restore').onclick=$('title-restore').onclick=e=>ask('entry',null,e.currentTarget);
dialog.addEventListener('close',()=>{
  const focused=document.activeElement;
  if(!dialog.open && !albumDialog.open && (focused===document.body || !focused?.getClientRects().length))$('prompt')?.focus();
});
$('open-album').onclick=e=>album.open(checkpoint,e.currentTarget);
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(code(checkpoint));$('notice').textContent='Código copiado.';}catch{$('notice').textContent='Selecione e copie o código na tela.';}};
window.addEventListener('storage',e=>{
  if(e.storageArea!==localStorage||(e.key!==key && e.key!==null))return;
  silenceEffects();
  checkpoint=decode(localStorage.getItem(key))??0;
  album.close();
  dialog.close();
  historyBySlot.clear();
  progress();
  home();
});
progress();entry();
if(location.hash.startsWith('#save=')){
  const n=decode(location.hash.slice(6));window.history.replaceState(null,'',location.pathname+location.search);
  if(n===null)$('notice').textContent='Código inválido. Confira o código da sua tela.';
  else ask('apply',n,$('title-play'));
}

