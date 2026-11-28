import assert from 'node:assert/strict';
import test from 'node:test';

let testInstance = 0;

function deferred() {
  let resolve, reject;
  const promise = new Promise((good, bad) => { resolve = good; reject = bad; });
  return {promise, resolve, reject};
}

async function setup(t, {resume, failure, native = false} = {}) {
  let time = 0;
  let lastFrame = 0;
  const frames = new Map();
  const players = [];
  const contexts = [];
  const controls = {'music-toggle': {checked: true}, 'effects-toggle': {checked: true}};

  class FakeAudio {
    constructor() {
      this.paused = true;
      this.currentTime = 0;
      this.volume = 0.8;
      this.plays = [];
      players.push(this);
    }
    set src(value) {
      this.file = value;
      this.ended = false;
      this.error = null;
      this.currentTime = 0;
      this.paused = true;
    }
    get src() { return this.file; }
    play() {
      this.paused = false;
      this.plays.push(this.src);
      const result = this.playResult ?? Promise.resolve();
      this.playResult = undefined;
      return result;
    }
    pause() { this.paused = true; }
    end() {
      this.ended = true;
      this.paused = true;
      this.onpause?.();
      this.onended?.();
    }
    cloneNode() {
      const replacement = new FakeAudio();
      replacement.src = this.src;
      replacement.loop = this.loop;
      return replacement;
    }
    removeAttribute(name) { if (name === 'src') this.src = ''; }
    load() {}
  }

  class FakeContext {
    constructor() {
      this.state = resume ? 'suspended' : 'running';
      this.destination = {};
      this.gains = [];
      this.sources = [];
      contexts.push(this);
    }
    get currentTime() { return time / 1000; }
    createGain() {
      const gain = {events: [], value: 1,
        cancelScheduledValues(at) { this.events.push(['cancel', at]); },
        setValueAtTime(level, at) { this.events.push(['set', level, at]); },
        linearRampToValueAtTime(level, at) { this.events.push(['ramp', level, at]); }};
      if (failure === 'gain') throw new Error('gain unavailable');
      this.gains.push(gain);
      return {gain, connect: node => assert.equal(node, this.destination)};
    }
    createMediaElementSource(player) {
      if (failure === 'source') throw new Error('source unavailable');
      this.sources.push(player);
      return {connect: () => { if (failure === 'connect') throw new Error('connection failed'); }};
    }
    resume() { return resume.promise.then(() => { this.state = 'running'; }); }
    async close() { this.state = 'closed'; }
  }

  const globals = {
    Audio: FakeAudio, AudioContext: native ? undefined : FakeContext,
    webkitAudioContext: undefined, document: {getElementById: id => controls[id]},
    performance: {now: () => time},
    requestAnimationFrame: callback => { frames.set(++lastFrame, callback); return lastFrame; },
    cancelAnimationFrame: frame => frames.delete(frame)
  };
  for (const [key, value] of Object.entries(globals)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, {value, writable: true, configurable: true});
    t.after(() => original ? Object.defineProperty(globalThis, key, original) : delete globalThis[key]);
  }

  const audio = await import(`./audio.js?test=${++testInstance}`);
  audio.initAudio();
  const [music, effect] = players;
  return {audio, music, effect, contexts, players, controls,
    advance(ms) {
      time += ms;
      const callbacks = [...frames.values()];
      frames.clear();
      for (const callback of callbacks) callback(time);
    },
    toggle(id, checked) {
      const control = controls[id + '-toggle'];
      control.checked = checked;
      control.onchange();
    }};
}

function near(value, expected) {
  assert.ok(Math.abs(value - expected) < 1e-9, `${value} != ${expected}`);
}

