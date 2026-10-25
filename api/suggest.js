const https = require('https');

async function fetchGoogleSuggest(client, query) {
    return new Promise((resolve, reject) => {
        const req = https.get({
            hostname: 'suggestqueries.google.com',
            path: `/complete/search?client=${client}&ds=yt&hl=id&gl=ID&q=${encodeURIComponent(query)}`,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
                'Accept': 'application/json, text/javascript, */*'
            },
            rejectUnauthorized: false,
            timeout: 6000
        }, res => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'GET') { res.status(405).json({ status: false, message: 'Method not allowed' }); return; }
    const query = (req.query.q || req.query.query || '').trim();
    if (!query) { return res.status(200).json([]); }

    try {
        let raw = await fetchGoogleSuggest('firefox', query);
        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (e) {
            raw = await fetchGoogleSuggest('chrome', query);
            const cleaned = raw.replace(/^window\.google\.ac\.h\(/, '').replace(/\)$/, '');
            parsed = JSON.parse(cleaned);
        }

        let suggestions = [];
        if (Array.isArray(parsed) && Array.isArray(parsed[1])) {
            suggestions = parsed[1].map(item => (typeof item === 'string' ? item : item?.[0])).filter(Boolean);
        }

        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.status(200).json(suggestions);
    } catch(e) {
        res.status(200).json([]);
    }
};
