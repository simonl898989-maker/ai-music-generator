require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// 啟動音樂生成
app.post('/generate', async (req, res) => {
  const { prompt, duration } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: '請輸入描述文字' });
  }

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: '671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb',
        input: {
          prompt: prompt,
          duration: duration || 8,
          model_version: 'stereo-large',
          output_format: 'mp3',
          normalization_strategy: 'peak'
        }
      })
    });

    const data = await response.json();

    if (data.status === 402 || (data.detail && data.detail.includes('credit'))) {
      return res.status(402).json({ error: '帳號餘額不足，請至 replicate.com/account/billing 加入信用卡' });
    }

    if (data.error || data.detail) {
      return res.status(500).json({ error: data.detail || data.error });
    }

    // 如果還在處理中，輪詢等待結果
    if (data.status === 'starting' || data.status === 'processing') {
      return res.json({ id: data.id, status: data.status });
    }

    res.json({ id: data.id, status: data.status, output: data.output });
  } catch (err) {
    res.status(500).json({ error: '伺服器錯誤：' + err.message });
  }
});

// 查詢生成進度
app.get('/status/:id', async (req, res) => {
  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${req.params.id}`, {
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`
      }
    });
    const data = await response.json();
    res.json({ status: data.status, output: data.output, error: data.error });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ 伺服器啟動中：http://localhost:${PORT}`);
});
