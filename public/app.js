// ═══════════════════════════════
//  TAB 切換
// ═══════════════════════════════
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab === 'create' ? 'tabCreate' : 'tabRemix').classList.add('active');
    document.getElementById('navFooter').style.display = tab.dataset.tab === 'create' ? '' : 'none';
  });
});

// ═══════════════════════════════
//  WEB AUDIO API 互動示範
// ═══════════════════════════════
let audioCtx = null;
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playBeat(ctx, t) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(120, t);
  osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.12);
  gain.gain.setValueAtTime(1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.15);

  // hi-hat noise
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  const hgain = ctx.createGain();
  const filt = ctx.createBiquadFilter();
  src.buffer = buf; filt.type = 'highpass'; filt.frequency.value = 6000;
  hgain.gain.setValueAtTime(0.3, t + 0.1); hgain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  src.connect(filt); filt.connect(hgain); hgain.connect(ctx.destination);
  src.start(t + 0.1); src.stop(t + 0.15);
}

function playBass(ctx, t, freq = 55) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine'; osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.8, t);
  gain.gain.setValueAtTime(0.8, t + 0.3);
  gain.gain.linearRampToValueAtTime(0, t + 0.5);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.5);
}

function playSynth(ctx, t, freq = 220) {
  const osc = ctx.createOscillator();
  const filt = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = 'sawtooth'; osc.frequency.value = freq;
  filt.type = 'lowpass';
  filt.frequency.setValueAtTime(300, t);
  filt.frequency.exponentialRampToValueAtTime(2500, t + 0.25);
  gain.gain.setValueAtTime(0.4, t);
  gain.gain.linearRampToValueAtTime(0, t + 0.5);
  osc.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.5);
}

function playMelody(ctx, t) {
  const notes = [261.63, 329.63, 392, 440, 523.25, 392]; // C E G A C G
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle'; osc.frequency.value = freq;
    const nt = t + i * 0.18;
    gain.gain.setValueAtTime(0.35, nt);
    gain.gain.linearRampToValueAtTime(0, nt + 0.16);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(nt); osc.stop(nt + 0.2);
  });
}

function playAtm(ctx, t) {
  const bufSize = Math.floor(ctx.sampleRate * 2);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  const filt = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  src.buffer = buf; filt.type = 'lowpass'; filt.frequency.value = 600;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.15, t + 0.6);
  gain.gain.linearRampToValueAtTime(0, t + 1.8);
  src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
  src.start(t); src.stop(t + 2);
}

// 單元素「試聽」按鈕
document.querySelectorAll('.play-btn').forEach(btn => {
  let stopFn = null;
  btn.addEventListener('click', () => {
    const ctx = getCtx();
    const sound = btn.dataset.sound;
    const t = ctx.currentTime;
    // 高亮對應 learn card
    document.querySelectorAll('.learn-card').forEach(c => c.classList.remove('highlighted'));
    btn.closest('.learn-card').classList.add('highlighted');

    if (btn.classList.contains('playing')) {
      btn.textContent = '▶ 試聽';
      btn.classList.remove('playing');
      return;
    }
    document.querySelectorAll('.play-btn').forEach(b => { b.textContent = '▶ 試聽'; b.classList.remove('playing'); });
    btn.textContent = '■ 停止';
    btn.classList.add('playing');

    if (sound === 'beat') {
      playBeat(ctx, t); playBeat(ctx, t + 0.5); playBeat(ctx, t + 1); playBeat(ctx, t + 1.5);
      setTimeout(() => { btn.textContent = '▶ 試聽'; btn.classList.remove('playing'); }, 2200);
    } else if (sound === 'bass') {
      playBass(ctx, t); playBass(ctx, t + 0.6); playBass(ctx, t + 1.2);
      setTimeout(() => { btn.textContent = '▶ 試聽'; btn.classList.remove('playing'); }, 2000);
    } else if (sound === 'synth') {
      playSynth(ctx, t); playSynth(ctx, t + 0.55, 277); playSynth(ctx, t + 1.1, 330);
      setTimeout(() => { btn.textContent = '▶ 試聽'; btn.classList.remove('playing'); }, 2000);
    } else if (sound === 'melody') {
      playMelody(ctx, t);
      setTimeout(() => { btn.textContent = '▶ 試聽'; btn.classList.remove('playing'); }, 1500);
    } else if (sound === 'atm') {
      playAtm(ctx, t);
      setTimeout(() => { btn.textContent = '▶ 試聽'; btn.classList.remove('playing'); }, 2200);
    }
  });
});

