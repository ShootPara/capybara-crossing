import sheet from '../production/AUDIO-CUE-SHEET.json' with {type: 'json'};

const cues = new Map(sheet.events.map(event => [event.id, event.productionCue]));
const audioBase = (import.meta.env?.BASE_URL ?? '/') + 'audio/';
const url = id => audioBase + id + '.mp3';
const duckGain = 0.32;
const attackMs = 50;
const releaseMs = 300;

let music = new Audio();
const effect = new Audio();
const normalVolume = music.volume;
music.loop = true;

let musicToggle;
let effectsToggle;
let active = false;
let chapter = 'A1';
let currentLoop;
let sequence = 0;
let ducked = false;

let context;
let source;
let gainNode;
let resuming = false;
let nativeOnly = false;
let volumeFrame;
let ramp = {from: 1, to: 1, start: 0, end: 0};

function mixTime() {
  return gainNode ? context.currentTime * 1000 : performance.now();
}

function levelAt(time) {
  if (time >= ramp.end) return ramp.to;
  const progress = Math.max(0, time - ramp.start) / (ramp.end - ramp.start);
  return ramp.from + (ramp.to - ramp.from) * progress;
}

function updateVolume() {
  const time = performance.now();
  music.volume = normalVolume * levelAt(time);
  volumeFrame = time < ramp.end ? requestAnimationFrame(updateVolume) : undefined;
}

function applyMix(from, duration, start = mixTime()) {
  const to = ducked ? duckGain : 1;
  ramp = {from, to, start, end: start + (from === to ? 0 : duration)};
  if (gainNode) {
    const {gain} = gainNode;
    gain.cancelScheduledValues(start / 1000);
    gain.setValueAtTime(ramp.start === ramp.end ? to : from, start / 1000);
    if (ramp.end > start) gain.linearRampToValueAtTime(to, ramp.end / 1000);
  } else {
    if (volumeFrame !== undefined) cancelAnimationFrame(volumeFrame);
    updateVolume();
  }
}

function setDucked(value) {
  if (ducked === value) return;
  ducked = value;
  const time = mixTime();
  applyMix(levelAt(time), ducked ? attackMs : releaseMs, time);
}

function useNativeVolume() {
  const time = mixTime();
  const from = levelAt(time);
  const remaining = Math.max(0, ramp.end - time);
  nativeOnly = true;
  let wasPlaying = false;
  if (source) {
    // A routed element cannot return to native output. Retire it before resuming its replacement.
    const previous = music;
    const playhead = previous.currentTime;
    wasPlaying = !previous.paused;
    previous.pause();
    music = previous.cloneNode(false);
    previous.removeAttribute('src');
    previous.load();
    music.currentTime = playhead;
    music.muted = previous.muted;
  }
  if (context && context.state !== 'closed') context.close().catch(() => {});
  source = gainNode = context = undefined;
  applyMix(from, remaining);
  if (wasPlaying) updateLoop();
}

function connectMusic() {
  if (gainNode) return;
  const time = mixTime();
  const from = levelAt(time);
  const remaining = Math.max(0, ramp.end - time);
  const gain = context.createGain();
  gain.gain.value = from;
  gain.connect(context.destination);
  music.volume = normalVolume;
  source = context.createMediaElementSource(music);
  source.connect(gain);
  if (volumeFrame !== undefined) cancelAnimationFrame(volumeFrame);
  volumeFrame = undefined;
  gainNode = gain;
  applyMix(from, remaining);
}

function resumeMix() {
  if (!musicToggle.checked || nativeOnly || resuming) return;
  const AudioContext = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!AudioContext) return;
  try {
    context ??= new AudioContext();
    if (context.state === 'running') {
      connectMusic();
    } else {
      resuming = true;
      // Keep native output usable until the context is actually running.
      context.resume().then(() => {
        resuming = false;
        if (context.state === 'running') connectMusic();
      }).catch(useNativeVolume);
    }
  } catch {
    useNativeVolume();
  }
}

function updateLoop() {
  music.muted = !musicToggle.checked;
  if (!active || music.muted) {
    music.pause();
    return;
  }
  if (currentLoop !== chapter) {
    currentLoop = chapter;
    music.src = url('music.' + chapter.toLowerCase());
  }
  if (music.paused) music.play()?.catch(() => {});
}

function stopEffect() {
  sequence++;
  effect.onended = effect.onerror = effect.onpause = effect.onplaying = null;
  effect.pause();
  setDucked(false);
}

export function initAudio() {
  if (musicToggle) return;
  musicToggle = document.getElementById('music-toggle');
  effectsToggle = document.getElementById('effects-toggle');
  musicToggle.onchange = () => {
    active = true;
    resumeMix();
    updateLoop();
  };
  effectsToggle.onchange = () => {
    if (!effectsToggle.checked) stopEffect();
  };
}

export function setChapter(id, activate = false) {
  chapter = id;
  active ||= activate;
  if (activate) resumeMix();
  updateLoop();
}

export function silenceEffects() {
  stopEffect();
}

export function playEvents(...ids) {
  stopEffect();
  if (!active || !effectsToggle.checked) return;
  resumeMix();
  const sounds = ids.map(id => cues.get(id) || (id === 'sfx.retry' ? id : null)).filter(Boolean);
  const token = sequence;
  let index = 0;
  function next() {
    const sound = sounds[index++];
    if (!sound) {
      stopEffect();
      return;
    }
    const ownsCue = () => token === sequence && effect.onended === ended;
    const started = () => {
      if (ownsCue() && effectsToggle.checked && !effect.paused) setDucked(true);
    };
    const failed = () => {
      if (ownsCue()) stopEffect();
    };
    const ended = () => {
      if (ownsCue() && effect.ended) next();
    };
    effect.src = url(sound);
    effect.onended = ended;
    effect.onerror = () => { if (effect.error) failed(); };
    effect.onpause = () => { if (effect.paused && !effect.ended) failed(); };
    try {
      const playback = effect.play();
      if (playback) playback.then(started, failed);
      else effect.onplaying = started;
    } catch {
      failed();
    }
  }
  if (sounds.length) next();
}
