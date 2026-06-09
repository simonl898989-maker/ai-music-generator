const TOTAL_STEPS = 4;
let currentStep = 0;
let selectedDuration = 8;

const selections = { mood: null, scene: null, rhythm: null, elements: [] };

const moodLabels   = { 'uplifting, joyful, bright electronic music': '開心雀躍 😊', 'melancholic, emotional, deep, sad electronic music': '憂鬱沉靜 🌧', 'energetic, powerful, intense, pumping electronic music': '充滿活力 ⚡', 'peaceful, relaxing, ambient, calm electronic music': '放鬆平靜 🌿', 'dark, mysterious, atmospheric, haunting electronic music': '神秘黑暗 🌙' };
const sceneLabels  = { 'midnight city neon lights rain reflections urban': '深夜城市 🏙', 'summer beach ocean waves tropical sunshine': '夏日海灘 🏖', 'rainy day cozy coffee shop warm indoor': '雨天咖啡廳 ☕', 'outer space cosmos galaxy stars futuristic': '浩瀚宇宙 🚀', 'deep forest nature mystical ancient trees fog': '神秘森林 🌲' };
const rhythmLabels = { 'slow tempo 70 BPM, dreamy, slow beat': '緩慢沉穩 🐌', 'medium tempo 100 BPM, smooth flow': '平穩流暢 🚶', 'fast tempo 140 BPM, driving beat, intense rhythm': '快速激烈 🏃' };
const elementLabels = { 'soft vocal hums, ethereal voice': '人聲哼唱 🎤', 'heavy bass, deep sub bass, bass drop': '強烈低音 🔊', 'electronic synthesizer, digital synth pads': '電子合成器 🎹', 'piano melody, melodic keys': '鋼琴旋律 🎵', 'ambient pads, atmospheric texture, reverb': '空靈氛圍 🌊' };

function getStepKey(step) {
  return ['mood', 'scene', 'rhythm', 'elements'][step - 1];
}

// 單選卡片（步驟 1-3）
document.querySelectorAll('.step[data-step="1"] .card, .step[data-step="2"] .card, .step[data-step="3"] .card').forEach(card => {
  card.addEventListener('click', () => {
    const stepEl = card.closest('.step');
    stepEl.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    const key = getStepKey(parseInt(stepEl.dataset.step));
    selections[key] = card.dataset.value;
    document.getElementById('nextBtn').disabled = false;
  });
});

// 多選卡片（步驟 4）
document.querySelectorAll('.multi-card').forEach(card => {
  card.addEventListener('click', () => {
    card.classList.toggle('selected');
    const val = card.dataset.value;
    if (card.classList.contains('selected')) {
      selections.elements.push(val);
    } else {
      selections.elements = selections.elements.filter(v => v !== val);
    }
    document.getElementById('nextBtn').disabled = selections.elements.length === 0;
  });
});

// 音樂長度
document.querySelectorAll('.duration-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedDuration = parseInt(btn.dataset.value);
  });
});

// 下一步
document.getElementById('nextBtn').addEventListener('click', () => {
  if (currentStep < TOTAL_STEPS) {
    goToStep(currentStep + 1);
  } else if (currentStep === TOTAL_STEPS) {
    showRecipe();
    goToStep(5);
  }
});


// 上一步
document.getElementById('backBtn').addEventListener('click', () => {
  if (currentStep > 1) goToStep(currentStep - 1);
});

// 重新製作
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
  const pct = (Math.max(0, Math.min(currentStep, TOTAL_STEPS)) / TOTAL_STEPS) * 100;
  document.getElementById('progressFill').style.width = pct + '%';
  if (currentStep === 0) {
    document.getElementById('progressText').textContent = '先來學一點';
  } else if (currentStep <= TOTAL_STEPS) {
    document.getElementById('progressText').textContent = `步驟 ${currentStep} / ${TOTAL_STEPS}`;
  } else {
    document.getElementById('progressText').textContent = '準備生成 ✦';
  }
}

function updateNavButtons() {
  const back = document.getElementById('backBtn');
  const next = document.getElementById('nextBtn');
  const footer = document.getElementById('navFooter');

  back.disabled = currentStep === 0;

  if (currentStep === 5) {
    footer.classList.add('hidden');
    return;
  }
  footer.classList.remove('hidden');

  if (currentStep === 0) {
    next.textContent = '我了解了，開始製作 →';
    next.disabled = false;
    return;
  }

  if (currentStep < TOTAL_STEPS) {
    next.textContent = '下一步 →';
  } else {
    next.textContent = '查看配方 →';
  }

  const key = getStepKey(currentStep);
  if (key === 'elements') {
    next.disabled = selections.elements.length === 0;
  } else {
    next.disabled = !selections[key];
  }
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

// 生成音樂
document.getElementById('generateBtn').addEventListener('click', async () => {
  const prompt = buildPrompt();
  startLoading();

  try {
    const res = await fetch('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, duration: selectedDuration })
    });
    const data = await res.json();

    if (data.error) { showError(data.error); return; }
    if (data.status === 'succeeded' && data.output) { showResult(data.output); return; }
    if (data.id) pollStatus(data.id);

  } catch (err) {
    showError('連線失敗：' + err.message);
  }
});

let pollInterval = null;

function pollStatus(id) {
  let attempts = 0;
  pollInterval = setInterval(async () => {
    attempts++;
    document.getElementById('statusText').textContent = `AI 創作中... (${attempts * 3} 秒)`;
    if (attempts >= 60) { clearInterval(pollInterval); showError('生成超時，請再試一次'); return; }
    try {
      const res = await fetch(`/status/${id}`);
      const data = await res.json();
      if (data.status === 'succeeded' && data.output) { clearInterval(pollInterval); showResult(data.output); }
      else if (data.status === 'failed') { clearInterval(pollInterval); showError('生成失敗：' + (data.error || '未知錯誤')); }
    } catch (err) { clearInterval(pollInterval); showError(err.message); }
  }, 3000);
}

function startLoading() {
  clearInterval(pollInterval);
  document.getElementById('generateBtn').disabled = true;
  document.getElementById('loadingState').classList.remove('hidden');
  document.getElementById('resultState').classList.add('hidden');
  document.getElementById('errorState').classList.add('hidden');
}

function showResult(url) {
  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('resultState').classList.remove('hidden');
  const player = document.getElementById('audioPlayer');
  player.src = url;
  player.play();
  document.getElementById('downloadBtn').href = url;
}

function showError(msg) {
  document.getElementById('generateBtn').disabled = false;
  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('errorState').classList.remove('hidden');
  document.getElementById('errorText').textContent = '❌ ' + msg;
}

function resetAll() {
  selections.mood = null;
  selections.scene = null;
  selections.rhythm = null;
  selections.elements = [];
  document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
  document.getElementById('resultState').classList.add('hidden');
  document.getElementById('errorState').classList.add('hidden');
  document.getElementById('generateBtn').disabled = false;
  goToStep(0);
}

// 初始化
updateNavButtons();