// 混音台 – 開關層次
const activeLayers = { beat: true, bass: true, synth: true, melody: true, atm: true };
document.querySelectorAll('.layer-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const layer = btn.closest('.mixer-layer').dataset.layer;
    activeLayers[layer] = !activeLayers[layer];
    btn.classList.toggle('on', activeLayers[layer]);
    btn.classList.toggle('off', !activeLayers[layer]);
  });
});

// 混音台播放
let mixerPlaying = false;
let schedulerTimer = null;
let nextBeat = 0;
let beatNum = 0;
const BPM = 120;
const BD = 60 / BPM;

function scheduleBeats() {
  const ctx = getCtx();
  while (nextBeat < ctx.currentTime + 0.15) {
    if (activeLayers.beat) playBeat(ctx, nextBeat);
    if (activeLayers.bass && beatNum % 4 === 0) playBass(ctx, nextBeat);
    if (activeLayers.bass && beatNum % 4 === 2) playBass(ctx, nextBeat, 41);
    if (activeLayers.synth && beatNum % 8 === 0) playSynth(ctx, nextBeat);
    if (activeLayers.synth && beatNum % 8 === 4) playSynth(ctx, nextBeat, 165);
    if (activeLayers.melody && beatNum % 16 === 0) playMelody(ctx, nextBeat);
    if (activeLayers.atm && beatNum % 16 === 8) playAtm(ctx, nextBeat);
    nextBeat += BD;
    beatNum = (beatNum + 1) % 32;
  }
}

// 混音器動畫
function updateMixerVisuals() {
  document.querySelectorAll('.mixer-layer').forEach(layer => {
    const key = layer.dataset.layer;
    layer.classList.toggle('playing', mixerPlaying && activeLayers[key]);
  });
}

document.getElementById('mixerPlayBtn').addEventListener('click', () => {
  const ctx = getCtx();
  const btn = document.getElementById('mixerPlayBtn');
  if (!mixerPlaying) {
    mixerPlaying = true;
    nextBeat = ctx.currentTime + 0.05;
    beatNum = 0;
    btn.textContent = '■ 停止示範';
    btn.classList.add('playing');
    schedulerTimer = setInterval(scheduleBeats, 50);
  } else {
    mixerPlaying = false;
    clearInterval(schedulerTimer);
    btn.textContent = '▶ 播放示範';
    btn.classList.remove('playing');
  }
  updateMixerVisuals();
});

setInterval(() => { if (mixerPlaying) updateMixerVisuals(); }, 100);

// ═══════════════════════════════
//  製作電音：步驟流程
// ═══════════════════════════════
const TOTAL_STEPS = 4;
let currentStep = 0;
let selectedDuration = 8;
const selections = { mood: null, scene: null, rhythm: null, elements: [] };

const moodLabels   = { 'uplifting, joyful, bright electronic music': '開心雀躍 😊', 'melancholic, emotional, deep, sad electronic music': '憂鬱沉靜 🌧', 'energetic, powerful, intense, pumping electronic music': '充滿活力 ⚡', 'peaceful, relaxing, ambient, calm electronic music': '放鬆平靜 🌿', 'dark, mysterious, atmospheric, haunting electronic music': '神秘黑暗 🌙' };
const sceneLabels  = { 'midnight city neon lights rain reflections urban': '深夜城市 🏙', 'summer beach ocean waves tropical sunshine': '夏日海灘 🏖', 'rainy day cozy coffee shop warm indoor': '雨天咖啡廳 ☕', 'outer space cosmos galaxy stars futuristic': '浩瀚宇宙 🚀', 'deep forest nature mystical ancient trees fog': '神秘森林 🌲' };
const rhythmLabels = { 'slow tempo 70 BPM, dreamy, slow beat': '緩慢沉穩 🐌', 'medium tempo 100 BPM, smooth flow': '平穩流暢 🚶', 'fast tempo 140 BPM, driving beat, intense rhythm': '快速激烈 🏃' };
const elementLabels = { 'soft vocal hums, ethereal voice': '人聲哼唱 🎤', 'heavy bass, deep sub bass, bass drop': '強烈低音 🔊', 'electronic synthesizer, digital synth pads': '電子合成器 🎹', 'piano melody, melodic keys': '鋼琴旋律 🎵', 'ambient pads, atmospheric texture, reverb': '空靈氛圍 🌊' };

function getStepKey(step) { return ['mood', 'scene', 'rhythm', 'elements'][step - 1]; }

// 單選卡片
document.querySelectorAll('.step[data-step="1"] .card, .step[data-step="2"] .card, .step[data-step="3"] .card').forEach(card => {
  card.addEventListener('click', () => {
    card.closest('.step').querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selections[getStepKey(parseInt(card.closest('.step').dataset.step))] = card.dataset.value;
    document.getElementById('nextBtn').disabled = false;
  });
});

