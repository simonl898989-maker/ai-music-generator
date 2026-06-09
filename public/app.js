let selectedDuration = 8;
let pollInterval = null;

// 情境標籤
document.querySelectorAll('.tag').forEach(tag => {
  tag.addEventListener('click', () => {
    document.getElementById('promptInput').value = tag.dataset.prompt;
  });
});

// 時長按鈕
document.querySelectorAll('.duration-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedDuration = parseInt(btn.dataset.value);
  });
});

// 生成按鈕
document.getElementById('generateBtn').addEventListener('click', async () => {
  const prompt = document.getElementById('promptInput').value.trim();
  if (!prompt) {
    alert('請先輸入音樂描述！');
    return;
  }

  startLoading();

  try {
    const res = await fetch('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, duration: selectedDuration })
    });

    const data = await res.json();

    if (data.error) {
      showError(data.error);
      return;
    }

    // 如果已完成
    if (data.status === 'succeeded' && data.output) {
      showResult(data.output, prompt);
      return;
    }

    // 輪詢等待結果
    if (data.id) {
      pollStatus(data.id, prompt);
    }

  } catch (err) {
    showError('連線失敗，請確認伺服器是否啟動：' + err.message);
  }
});

function pollStatus(id, prompt) {
  let attempts = 0;
  const maxAttempts = 60;

  pollInterval = setInterval(async () => {
    attempts++;
    document.getElementById('statusText').textContent = `AI 創作中... (${attempts * 3}s)`;

    if (attempts >= maxAttempts) {
      clearInterval(pollInterval);
      showError('生成超時，請再試一次');
      return;
    }

    try {
      const res = await fetch(`/status/${id}`);
      const data = await res.json();

      if (data.status === 'succeeded' && data.output) {
        clearInterval(pollInterval);
        showResult(data.output, prompt);
      } else if (data.status === 'failed') {
        clearInterval(pollInterval);
        showError('生成失敗：' + (data.error || '未知錯誤'));
      }
    } catch (err) {
      clearInterval(pollInterval);
      showError('查詢失敗：' + err.message);
    }
  }, 3000);
}

function startLoading() {
  clearInterval(pollInterval);
  document.getElementById('generateBtn').disabled = true;
  document.getElementById('statusSection').classList.remove('hidden');
  document.getElementById('loadingState').classList.remove('hidden');
  document.getElementById('resultState').classList.add('hidden');
  document.getElementById('errorState').classList.add('hidden');
  document.getElementById('statusText').textContent = 'AI 正在創作中，請稍候...';
}

function showResult(audioUrl, prompt) {
  document.getElementById('generateBtn').disabled = false;
  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('resultState').classList.remove('hidden');

  const player = document.getElementById('audioPlayer');
  const downloadBtn = document.getElementById('downloadBtn');
  player.src = audioUrl;
  player.play();
  downloadBtn.href = audioUrl;

  document.getElementById('resultPrompt').textContent = prompt;
}

function showError(message) {
  document.getElementById('generateBtn').disabled = false;
  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('errorState').classList.remove('hidden');
  document.getElementById('errorText').textContent = '❌ ' + message;
}
