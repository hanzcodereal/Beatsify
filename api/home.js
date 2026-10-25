const axios = require('axios');

function toHDThumbnail(url, videoId) {
    if (!url && videoId) return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    if (!url) return '';
    let hd = String(url);
    if (hd.includes('googleusercontent.com') || hd.includes('ggpht.com') || hd.includes('ytimg.com')) {
        if (/=w\d+-h\d+/i.test(hd)) hd = hd.replace(/=w\d+-h\d+[^?#]*/i, '=w800-h800-l90-rj');
        else if (/=s\d+/i.test(hd)) hd = hd.replace(/=s\d+[^?#]*/i, '=s800-c-k-c0x00ffffff-no-rj');
        else if (/=w\d+/i.test(hd)) hd = hd.replace(/=w\d+[^?#]*/i, '=w800-h800-l90-rj');
    }
    if (hd.includes('i.ytimg.com/vi/') || hd.includes('img.youtube.com/vi/')) {
        hd = hd.split('?')[0];
        hd = hd.replace(/(hqdefault|mqdefault|sddefault|default)\.jpg/i, 'hqdefault.jpg');
    }
    return hd;
}

function parseItem(item) {
    if (!item) return null;
    if (item.musicResponsiveListItemRenderer) {
        const r = item.musicResponsiveListItemRenderer;
        const cols = r.flexColumns || [];
        const titleRuns = cols[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
        const title = titleRuns.map(x => x.text).join('');
        const subRuns = cols[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
        const subtitle = subRuns.map(x => x.text).join('');

        let artist = '', artistId = '', album = '', albumId = '', duration = '';
        for (const run of subRuns) {
            const bId = run?.navigationEndpoint?.browseEndpoint?.browseId || '';
            if (bId.startsWith('UC')) {
                artist = run.text;
                artistId = bId;
            } else if (bId.startsWith('MPRE')) {
                album = run.text;
                albumId = bId;
            }
        }
        if (!artist && subRuns.length > 0) {
            artist = subRuns[0].text;
        }

        const videoId = r.playlistItemData?.videoId ||
            r.navigationEndpoint?.watchEndpoint?.videoId ||
            titleRuns[0]?.navigationEndpoint?.watchEndpoint?.videoId || '';

        const thumbs = r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
        const rawThumb = thumbs.length ? thumbs[thumbs.length - 1].url : '';
        const cover = toHDThumbnail(rawThumb, videoId);

        const durCol = cols[2]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
        if (durCol.length > 0) {
            duration = durCol.map(x => x.text).join('');
        }

        return {
            type: 'song',
            id: videoId,
            videoId: videoId,
            title: title.trim(),
            artist: artist.trim(),
            artistId,
            album,
            albumId,
            duration,
            subtitle: subtitle.trim(),
            cover,
            url: videoId ? `https://music.youtube.com/watch?v=${videoId}` : ''
        };
    } else if (item.musicTwoRowItemRenderer) {
        const r = item.musicTwoRowItemRenderer;
        const title = (r.title?.runs || []).map(x => x.text).join('');
        const subtitle = (r.subtitle?.runs || []).map(x => x.text).join('');
        const browseId = r.navigationEndpoint?.browseEndpoint?.browseId ||
            r.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '';
        const videoId = r.navigationEndpoint?.watchEndpoint?.videoId || '';

        const thumbs = r.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
            r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
        const rawThumb = thumbs.length ? thumbs[thumbs.length - 1].url : '';
        const cover = toHDThumbnail(rawThumb, videoId);

        let itemType = 'playlist';
        if (browseId.startsWith('UC')) itemType = 'artist';
        else if (browseId.startsWith('MPRE') || /album|single|ep/i.test(subtitle)) itemType = 'album';
        else if (videoId) itemType = 'song';

        return {
            type: itemType,
            id: browseId || videoId,
            videoId: videoId,
            browseId,
            title: title.trim(),
            subtitle: subtitle.trim(),
            artist: subtitle.split('•')[0]?.trim() || subtitle,
            cover,
            url: videoId ? `https://music.youtube.com/watch?v=${videoId}` : ''
        };
    }
    return null;
}

let cachedHome = null;
let lastCacheTime = 0;
const CACHE_TTL = 15 * 60 * 1000;

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') {
        if (res.status) return res.status(200).send('OK');
        return;
    }

    const now = Date.now();
    const forceRefresh = req.query.refresh === '1';

    if (!forceRefresh && cachedHome && (now - lastCacheTime < CACHE_TTL)) {
        return res.json({
            status: true,
            origin: 'ID (Indonesia)',
            cached: true,
            result: cachedHome
        });
    }

    try {
        const payload = {
            context: {
                client: { clientName: 'WEB_REMIX', clientVersion: '1.20240101.00.00', hl: 'id', gl: 'ID' }
            }
        };
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Origin': 'https://music.youtube.com'
        };

        const [homeRes, exploreRes, chartRes] = await Promise.all([
            axios.post('https://music.youtube.com/youtubei/v1/browse?prettyPrint=false', { ...payload, browseId: 'FEmusic_home' }, { headers, timeout: 12000 }).catch(err => {
                console.error('Home browse error:', err.message);
                return null;
            }),
            axios.post('https://music.youtube.com/youtubei/v1/browse?prettyPrint=false', { ...payload, browseId: 'FEmusic_explore' }, { headers, timeout: 12000 }).catch(err => {
                console.error('Explore browse error:', err.message);
                return null;
            }),
            axios.post('https://music.youtube.com/youtubei/v1/browse?prettyPrint=false', { ...payload, browseId: 'FEmusic_charts' }, { headers, timeout: 12000 }).catch(err => {
                console.error('Charts browse error:', err.message);
                return null;
            })
        ]);

        const quickPicks = [];
        const playlists = [];
        const trending = [];
        const albums = [];
        const artists = [];
        const chartPlaylists = [];

        const homeSections = homeRes?.data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
        for (const sec of homeSections) {
            const shelf = sec.musicCarouselShelfRenderer;
            if (!shelf) continue;
            const items = (shelf.contents || []).map(parseItem).filter(Boolean);
            for (const it of items) {
                if (it.type === 'song' && it.videoId) {
                    if (!quickPicks.some(x => x.videoId === it.videoId)) quickPicks.push(it);
                } else if (it.type === 'playlist') {
                    if (!playlists.some(x => x.id === it.id)) playlists.push(it);
                }
            }
        }

        const expSections = exploreRes?.data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
        for (const sec of expSections) {
            const shelf = sec.musicCarouselShelfRenderer;
            if (!shelf) continue;
            const title = (shelf.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.map(r => r.text).join('') || '').toLowerCase();
            const items = (shelf.contents || []).map(parseItem).filter(Boolean);
            if (title.includes('trending') || title.includes('populer')) {
                for (const it of items) {
                    if (it.videoId && !trending.some(x => x.videoId === it.videoId)) trending.push(it);
                }
            } else if (title.includes('album') || title.includes('single') || title.includes('terbaru')) {
                for (const it of items) {
                    if (!albums.some(x => x.id === it.id)) albums.push(it);
                }
            }
        }

        const chartSections = chartRes?.data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
        for (const sec of chartSections) {
            const shelf = sec.musicCarouselShelfRenderer;
            if (!shelf) continue;
            const title = (shelf.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.map(r => r.text).join('') || '').toLowerCase();

            if (title.includes('tangga lagu') || title.includes('chart')) {
                const chartItems = (shelf.contents || []).map(parseItem).filter(Boolean);
                for (const it of chartItems) {
                    if (!chartPlaylists.some(x => x.id === it.id)) chartPlaylists.push(it);
                }
            } else if (title.includes('artis')) {
                for (const it of shelf.contents || []) {
                    const r = it.musicResponsiveListItemRenderer;
                    if (!r) continue;
                    const aTitle = r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.map(x => x.text).join('') || '';
                    const aSub = r.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.map(x => x.text).join('') || '';
                    const aBrowseId = r.navigationEndpoint?.browseEndpoint?.browseId || '';
                    const aThumbs = r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
                    const aRawThumb = aThumbs[aThumbs.length - 1]?.url || '';
                    const aRank = r.customIndexColumn?.musicCustomIndexColumnRenderer?.text?.runs?.[0]?.text || '';
                    if (aTitle && aBrowseId) {
                        artists.push({
                            id: aBrowseId,
                            title: aTitle.trim(),
                            artist: aSub.trim(),
                            rank: aRank,
                            cover: toHDThumbnail(aRawThumb)
                        });
                    }
                }
            }
        }

        const resultData = {
            quickPicks,
            trending: trending.length > 0 ? trending : quickPicks.slice(0, 10),
            playlists: [...chartPlaylists, ...playlists],
            albums,
            artists
        };

        cachedHome = resultData;
        lastCacheTime = now;

        return res.json({
            status: true,
            origin: 'ID (Indonesia)',
            cached: false,
            result: resultData
        });

    } catch (err) {
        console.error('Home API scrape error:', err);
        if (cachedHome) {
            return res.json({
                status: true,
                origin: 'ID (Indonesia)',
                cached: true,
                fallback: true,
                result: cachedHome
            });
        }
        return res.status(500).json({ status: false, message: err.message });
    }
};