// 多選卡片
document.querySelectorAll('.multi-card').forEach(card => {
  card.addEventListener('click', () => {
    card.classList.toggle('selected');
    const val = card.dataset.value;
    if (card.classList.contains('selected')) selections.elements.push(val);
    else selections.elements = selections.elements.filter(v => v !== val);
    document.getElementById('nextBtn').disabled = selections.elements.length === 0;
  });
});

// 時長
document.querySelectorAll('.duration-btn[data-value]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.duration-btn[data-value]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedDuration = parseInt(btn.dataset.value);
  });
});

document.getElementById('nextBtn').addEventListener('click', () => {
  if (currentStep < TOTAL_STEPS) goToStep(currentStep + 1);
  else if (currentStep === TOTAL_STEPS) { showRecipe(); goToStep(5); }
});

document.getElementById('backBtn').addEventListener('click', () => {
  if (currentStep > 0) goToStep(currentStep - 1);
});

document.getElementById('retryBtn')?.addEventListener('click', resetAll);
document.getElementById('retryErrorBtn')?.addEventListener('click', () => {
  document.getElementById('errorState').classList.add('hidden');
  document.getElementById('generateBtn').disabled = false;
});

function goToStep(step) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.querySelector(`.step[data-step="${step}"]`).classList.add('active');
  currentStep = step;
  updateProgress();
  updateNavButtons();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress() {
  const pct = currentStep === 0 ? 0 : (Math.min(currentStep, TOTAL_STEPS) / TOTAL_STEPS) * 100;
  document.getElementById('progressFill').style.width = pct + '%';
  const labels = ['先來認識電音', '步驟 1 / 4', '步驟 2 / 4', '步驟 3 / 4', '步驟 4 / 4', '準備生成 ✦'];
  document.getElementById('progressText').textContent = labels[currentStep] || '完成';
}

function updateNavButtons() {
  const back = document.getElementById('backBtn');
  const next = document.getElementById('nextBtn');
  const footer = document.getElementById('navFooter');
  back.disabled = currentStep === 0;
  if (currentStep === 5) { footer.classList.add('hidden'); return; }
  footer.classList.remove('hidden');
  if (currentStep === 0) { next.textContent = '我了解了，開始製作 →'; next.disabled = false; return; }
  next.textContent = currentStep < TOTAL_STEPS ? '下一步 →' : '查看配方 →';
  const key = getStepKey(currentStep);
  next.disabled = key === 'elements' ? selections.elements.length === 0 : !selections[key];
}

function showRecipe() {
  document.getElementById('recipeMood').textContent = moodLabels[selections.mood] || '—';
  document.getElementById('recipeScene').textContent = sceneLabels[selections.scene] || '—';
  document.getElementById('recipeRhythm').textContent = rhythmLabels[selections.rhythm] || '—';
  document.getElementById('recipeElements').textContent = selections.elements.map(e => elementLabels[e]).join('、') || '—';
}

function buildPrompt() {
  return `electronic music, ${selections.mood}, ${selections.scene}, ${selections.rhythm}, ${selections.elements.join(', ')}`;
}

// 生成
let pollInterval = null;

