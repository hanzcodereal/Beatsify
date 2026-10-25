const axios = require('axios');
const crypto = require('crypto');
const { execFile } = require('child_process');

const ytCache = new Map();
const CACHE_TTL = 90 * 60 * 1000;

let cachedVidssaveAuth = '4c9b7d21';
let lastAuthScrapeTime = 0;

async function scrapeVidssaveAuth() {
  if (Date.now() - lastAuthScrapeTime < 30 * 60 * 1000 && cachedVidssaveAuth) {
    return cachedVidssaveAuth;
  }
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
  try {
    const htmlRes = await axios.get('https://vidssave.com/', {
      headers: { 'user-agent': UA },
      timeout: 6000
    });
    const matches = htmlRes.data.match(/src="([^"]*chunk[^"]*\.js)"/g) || [];
    for (const m of matches) {
      const scriptUrl = m.replace(/^src="/, '').replace(/"$/, '');
      const fullScriptUrl = scriptUrl.startsWith('http') ? scriptUrl : 'https://vidssave.com' + scriptUrl;
      const scriptRes = await axios.get(fullScriptUrl, {
        headers: { 'user-agent': UA },
        timeout: 6000
      });
      const authMatch = scriptRes.data.match(/auth:"([a-zA-Z0-9_-]{6,32})"/);
      if (authMatch) {
        cachedVidssaveAuth = authMatch[1];
        lastAuthScrapeTime = Date.now();
        console.log(`[EXTRACT] Scraped fresh vidssave auth: ${cachedVidssaveAuth}`);
        return cachedVidssaveAuth;
      }
    }
  } catch (e) {
    console.warn('[EXTRACT] Failed to scrape vidssave auth:', e.message);
  }
  return cachedVidssaveAuth;
}

function decryptVidssave(cipherB64) {
  const candidateKeys = [
    '4c9b7d2e'.repeat(3) + (cachedVidssaveAuth || '4c9b7d21'),
    '4c9b7d2e'.repeat(3) + '4c9b7d21',
    'rz18efAXUbdiaO7k'
  ];

  for (const k of candidateKeys) {
    try {
      const keyBuf = Buffer.from(k, 'utf8');
      const ivBuf = Buffer.from(k.slice(0, 16), 'utf8');
      const algo = keyBuf.length === 32 ? 'aes-256-cbc' : 'aes-128-cbc';
      const decipher = crypto.createDecipheriv(algo, keyBuf, ivBuf);
      decipher.setAutoPadding(false);
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(cipherB64, 'base64')),
        decipher.final()
      ]);
      const jsonStr = decrypted.toString('utf8').replace(/\0+$/, '');
      const parsed = JSON.parse(jsonStr);
      if (parsed && (parsed.resources || parsed.title)) {
        return parsed;
      }
    } catch (e) {}
  }
  return null;
}

async function tryVidssave(fullUrl, idMatch, signal, isRetry = false) {
  const auth = cachedVidssaveAuth || '4c9b7d21';
  const api = axios.create({
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'origin': 'https://vidssave.com',
      'referer': 'https://vidssave.com/',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'accept': 'application/json, text/plain, */*'
    },
    timeout: 10000,
    signal
  });

  const params = new URLSearchParams({
    hostname: 'vidssave.com',
    auth: auth,
    domain: 'api-ak.vidssave.com',
    link: fullUrl
  });

  const res = await api.post('https://api.vidssave.com/api/contentsite_api/media/parse', params.toString());
  const raw = res?.data;
  if (!raw) {
    throw new Error('No response from vidssave');
  }

  if (raw.status !== 1 || !raw.data) {
    if (!isRetry) {
      console.log('[EXTRACT] Vidssave parse failed, attempting auth refresh...');
      await scrapeVidssaveAuth();
      return tryVidssave(fullUrl, idMatch, signal, true);
    }
    throw new Error(`Vidssave failed: ${JSON.stringify(raw).slice(0, 200)}`);
  }

  const parsed = decryptVidssave(raw.data);
  if (!parsed) {
    throw new Error('Failed to decrypt vidssave payload');
  }

  let audioList = (parsed.resources || []).filter(r => r.type === 'audio' && r.download_url);
  if (!audioList.length) {

    audioList = (parsed.resources || []).filter(r => r.download_url);
  }
  if (!audioList.length) throw new Error('No media resource found in vidssave');

  const qualityOrder = ['256KBPS', '128KBPS', 'LOW', '48KBPS', '360P', '480P', '720P', '1080P'];
  audioList.sort((a, b) => {
    let ia = qualityOrder.indexOf(a.quality);
    let ib = qualityOrder.indexOf(b.quality);
    if (ia === -1) ia = 99;
    if (ib === -1) ib = 99;
    return ia - ib;
  });

  let workingAudioUrl = null;
  for (const item of audioList) {
    try {
      const r = await axios.get(item.download_url, {
        maxRedirects: 0,
        validateStatus: s => true,
        timeout: 3000,
        signal
      });
      const loc = r.headers.location;
      if (loc) {
        const check = await axios.head(loc, {
          validateStatus: s => true,
          timeout: 3000,
          headers: { 'user-agent': 'Mozilla/5.0' },
          signal
        });
        if (check.status === 200 || check.status === 206) {
          workingAudioUrl = item.download_url;
          break;
        }
      } else if (r.status === 200 || r.status === 206) {
        workingAudioUrl = item.download_url;
        break;
      }
    } catch(e) {}
  }

  const finalAudio = workingAudioUrl || audioList[0].download_url;

  const dur = parsed.duration;
  const durationStr = dur ? `${Math.floor(dur / 60)}:${(dur % 60).toString().padStart(2, '0')}` : null;

  return {
    duration: durationStr,
    audio: finalAudio,
    title: parsed.title,
    thumbnail: parsed.thumbnail || null,
    cdn: 'vidssave'
  };
}

