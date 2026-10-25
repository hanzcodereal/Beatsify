const axios = require('axios');

const cache = new Map();
const MAX_CACHE_SIZE = 5000;

function setCache(key, val) {
    if (cache.size > MAX_CACHE_SIZE) {
        const first = cache.keys().next().value;
        cache.delete(first);
    }
    cache.set(key, val);
}

const CLIENTS = ['dict-chrome-ex', 'at'];

async function translateSingle(text, targetLang = 'id') {
    if (!text || !text.trim()) return '';
    const clean = text.trim();
    if (clean === '• • •' || clean === '...' || /^[\s\d.,!?:;'"()\[\]{}_+\-*\/\\|~`@#$%^&=<>]+$/.test(clean)) {
        return '';
    }

    const cacheKey = `${clean}_${targetLang}`;
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    for (const client of CLIENTS) {
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=${client}&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(clean)}`;
            const res = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept': '*/*'
                },
                timeout: 4000
            });
            if (res.data && Array.isArray(res.data[0])) {
                const trans = res.data[0].map(x => x[0]).filter(Boolean).join('').trim();
                if (trans) {

                    const finalTrans = trans.toLowerCase() === clean.toLowerCase() ? '' : trans;
                    setCache(cacheKey, finalTrans);
                    return finalTrans;
                }
            }
        } catch (e) {

        }
    }

    return '';
}

async function translateBatchGroup(texts, targetLang = 'id') {
    if (!texts || texts.length === 0) return [];
    const joined = texts.join('\n');

    for (const client of CLIENTS) {
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=${client}&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(joined)}`;
            const res = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept': '*/*'
                },
                timeout: 6000
            });
            if (res.data && Array.isArray(res.data[0])) {
                const fullTranslated = res.data[0].map(x => x[0]).filter(Boolean).join('');
                const split = fullTranslated.split('\n');
                if (split.length === texts.length) {
                    return split.map(s => s.trim());
                }
            }
        } catch (e) {}
    }

    const results = [];
    const CHUNK = 5;
    for (let i = 0; i < texts.length; i += CHUNK) {
        const slice = texts.slice(i, i + CHUNK);
        const resolved = await Promise.all(slice.map(t => translateSingle(t, targetLang)));
        results.push(...resolved);
    }
    return results;
}

async function translateLines(lines, targetLang = 'id') {
    if (!lines || !Array.isArray(lines) || lines.length === 0) return lines || [];

    const itemsToTranslate = [];
    const indexMap = [];

    lines.forEach((line, idx) => {
        const orig = (typeof line === 'string' ? line : line.text || '').trim();

        if (!orig || orig === '• • •' || orig === '...' || /^[\s\d.,!?:;'"()\[\]{}_+\-*\/\\|~`@#$%^&=<>]+$/.test(orig)) {
            return;
        }

        const cacheKey = `${orig}_${targetLang}`;
        if (cache.has(cacheKey)) {

            return;
        }

        itemsToTranslate.push(orig);
        indexMap.push(idx);
    });

    const BATCH_SIZE = 25;
    for (let i = 0; i < itemsToTranslate.length; i += BATCH_SIZE) {
        const batchTexts = itemsToTranslate.slice(i, i + BATCH_SIZE);
        const translatedBatch = await translateBatchGroup(batchTexts, targetLang);
        batchTexts.forEach((originalText, bIdx) => {
            const trans = (translatedBatch[bIdx] || '').trim();
            const cacheKey = `${originalText}_${targetLang}`;
            const finalTrans = trans.toLowerCase() === originalText.toLowerCase() ? '' : trans;
            setCache(cacheKey, finalTrans);
        });
    }

    return lines.map((line) => {
        const orig = (typeof line === 'string' ? line : line.text || '').trim();
        const cacheKey = `${orig}_${targetLang}`;
        const trans = cache.get(cacheKey) || '';

        if (typeof line === 'string') {
            return { text: line, translation: trans };
        }
        return { ...line, translation: trans };
    });
}

const handler = async (req, res) => {
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    const query = req.query || {};
    const body = req.body || {};

    const targetLang = query.tl || body.targetLang || 'id';
    let text = query.text || query.q || body.text;
    let lines = body.lines;

    if (!text && !lines) {
        return res.status(400).json({ status: false, message: 'Parameter text, q, atau lines wajib diisi' });
    }

    try {
        if (lines && Array.isArray(lines)) {
            const translatedLines = await translateLines(lines, targetLang);
            return res.status(200).json({ status: true, result: { lines: translatedLines } });
        } else if (text) {
            const translatedText = await translateSingle(text, targetLang);
            return res.status(200).json({ status: true, result: { original: text, translated: translatedText, targetLang } });
        }
    } catch (e) {
        return res.status(500).json({ status: false, message: 'Gagal menerjemahkan: ' + e.message });
    }
};

handler.translateText = translateSingle;
handler.translateLines = translateLines;

module.exports = handler;
