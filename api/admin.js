const { requireAdmin, loadAdminConfig, signAdminToken } = require('../lib/adminAuth.js');
const { SUPABASE_URL, SUPABASE_KEY } = require('../lib/supabaseConfig.js');

async function handleLogin(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ status: false, message: 'Method not allowed' });

    try {
        const body = req.body || {};
        const username = (body.username || '').trim();
        const password = body.password || '';

        if (!username || !password) {
            return res.status(400).json({ status: false, message: 'Username dan password wajib diisi' });
        }

        const cfg = loadAdminConfig();
        if (username !== cfg.username || password !== cfg.password) {
            return res.status(401).json({ status: false, message: 'Username atau password admin salah' });
        }

        const token = signAdminToken(username, cfg.jwtSecret);
        return res.status(200).json({ status: true, token: token });
    } catch (err) {
        return res.status(500).json({ status: false, message: 'Gagal login: ' + err.message });
    }
}

async function handleStats(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ status: false, message: 'Method not allowed' });
    if (!requireAdmin(req)) return res.status(401).json({ status: false, message: 'Tidak terautentikasi' });

    try {
        const r = await fetch(SUPABASE_URL + '/rest/v1/profiles?select=id', {
            method: 'GET',
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: 'Bearer ' + SUPABASE_KEY,
                Prefer: 'count=exact',
                Range: '0-0'
            }
        });

        if (!r.ok) {
            const t = await r.text();
            return res.status(502).json({ status: false, message: 'Gagal mengambil data dari Supabase: ' + t });
        }

        const contentRange = r.headers.get('content-range') || '0/0';
        const total = parseInt(contentRange.split('/')[1], 10) || 0;

        return res.status(200).json({ status: true, totalAccounts: total });
    } catch (err) {
        return res.status(500).json({ status: false, message: 'Gagal mengambil statistik: ' + err.message });
    }
}

async function handleInfo(req, res) {
    if (!requireAdmin(req)) return res.status(401).json({ status: false, message: 'Tidak terautentikasi' });

    if (req.method === 'POST') {
        try {
            const body = req.body || {};
            const title = (body.title || '').trim();
            const content = (body.content || '').trim();
            if (!title) return res.status(400).json({ status: false, message: 'Judul informasi wajib diisi' });

            const r = await fetch(SUPABASE_URL + '/rest/v1/app_info', {
                method: 'POST',
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: 'Bearer ' + SUPABASE_KEY,
                    'Content-Type': 'application/json',
                    Prefer: 'return=representation'
                },
                body: JSON.stringify({ title: title, content: content })
            });

            if (!r.ok) {
                const t = await r.text();
                return res.status(502).json({ status: false, message: 'Gagal menambah informasi: ' + t });
            }
            const data = await r.json();
            return res.status(200).json({ status: true, result: data });
        } catch (err) {
            return res.status(500).json({ status: false, message: 'Gagal menambah informasi: ' + err.message });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const id = (req.query && req.query.id) || (req.body && req.body.id);
            if (!id) return res.status(400).json({ status: false, message: 'id informasi wajib diisi' });

            const r = await fetch(SUPABASE_URL + '/rest/v1/app_info?id=eq.' + encodeURIComponent(id), {
                method: 'DELETE',
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: 'Bearer ' + SUPABASE_KEY
                }
            });

            if (!r.ok) {
                const t = await r.text();
                return res.status(502).json({ status: false, message: 'Gagal menghapus informasi: ' + t });
            }
            return res.status(200).json({ status: true });
        } catch (err) {
            return res.status(500).json({ status: false, message: 'Gagal menghapus informasi: ' + err.message });
        }
    }

    return res.status(405).json({ status: false, message: 'Method not allowed' });
}

module.exports = async (req, res) => {
    const action = (req.query && req.query.action) || '';

    if (action === 'login') return handleLogin(req, res);
    if (action === 'stats') return handleStats(req, res);
    if (action === 'info') return handleInfo(req, res);

    return res.status(400).json({ status: false, message: 'Aksi admin tidak dikenali' });
};
