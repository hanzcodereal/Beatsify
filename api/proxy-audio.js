const https = require('https');
const http = require('http');
const dns = require('dns').promises;
const net = require('net');

const MAX_REDIRECTS = 5;

// Blokir alamat internal/privat supaya proxy tidak bisa dipakai untuk mengakses jaringan dalam (SSRF).
function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127);
  }
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase();
    if (l === '::1' || l === '::') return true;
    if (l.startsWith('fc') || l.startsWith('fd') || l.startsWith('fe80')) return true;
    const mapped = l.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
  }
  return false;
}

async function assertSafeUrl(rawUrl) {
  let parsed;
  try { parsed = new URL(rawUrl); } catch (e) { throw new Error('URL tidak valid'); }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('Protokol tidak diizinkan');
  const host = parsed.hostname.replace(/^\[|\]$/g, '');
  if (!host || host === 'localhost') throw new Error('Host tidak diizinkan');
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error('Host tidak diizinkan');
  } else {
    const addrs = await dns.lookup(host, { all: true });
    if (!addrs.length || addrs.some(a => isPrivateIp(a.address))) throw new Error('Host tidak diizinkan');
  }
  return parsed;
}

async function pipeAudioUrl(targetUrl, reqHeaders, res, depth = 0) {
  if (depth > MAX_REDIRECTS) {
    if (!res.headersSent) res.status(508).send('Too many redirects');
    return;
  }
  let parsed;
  try {
    parsed = await assertSafeUrl(targetUrl);
  } catch (err) {
    if (!res.headersSent) res.status(400).send(err.message);
    return;
  }

  const client = parsed.protocol === 'https:' ? https : http;
  const upstream = client.get(parsed.href, { headers: reqHeaders, timeout: 20000 }, (targetRes) => {
    const code = targetRes.statusCode || 200;
    if (code >= 300 && code < 400 && targetRes.headers.location) {
      targetRes.resume();
      let redirectUrl;
      try { redirectUrl = new URL(targetRes.headers.location, parsed.href).href; }
      catch (e) { if (!res.headersSent) res.status(502).send('Redirect tidak valid'); return; }
      pipeAudioUrl(redirectUrl, reqHeaders, res, depth + 1);
      return;
    }

    res.status(code);
    ['content-type', 'content-length', 'accept-ranges', 'content-range'].forEach(h => {
      if (targetRes.headers[h]) res.setHeader(h, targetRes.headers[h]);
    });
    if (!res.getHeader('accept-ranges')) res.setHeader('Accept-Ranges', 'bytes');
    targetRes.pipe(res);
    targetRes.on('error', () => { try { res.end(); } catch (e) {} });
  });

  upstream.on('timeout', () => upstream.destroy(new Error('Upstream timeout')));
  upstream.on('error', (err) => {
    if (!res.headersSent) res.status(502).send('Proxy error: ' + err.message);
    else { try { res.end(); } catch (e) {} }
  });
  // Hentikan unduhan upstream jika pemutar menutup koneksi (mis. ganti lagu)
  res.on('close', () => { if (!res.writableEnded) upstream.destroy(); });
}

module.exports = async (req, res) => {
  const targetUrl = req.query.url;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (!targetUrl) {
    res.status(400).send('Missing url parameter');
    return;
  }

  const reqHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/149.0.0.0 Safari/537.36'
  };
  // Jangan kirim header Range kosong — beberapa server menolaknya.
  if (req.headers.range) reqHeaders['Range'] = req.headers.range;

  pipeAudioUrl(String(targetUrl), reqHeaders, res);
};
