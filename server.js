const express = require('express');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const APPKEY = '783bbb7264451d82';
const APPSEC = '2653583c8873dea268ab9386918b1d65';
const USER_AGENT = 'Mozilla/5.0 BiliDroid/1.12.0 (bbcallen@gmail.com)';

const HEADERS = {
  'User-Agent': USER_AGENT,
  'Content-Type': 'application/x-www-form-urlencoded',
  'Accept': 'application/json',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'x-bili-metadata-legal-region': 'CN',
  'x-bili-aurora-eid': '',
  'x-bili-aurora-zone': '',
};

function appSign(params) {
  params.ts = String(Math.floor(Date.now() / 1000));
  params.appkey = APPKEY;
  const sorted = Object.keys(params).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
  const sign = crypto.createHash('md5').update(sorted + APPSEC).digest('hex');
  params.sign = sign;
  return params;
}

function bilibiliRequest(url, params, method = 'GET') {
  return new Promise((resolve, reject) => {
    const signedParams = appSign({ ...params });
    const postData = new URLSearchParams(signedParams).toString();
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + (method === 'GET' ? '?' + postData : ''),
      method: method,
      headers: { ...HEADERS },
    };

    if (method === 'POST') {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse response: ' + data));
        }
      });
    });

    req.on('error', reject);
    if (method === 'POST') req.write(postData);
    req.end();
  });
}

