const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function loadAdminConfig() {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'admin.json'), 'utf8');
    return JSON.parse(raw);
}

function base64url(input) {
    return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(input) {
    input = input.replace(/-/g, '+').replace(/_/g, '/');
    while (input.length % 4) input += '=';
    return Buffer.from(input, 'base64').toString('utf8');
}

const TOKEN_TTL_SECONDS = 12 * 60 * 60; // 12 jam

function signAdminToken(username, secret) {
    const payload = { u: username, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS };
    const payloadStr = base64url(JSON.stringify(payload));
    const sig = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
    return payloadStr + '.' + sig;
}

function verifyAdminToken(token, secret) {
    if (!token || typeof token !== 'string' || token.indexOf('.') === -1) return null;
    const [payloadStr, sig] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
    const sigBuf = Buffer.from(sig || '', 'hex');
    const expBuf = Buffer.from(expectedSig, 'hex');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
    let payload;
    try { payload = JSON.parse(base64urlDecode(payloadStr)); } catch (e) { return null; }
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
}

function requireAdmin(req) {
    const cfg = loadAdminConfig();
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const payload = verifyAdminToken(token, cfg.jwtSecret);
    return !!payload;
}

module.exports = { loadAdminConfig, signAdminToken, verifyAdminToken, requireAdmin };