test('activation is silent until requested, then creates one music gain stage', async t => {
  const {audio, music, effect, contexts, players, controls} = await setup(t);
  audio.setChapter('B1');
  audio.playEvents('sfx.retry');
  assert.deepEqual(music.plays, []);
  assert.deepEqual(effect.plays, []);
  assert.equal(contexts.length, 0);
  const listener = controls['music-toggle'].onchange;
  audio.initAudio();
  assert.equal(controls['music-toggle'].onchange, listener);

  audio.setChapter('B1', true);
  music.currentTime = 5;
  audio.setChapter('B1', true);
  assert.equal(music.currentTime, 5);
  assert.equal(music.loop, true);
  assert.deepEqual(music.plays, ['/audio/music.b1.mp3']);
  assert.equal(contexts.length, 1);
  assert.equal(contexts[0].gains.length, 1);
  assert.deepEqual(contexts[0].sources, [music]);
  assert.equal(players.length, 2);
});

test('quack and victory hold the same duck across chapter switches, then finale uses the same mix', async t => {
  const {audio, music, effect, contexts, advance} = await setup(t);
  audio.setChapter('C2', true);
  const {events} = contexts[0].gains[0];
  const playback = deferred();
  effect.playResult = playback.promise;
  audio.playEvents('C2-03.quack', 'C2-03.s3.cue');
  assert.equal(events.filter(([kind]) => kind === 'ramp').length, 0);
  music.currentTime = 6;
  playback.resolve();
  await playback.promise;
  assert.deepEqual(events.slice(-2), [['set', 1, 0], ['ramp', 0.32, 0.05]]);
  assert.equal(music.currentTime, 6);

  advance(100);
  const oldEnd = effect.onended;
  effect.end();
  await Promise.resolve();
  oldEnd();
  audio.setChapter('A1');
  assert.equal(music.src, '/audio/music.a1.mp3');
  assert.equal(music.volume, 0.8);
  assert.deepEqual(effect.plays, ['/audio/sfx.duck.mp3', '/audio/victory.c2.mp3']);
  assert.deepEqual(events.at(-1), ['ramp', 0.32, 0.05]);

  effect.end();
  assert.deepEqual(events.slice(-2), [['set', 0.32, 0.1], ['ramp', 1, 0.4]]);
  advance(300);
  audio.playEvents('C2-04.s3.cue');
  await Promise.resolve();
  assert.equal(effect.src, '/audio/victory.finale.mp3');
  assert.deepEqual(events.at(-1), ['ramp', 0.32, 0.45]);
});

test('rapid replacement ignores previous callbacks and attacks from the current gain', async t => {
  const {audio, effect, contexts, advance} = await setup(t);
  audio.setChapter('A1', true);
  const {events} = contexts[0].gains[0];
  audio.playEvents('sfx.retry');
  await Promise.resolve();
  const oldEnd = effect.onended;
  const oldError = effect.onerror;

  advance(25);
  const rejected = deferred();
  effect.playResult = rejected.promise;
  audio.playEvents('sfx.retry');
  near(events.at(-2)[1], 0.66);
  audio.playEvents('A1-01.s2.cue');
  rejected.reject(new Error('earlier play aborted'));
  await Promise.resolve();
  assert.equal(effect.src, '/audio/sfx.prop.mp3');
  near(events.at(-2)[1], 0.66);
  assert.deepEqual(events.at(-1), ['ramp', 0.32, 0.075]);

  effect.error = new Error('stale media callback');
  oldError();
  oldEnd();
  assert.equal(effect.paused, false);
  assert.deepEqual(events.at(-1), ['ramp', 0.32, 0.075]);
});

test('mute, cancellation, errors, and rejected playback release only the current duck', async t => {
  const {audio, music, effect, contexts, advance, toggle} = await setup(t);
  audio.setChapter('A2', true);
  const {events} = contexts[0].gains[0];
  audio.playEvents('sfx.retry');
  await Promise.resolve();
  advance(60);
  music.currentTime = 7;
  toggle('music', false);
  assert.equal(music.paused, true);
  assert.equal(music.muted, true);
  assert.equal(effect.paused, false);
  toggle('music', true);
  assert.equal(music.currentTime, 7);
  assert.equal(music.muted, false);
  assert.deepEqual(events.at(-1), ['ramp', 0.32, 0.05]);

  toggle('effects', false);
  assert.equal(effect.paused, true);
  assert.equal(music.paused, false);
  assert.deepEqual(events.at(-1), ['ramp', 1, 0.36]);
  audio.playEvents('sfx.retry');
  assert.equal(effect.plays.length, 1);
  toggle('effects', true);
  advance(300);

  audio.playEvents('C2-03.quack', 'C2-03.s3.cue');
  await Promise.resolve();
  advance(60);
  effect.playResult = Promise.reject(new Error('play denied'));
  effect.end();
  await Promise.resolve();
  assert.deepEqual(events.at(-1), ['ramp', 1, 0.72]);
  assert.equal(effect.paused, true);

  for (const cancel of [() => audio.silenceEffects(), () => {
    effect.error = new Error('media error'); effect.onerror();
  }, () => {
    effect.pause(); effect.onpause();
  }, () => audio.playEvents('unmapped')]) {
    advance(300);
    audio.playEvents('sfx.retry');
    await Promise.resolve();
    advance(60);
    cancel();
    assert.equal(effect.paused, true);
    assert.equal(events.at(-1)[1], 1);
  }
});