// Get bili ticket
app.post('/api/ticket', async (req, res) => {
  try {
    const ts = Math.floor(Date.now() / 1000);
    const hmac = crypto.createHmac('sha256', 'XgwSnGZ1p').update(`ts${ts}`).digest('hex');
    const url = `https://api.bilibili.com/bapis/bilibili.api.ticket.v1.Ticket/GenWebTicket?key_id=ec02&hexsign=${hmac}&context[ts]=${ts}&csrf=`;
    const resp = await new Promise((resolve, reject) => {
      const req = https.request(url, { method: 'POST', headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (r) => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => resolve(JSON.parse(d)));
      });
      req.on('error', reject);
      req.end();
    });
    res.json(resp);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// QR code login - get auth code
app.post('/api/login/qrcode', async (req, res) => {
  try {
    const resp = await bilibiliRequest(
      'https://passport.bilibili.com/x/passport-tv-login/qrcode/auth_code',
      { local_id: 0 },
      'POST'
    );
    res.json(resp);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// QR code login - poll status
app.post('/api/login/poll', async (req, res) => {
  try {
    const resp = await bilibiliRequest(
      'https://passport.bilibili.com/x/passport-tv-login/qrcode/poll',
      { auth_code: req.body.auth_code, local_id: 0 },
      'POST'
    );
    res.json(resp);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get user info
app.post('/api/user/info', async (req, res) => {
  try {
    const resp = await bilibiliRequest(
      'https://app.bilibili.com/x/v2/account/myinfo',
      { access_key: req.body.access_key },
      'GET'
    );
    res.json(resp);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get categories
app.post('/api/quiz/categories', async (req, res) => {
  try {
    const resp = await bilibiliRequest(
      'https://api.bilibili.com/x/senior/v1/category',
      {
        access_key: req.body.access_key,
        csrf: req.body.csrf,
        disable_rcmd: 0,
        mobi_app: 'android',
        platform: 'android',
        statistics: '{"appId":1,"platform":3,"version":"8.40.0","abtest":""}',
        web_location: '333.790',
      },
      'GET'
    );
    res.json(resp);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get captcha
app.post('/api/quiz/captcha', async (req, res) => {
  try {
    const resp = await bilibiliRequest(
      'https://api.bilibili.com/x/senior/v1/captcha',
      {
        access_key: req.body.access_key,
        csrf: req.body.csrf,
        disable_rcmd: 0,
        mobi_app: 'android',
        platform: 'android',
        statistics: '{"appId":1,"platform":3,"version":"8.40.0","abtest":""}',
        web_location: '333.790',
      },
      'GET'
    );
    res.json(resp);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Submit captcha
app.post('/api/quiz/captcha/submit', async (req, res) => {
  try {
    const resp = await bilibiliRequest(
      'https://api.bilibili.com/x/senior/v1/captcha/submit',
      {
        access_key: req.body.access_key,
        csrf: req.body.csrf,
        bili_code: req.body.code,
        bili_token: req.body.captcha_token,
        disable_rcmd: '0',
        gt_challenge: '',
        gt_seccode: '',
        gt_validate: '',
        ids: req.body.ids,
        mobi_app: 'android',
        platform: 'android',
        statistics: '{"appId":1,"platform":3,"version":"8.40.0","abtest":""}',
        type: 'bilibili',
      },
      'POST'
    );
    res.json(resp);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get question
app.post('/api/quiz/question', async (req, res) => {
  try {
    const resp = await bilibiliRequest(
      'https://api.bilibili.com/x/senior/v1/question',
      {
        access_key: req.body.access_key,
        csrf: req.body.csrf,
        disable_rcmd: '0',
        mobi_app: 'android',
        platform: 'android',
        statistics: '{"appId":1,"platform":3,"version":"8.40.0","abtest":""}',
        web_location: '333.790',
      },
      'GET'
    );
    res.json(resp);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Submit answer
app.post('/api/quiz/answer', async (req, res) => {
  try {
    const resp = await bilibiliRequest(
      'https://api.bilibili.com/x/senior/v1/answer/submit',
      {
        access_key: req.body.access_key,
        csrf: req.body.csrf,
        id: req.body.id,
        ans_hash: req.body.ans_hash,
        ans_text: req.body.ans_text,
        disable_rcmd: '0',
        mobi_app: 'android',
        platform: 'android',
        statistics: '{"appId":1,"platform":3,"version":"8.40.0","abtest":""}',
        web_location: '333.790',
      },
      'POST'
    );
    res.json(resp);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get result
app.post('/api/quiz/result', async (req, res) => {
  try {
    const resp = await bilibiliRequest(
      'https://api.bilibili.com/x/senior/v1/answer/result',
      {
        access_key: req.body.access_key,
        csrf: req.body.csrf,
        disable_rcmd: '0',
        mobi_app: 'android',
        platform: 'android',
        statistics: '{"appId":1,"platform":3,"version":"8.40.0","abtest":""}',
        web_location: '333.790',
      },
      'GET'
    );
    res.json(resp);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// LLM proxy
app.post('/api/llm/ask', async (req, res) => {
  const { provider, apiKey, baseUrl, model, question } = req.body;

  const PROMPT = `当前时间：${new Date().toISOString()}
你是一个高效精准的答题专家，面对选择题时，直接根据问题和选项判断正确答案，并返回对应选项的序号（1, 2, 3, 4）。示例：
问题：大的反义词是什么？
选项：['长', '宽', '小', '热']
回答：3
如果不确定正确答案，选择最接近的选项序号返回，不提供额外解释或超出 1-4 的内容。
---
不要思考，直接回答我的问题：${question}`;

  let url, headers, body;

  if (provider === 'gemini') {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.5-flash'}:generateContent?key=${apiKey}`;
    headers = { 'Content-Type': 'application/json' };
    body = JSON.stringify({ contents: [{ parts: [{ text: PROMPT }] }] });
  } else {
    // DeepSeek or OpenAI-compatible
    const base = baseUrl || 'https://api.deepseek.com/v1';
    const mdl = model || 'deepseek-chat';
    url = `${base}/chat/completions`;
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };
    body = JSON.stringify({
      model: mdl,
      messages: [{ role: 'user', content: PROMPT }],
    });
  }

  try {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(body) },
    };

    const { statusCode, response } = await new Promise((resolve, reject) => {
      const r = https.request(options, (resp) => {
        let d = '';
        resp.on('data', c => d += c);
        resp.on('end', () => {
          try {
            resolve({ statusCode: resp.statusCode, response: JSON.parse(d) });
          } catch (e) {
            reject(new Error('LLM response parse error (status ' + resp.statusCode + '): ' + d.substring(0, 200)));
          }
        });
      });
      r.on('error', reject);
      r.setTimeout(60000, () => { r.destroy(); reject(new Error('LLM request timeout (60s)')); });
      r.write(body);
      r.end();
    });

    if (statusCode !== 200) {
      const errMsg = response.error?.message || response.error?.type || JSON.stringify(response).substring(0, 200);
      console.error(`LLM API error [${statusCode}]:`, errMsg);
      return res.status(502).json({ error: `LLM API 返回 ${statusCode}: ${errMsg}` });
    }

    let answer;
    if (provider === 'gemini') {
      answer = response.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
      answer = response.choices?.[0]?.message?.content;
    }

    if (!answer) {
      console.error('LLM API returned empty answer:', JSON.stringify(response).substring(0, 300));
      return res.status(502).json({ error: 'AI 返回了空回答，请检查模型配置' });
    }

    res.json({ answer: answer.trim() });
  } catch (e) {
    console.error('LLM proxy error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bili-Hardcore Web running at http://localhost:${PORT}`);
});
