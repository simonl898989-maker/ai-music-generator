require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());
app.use(express.static('public'));
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const MODEL_VERSION = '671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb';

async function callReplicate(input) {
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ version: MODEL_VERSION, input })
  });
  return response.json();
}

function handleReplicateError(data, res) {
  if (data.error || data.detail) {
    return res.status(500).json({ error: data.detail || data.error });
  }
  return false;
}

// 從頭生成
app.post('/generate', async (req, res) => {
  const { prompt, duration } = req.body;
  if (!prompt) return res.status(400).json({ error: '請輸入描述文字' });
  try {
    const data = await callReplicate({
      prompt, duration: duration || 8,
      model_version: 'stereo-large', output_format: 'mp3', normalization_strategy: 'peak'
    });
    if (handleReplicateError(data, res)) return;
    res.json({ id: data.id, status: data.status, output: data.output });
  } catch (err) {
    res.status(500).json({ error: '伺服器錯誤：' + err.message });
  }
});

// 貼上音樂網址並改寫
app.post('/remix', async (req, res) => {
  const { url, prompt, duration } = req.body;
  if (!url) return res.status(400).json({ error: '請貼上音樂網址' });
  if (!prompt) return res.status(400).json({ error: '請選擇改寫風格' });

  try {
    const data = await callReplicate({
      prompt, duration: parseInt(duration) || 15,
      model_version: 'stereo-melody-large',
      input_audio: url,
      output_format: 'mp3', normalization_strategy: 'peak'
    });
    if (handleReplicateError(data, res)) return;
    res.json({ id: data.id, status: data.status, output: data.output });
  } catch (err) {
    res.status(500).json({ error: '伺服器錯誤：' + err.message });
  }
});

// 查詢生成進度
app.get('/status/:id', async (req, res) => {
  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${req.params.id}`, {
      headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` }
    });
    const data = await response.json();
    res.json({ status: data.status, output: data.output, error: data.error });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ 伺服器啟動中：http://localhost:${PORT}`));
