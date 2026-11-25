import sheet from '../production/AUDIO-CUE-SHEET.json';

const cues = new Map(sheet.events.map(event => [event.id, event.productionCue]));
const music = new Audio();
const effect = new Audio();
music.loop = true;
let active = false;
let chapter = 'A1';
let currentLoop;
let sequence = 0;

const musicToggle = document.getElementById('music-toggle');
const effectsToggle = document.getElementById('effects-toggle');
const url = id => import.meta.env.BASE_URL + 'audio/' + id + '.mp3';

function updateLoop() {
  if (!active || !musicToggle.checked) { music.pause(); return; }
  if (currentLoop !== chapter) {
    currentLoop = chapter;
    music.src = url('music.' + chapter.toLowerCase());
  }
  if (music.paused) music.play().catch(() => {});
}
function stopEffect() {
  sequence++;
  effect.pause();
  effect.onended = null;
}
export function setChapter(id, activate = false) {
  chapter = id;
  active ||= activate;
  updateLoop();
}
export function silenceEffects() { stopEffect(); }
export function playEvents(...ids) {
  stopEffect();
  if (!active || !effectsToggle.checked) return;
  const token = sequence;
  const sounds = ids.map(id => cues.get(id) || (id === 'sfx.retry' ? id : null)).filter(Boolean);
  function next() {
    if (token !== sequence || !effectsToggle.checked) return;
    const sound = sounds.shift();
    if (!sound) return;
    effect.src = url(sound);
    effect.onended = next;
    effect.play().catch(() => {});
  }
  next();
}
musicToggle.onchange = () => { active = true; updateLoop(); };
effectsToggle.onchange = () => { if (!effectsToggle.checked) stopEffect(); };