test('native volume fallback attacks and releases without changing the current loop or foreground level', async t => {
  const {audio, music, effect, contexts, advance} = await setup(t, {native: true});
  audio.setChapter('A1', true);
  music.currentTime = 3;
  audio.playEvents('sfx.retry');
  await Promise.resolve();
  advance(25);
  near(music.volume, 0.8 * 0.66);
  advance(25);
  near(music.volume, 0.8 * 0.32);
  near(effect.volume, 0.8);
  assert.equal(music.currentTime, 3);
  assert.equal(music.paused, false);
  effect.end();
  advance(150);
  near(music.volume, 0.8 * 0.66);
  advance(150);
  near(music.volume, 0.8);
  assert.equal(contexts.length, 0);
});

test('a pending context resumes into the active fade without multiplying volume', async t => {
  const resume = deferred();
  const {audio, music, contexts, advance} = await setup(t, {resume});
  audio.setChapter('B2', true);
  assert.deepEqual(contexts[0].sources, []);
  assert.equal(music.paused, false);
  audio.playEvents('sfx.retry');
  await Promise.resolve();
  advance(25);
  near(music.volume, 0.8 * 0.66);
  resume.resolve();
  await new Promise(setImmediate);
  assert.deepEqual(contexts[0].sources, [music]);
  const {events} = contexts[0].gains[0];
  near(events.at(-2)[1], 0.66);
  assert.deepEqual(events.at(-1), ['ramp', 0.32, 0.05]);
  near(music.volume, 0.8);
  advance(50);
  near(music.volume, 0.8);
});

test('a rejected context resume leaves music audible and uses volume fallback', async t => {
  const resume = deferred();
  const {audio, music, contexts, players, advance} = await setup(t, {resume});
  audio.setChapter('C1', true);
  music.currentTime = 3;
  resume.reject(new Error('context resume failed'));
  await new Promise(setImmediate);
  assert.equal(contexts[0].state, 'closed');
  assert.deepEqual(contexts[0].sources, []);
  assert.equal(players.length, 2);
  assert.equal(music.currentTime, 3);
  assert.equal(music.paused, false);
  audio.playEvents('sfx.retry');
  await Promise.resolve();
  advance(50);
  near(music.volume, 0.8 * 0.32);
});

for (const failure of ['gain', 'source', 'connect']) {
  test(`a ${failure} setup failure leaves a playable native music loop`, async t => {
    const resume = deferred();
    const {audio, music, contexts, players, advance} = await setup(t, {failure, resume});
    audio.setChapter('A1', true);
    music.currentTime = 3;
    resume.resolve();
    await new Promise(setImmediate);
    const activeMusic = failure === 'connect' ? players[2] : music;
    assert.equal(contexts[0].state, 'closed');
    assert.equal(activeMusic.paused, false);
    assert.equal(activeMusic.src, '/audio/music.a1.mp3');
    assert.equal(activeMusic.currentTime, 3);
    assert.equal(activeMusic.loop, true);
    if (activeMusic !== music) {
      assert.equal(music.paused, true);
      assert.equal(music.src, '');
    }
    audio.playEvents('sfx.retry');
    await Promise.resolve();
    advance(50);
    near(activeMusic.volume, 0.8 * 0.32);
  });
}