document.getElementById('generateBtn').addEventListener('click', async () => {
  startGenerating();
  try {
    const res = await fetch('/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: buildPrompt(), duration: selectedDuration }) });
    const data = await res.json();
    if (data.error) { showError(data.error); return; }
    if (data.status === 'succeeded' && data.output) { showResult(data.output); return; }
    if (data.id) pollGenerate(data.id);
  } catch (err) { showError('連線失敗：' + err.message); }
});

function pollGenerate(id) {
  let n = 0;
  pollInterval = setInterval(async () => {
    n++;
    document.getElementById('statusText').textContent = `AI 創作中... (${n * 3} 秒)`;
    if (n >= 60) { clearInterval(pollInterval); showError('生成超時，請再試一次'); return; }
    try {
      const res = await fetch(`/status/${id}`);
      const data = await res.json();
      if (data.status === 'succeeded' && data.output) { clearInterval(pollInterval); showResult(data.output); }
      else if (data.status === 'failed') { clearInterval(pollInterval); showError(data.error || '生成失敗'); }
    } catch (err) { clearInterval(pollInterval); showError(err.message); }
  }, 3000);
}

function startGenerating() {
  clearInterval(pollInterval);
  document.getElementById('generateBtn').disabled = true;
  document.getElementById('loadingState').classList.remove('hidden');
  document.getElementById('resultState').classList.add('hidden');
  document.getElementById('errorState').classList.add('hidden');
}

function showResult(url) {
  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('resultState').classList.remove('hidden');
  const p = document.getElementById('audioPlayer');
  p.src = url; p.play();
  document.getElementById('downloadBtn').href = url;
}

function showError(msg) {
  document.getElementById('generateBtn').disabled = false;
  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('errorState').classList.remove('hidden');
  document.getElementById('errorText').textContent = '❌ ' + msg;
}

function resetAll() {
  selections.mood = null; selections.scene = null; selections.rhythm = null; selections.elements = [];
  document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
  document.getElementById('resultState').classList.add('hidden');
  document.getElementById('errorState').classList.add('hidden');
  document.getElementById('generateBtn').disabled = false;
  goToStep(0);
}

updateNavButtons();

// ═══════════════════════════════
//  改寫音樂
// ═══════════════════════════════
let remixAudioUrl = null;
let selectedRemixStyle = null;
let selectedRemixDuration = 15;
let remixPollInterval = null;

const urlInput = document.getElementById('audioUrlInput');
const urlClearBtn = document.getElementById('urlClearBtn');

urlInput.addEventListener('input', () => {
  const val = urlInput.value.trim();
  urlClearBtn.classList.toggle('hidden', !val);

  if (val.startsWith('http')) {
    remixAudioUrl = val;
    // 嘗試顯示預覽
    const preview = document.getElementById('urlPreview');
    const audio = document.getElementById('urlAudioPreview');
    preview.classList.remove('hidden');
    audio.src = val;
  } else {
    remixAudioUrl = null;
    document.getElementById('urlPreview').classList.add('hidden');
  }
  checkRemixReady();
});

urlClearBtn.addEventListener('click', () => {
  urlInput.value = '';
  remixAudioUrl = null;
  urlClearBtn.classList.add('hidden');
  document.getElementById('urlPreview').classList.add('hidden');
  checkRemixReady();
});

document.querySelectorAll('.style-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.style-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedRemixStyle = card.dataset.prompt;
    checkRemixReady();
  });
});

document.querySelectorAll('.duration-btn[data-remix-duration]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.duration-btn[data-remix-duration]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedRemixDuration = parseInt(btn.dataset.remixDuration);
  });
});

function checkRemixReady() {
  document.getElementById('remixBtn').disabled = !(remixAudioUrl && selectedRemixStyle);
}

document.getElementById('remixBtn').addEventListener('click', async () => {
  if (!remixAudioUrl || !selectedRemixStyle) return;
  startRemixing();

  try {
    const res = await fetch('/remix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: remixAudioUrl, prompt: selectedRemixStyle, duration: selectedRemixDuration })
    });
    const data = await res.json();
    if (data.error) { showRemixError(data.error); return; }
    if (data.status === 'succeeded' && data.output) { showRemixResult(data.output); return; }
    if (data.id) pollRemix(data.id);
  } catch (err) { showRemixError('連線失敗：' + err.message); }
});

function pollRemix(id) {
  let n = 0;
  remixPollInterval = setInterval(async () => {
    n++;
    document.getElementById('remixStatusText').textContent = `AI 改寫中... (${n * 3} 秒)`;
    if (n >= 60) { clearInterval(remixPollInterval); showRemixError('改寫超時，請再試一次'); return; }
    try {
      const res = await fetch(`/status/${id}`);
      const data = await res.json();
      if (data.status === 'succeeded' && data.output) { clearInterval(remixPollInterval); showRemixResult(data.output); }
      else if (data.status === 'failed') { clearInterval(remixPollInterval); showRemixError(data.error || '改寫失敗'); }
    } catch (err) { clearInterval(remixPollInterval); showRemixError(err.message); }
  }, 3000);
}

function startRemixing() {
  clearInterval(remixPollInterval);
  document.getElementById('remixBtn').disabled = true;
  document.getElementById('remixLoading').classList.remove('hidden');
  document.getElementById('remixResult').classList.add('hidden');
  document.getElementById('remixError').classList.add('hidden');
}

function showRemixResult(url) {
  document.getElementById('remixLoading').classList.add('hidden');
  document.getElementById('remixResult').classList.remove('hidden');
  document.getElementById('remixOriginalAudio').src = remixAudioUrl;
  const out = document.getElementById('remixOutputAudio');
  out.src = url; out.play();
  document.getElementById('remixDownloadBtn').href = url;
}

function showRemixError(msg) {
  document.getElementById('remixBtn').disabled = false;
  document.getElementById('remixLoading').classList.add('hidden');
  document.getElementById('remixError').classList.remove('hidden');
  document.getElementById('remixErrorText').textContent = '❌ ' + msg;
}

document.getElementById('remixAgainBtn')?.addEventListener('click', () => {
  document.getElementById('remixResult').classList.add('hidden');
  document.getElementById('remixBtn').disabled = false;
});
document.getElementById('remixRetryBtn')?.addEventListener('click', () => {
  document.getElementById('remixError').classList.add('hidden');
  document.getElementById('remixBtn').disabled = false;
});
