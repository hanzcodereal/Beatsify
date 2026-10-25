const { getLyrics1, isTranslateRequested } = require('./lyrics1.js');
const { getLyrics2 } = require('../lib/lyrics2.js');

const lyricsCache = new Map();
const CACHE_TTL = 2 * 60 * 60 * 1000;

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'GET') { res.status(405).json({ status: false, message: 'Method not allowed' }); return; }
    const videoId = (req.query.id || req.body?.id || '').trim();
    const title = (req.query.title || req.body?.title || '').trim();
    const artist = (req.query.artist || req.body?.artist || '').trim();
    if (!videoId) { res.status(400).json({ status: false, message: 'Parameter id wajib diisi' }); return; }

    const translate = isTranslateRequested(req);
    const cacheKey = videoId + (translate ? ':t' : '');
    const cached = lyricsCache.get(cacheKey);
    if (cached && cached.expireAt > Date.now()) {
        return res.status(200).json(cached.data);
    }

    try {

        const data1 = await getLyrics1(videoId, title, artist, translate).catch(() => null);
        if (data1 && data1.lyrics && data1.lyrics.lines && data1.lyrics.lines.length > 0) {
            const payload = {
                status: true,
                input: { id: videoId },
                result: {
                    videoId,
                    title: data1.title || '',
                    artist: data1.artist || '',
                    album: data1.album || '',
                    source: 'lyrics1',
                    lyrics: data1.lyrics
                }
            };
            lyricsCache.set(cacheKey, { data: payload, expireAt: Date.now() + CACHE_TTL });
            res.status(200).json(payload);
            return;
        }

        const data2 = await getLyrics2(videoId, translate).catch(() => null);
        if (data2 && data2.lyrics && data2.lyrics.lines && data2.lyrics.lines.length > 0) {
            res.status(200).json({
                status: true,
                input: { id: videoId },
                result: {
                    videoId,
                    title: data2.title || data1?.title || '',
                    artist: data2.artist || data1?.artist || '',
                    album: data1?.album || '',
                    source: 'lyrics2',
                    lyrics: data2.lyrics
                }
            });
            return;
        }

        res.status(200).json({
            status: true,
            input: { id: videoId },
            result: {
                videoId,
                title: data1?.title || '',
                artist: data1?.artist || '',
                album: data1?.album || '',
                source: 'none',
                lyrics: { type: 'none', lines: [] }
            }
        });
    } catch(e) {
        res.status(500).json({ status: false, message: 'Gagal: ' + e.message });
    }
};