async function tryYtDlp(idMatch, signal) {
  return new Promise((resolve, reject) => {
    const child = execFile('yt-dlp', ['-g', '-f', 'bestaudio', `https://www.youtube.com/watch?v=${idMatch}`], { timeout: 12000 }, (err, stdout) => {
      if (err) return reject(err);
      const url = stdout.trim().split('\n').pop();
      if (!url || !url.startsWith('http')) return reject(new Error('Invalid yt-dlp output'));
      resolve({
        duration: null,
        audio: url,
        cdn: 'yt-dlp'
      });
    });

    if (signal) {
      signal.addEventListener('abort', () => {
        try { child.kill(); } catch (e) {}
      });
    }
  });
}

async function trySaveTube(cdn, fullUrl, idMatch, signal) {
  const api = axios.create({
    headers: {
      'content-type': 'application/json',
      'origin': 'https://yt.savetube.me',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    },
    timeout: 12000,
    signal
  });

  const infoResponse = await api.post(`https://${cdn}/v2/info`, { url: fullUrl });
  const encryptedData = infoResponse?.data?.data;
  if (!encryptedData) throw new Error(`No data from ${cdn}`);

  const encrypted = Buffer.from(encryptedData, 'base64');
  const decipher = crypto.createDecipheriv('aes-128-cbc',
    Buffer.from('C5D58EF67A7584E4A29F6C35BBC4EB12', 'hex'),
    encrypted.slice(0, 16)
  );

  const decryptedBuffer = Buffer.concat([
    decipher.update(encrypted.slice(16)),
    decipher.final()
  ]);

  const decrypted = JSON.parse(decryptedBuffer.toString());
  const downloadRes = await api.post(`https://${cdn}/download`, {
    id: idMatch,
    downloadType: 'audio',
    quality: '128',
    key: decrypted.key
  });

  const audioUrl = downloadRes.data?.data?.downloadUrl || downloadRes.data?.downloadUrl;
  if (!audioUrl) throw new Error(`No audio URL from ${cdn}`);

  const head = await axios.get(audioUrl, {
    maxRedirects: 0,
    validateStatus: s => s >= 200 && s < 400,
    timeout: 4000,
    signal
  });

  if (head.status >= 300 && head.status < 400) {
    const loc = head.headers.location || '';
    if (loc.includes('ytshortdown.com') || loc.includes('/home') || !loc.includes('.mp3') && !loc.includes('googlevideo')) {
      throw new Error(`${cdn} redirected to non-audio landing page: ${loc}`);
    }
  }

  return {
    duration: `${Math.floor(decrypted.duration / 60)}:${(decrypted.duration % 60).toString().padStart(2, '0')}`,
    audio: audioUrl,
    cdn
  };
}

async function tryConvert1s(idMatch, signal) {
  const headers = {
    Origin: 'https://media.ytmp3.gg',
    Referer: 'https://media.ytmp3.gg/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Content-Type': 'application/json'
  };

  const res = await axios.post(
    'https://hub.convert1s.com/api/download',
    {
      url: `https://www.youtube.com/watch?v=${idMatch}`,
      os: 'macos',
      output: { type: 'audio', format: 'mp3', quality: '' },
      audio: { bitrate: '128k' }
    },
    { headers, timeout: 8000, signal }
  );

  const conv = res?.data;
  if (!conv || !conv.statusUrl) {
    throw new Error('convert1s: No statusUrl received');
  }

  const durationStr = conv.duration ? `${Math.floor(conv.duration / 60)}:${(conv.duration % 60).toString().padStart(2, '0')}` : null;
  const title = conv.title || null;

  let downloadUrl = null;
  for (let i = 0; i < 8; i++) {
    if (signal?.aborted) throw new Error('convert1s: aborted');
    await new Promise(r => setTimeout(r, 1200));
    try {
      const poll = await axios.get(conv.statusUrl, { headers, timeout: 5000, signal });
      if (poll.data?.status === 'completed' && (poll.data.downloadUrl || poll.data.streamUrl)) {
        downloadUrl = poll.data.downloadUrl || poll.data.streamUrl;
        break;
      }
      if (poll.data?.status === 'error' || poll.data?.status === 'failed') {
        throw new Error('convert1s: conversion failed: ' + (poll.data?.message || 'unknown'));
      }
    } catch (pollErr) {
      if (i >= 7) throw pollErr;
    }
  }

  if (!downloadUrl) {
    throw new Error('convert1s: conversion timed out');
  }

  return {
    duration: durationStr,
    audio: downloadUrl,
    title: title,
    cdn: 'convert1s'
  };
}

async function getDownload(url) {
  const idMatch = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /shorts\/([a-zA-Z0-9_-]{11})/
  ].find(p => p.test(url))?.exec(url)?.[1] || (url.length === 11 ? url : null);

  if (!idMatch) {
    console.error('[EXTRACT] Invalid URL or video ID:', url);
    return null;
  }

  const cached = ytCache.get(idMatch);
  if (cached && cached.expireAt > Date.now()) {
    console.log(`[EXTRACT] Cache hit for video ID: ${idMatch}`);
    return cached.data;
  }

  const fullUrl = 'https://www.youtube.com/watch?v=' + idMatch;
  const controller = new AbortController();

  const cdns = ['cdn405.savetube.vip', 'cdn403.savetube.vip', 'cdn401.savetube.vip'];
  const fallbacks = [
    tryConvert1s(idMatch, controller.signal).catch(err => {
      err.__provider = 'convert1s';
      throw err;
    }),
    tryVidssave(fullUrl, idMatch, controller.signal).catch(err => {
      err.__provider = 'vidssave';
      throw err;
    }),
    tryYtDlp(idMatch, controller.signal).catch(err => {
      err.__provider = 'yt-dlp';
      throw err;
    }),
    ...cdns.map(cdn =>
      trySaveTube(cdn, fullUrl, idMatch, controller.signal).catch(err => {
        err.__provider = cdn;
        throw err;
      })
    )
  ];

  try {
    const result = await Promise.any(fallbacks);
    controller.abort();
    console.log(`[EXTRACT] Winner: ${result.cdn} for ${idMatch}`);
    ytCache.set(idMatch, { data: result, expireAt: Date.now() + CACHE_TTL });
    return result;
  } catch (aggregateErr) {
    const details = (aggregateErr?.errors || []).map(e => `${e.__provider}: ${e.message}`);
    console.error('[EXTRACT] All providers failed:', details.join(' | '));
    const notFoundErr = new Error('All providers failed');
    notFoundErr.__details = details;
    throw notFoundErr;
  }
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ status: false, message: 'Method not allowed' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  const url = (body.query || body.url || '').trim();
  if (!url) { res.status(400).json({ status: false, message: 'Parameter query wajib diisi' }); return; }

  console.log(`[EXTRACT] Starting extraction for: ${url}`);
  const debug = req.query?.debug === '1';

  try {
    let audioData = await getDownload(url);

    if (audioData && audioData.audio) {
      console.log('[EXTRACT] Success');
      return res.status(200).json({
        status: true,
        result: {
          title: audioData.title || null,
          thumbnail: audioData.thumbnail || null,
          duration: audioData.duration || null,
          download: { audio: audioData.audio }
        }
      });
    }
  } catch (err) {
    console.error('[EXTRACT] All providers failed:', err.__details?.join(' | ') || err.message);
    return res.status(200).json({
      status: false,
      clientFallback: true,
      error: 'Datacenter IP restricted by upstream services. Client-side extraction active.',
      ...(debug ? { debug: err.__details || [err.message] } : {})
    });
  }

  console.error('[EXTRACT] All methods failed');
  res.status(200).json({ status: false, clientFallback: true, error: 'Datacenter IP restricted by upstream services. Client-side extraction active.' });
};

module.exports.getDownload = getDownload;
