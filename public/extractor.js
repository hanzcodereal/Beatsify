var ClientExtractor = {
    keys: ['4c9b7d2e'.repeat(3) + '4c9b7d21', '4c9b7d2e'.repeat(3) + '4c9b7d2e', 'rz18efAXUbdiaO7k'],
    auth: '4c9b7d21',
    lastCheck: 0,

    refreshAuth: async function() {
        if (Date.now() - ClientExtractor.lastCheck < 15 * 60 * 1000 && ClientExtractor.auth) return ClientExtractor.auth;
        try {
            var html = await (await fetch('https://vidssave.com/', { cache: 'no-store' })).text();
            var matches = html.match(/src="([^"]*chunk[^"]*\.js)"/g) || [];
            for (var i = 0; i < matches.length; i++) {
                var u = matches[i].replace(/^src="/, '').replace(/"$/, '');
                var full = u.indexOf('http') === 0 ? u : 'https://vidssave.com' + u;
                var text = await (await fetch(full)).text();
                var m = text.match(/auth:"([a-zA-Z0-9_-]{6,32})"/);
                if (m) {
                    ClientExtractor.auth = m[1];
                    ClientExtractor.lastCheck = Date.now();
                    return ClientExtractor.auth;
                }
            }
        } catch (e) {}
        return ClientExtractor.auth;
    },

    decrypt: function(cipher) {
        if (typeof CryptoJS === 'undefined') return null;
        var list = ['4c9b7d2e'.repeat(3) + (ClientExtractor.auth || '4c9b7d21')].concat(ClientExtractor.keys);
        for (var i = 0; i < list.length; i++) {
            try {
                var k = list[i];
                var key = CryptoJS.enc.Utf8.parse(k);
                var iv = CryptoJS.enc.Utf8.parse(k.slice(0, 16));
                var dec = CryptoJS.AES.decrypt(cipher, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.ZeroPadding });
                var text = dec.toString(CryptoJS.enc.Utf8).replace(/\0+$/, '');
                if (text) {
                    var parsed = JSON.parse(text);
                    if (parsed && (parsed.resources || parsed.title)) return parsed;
                }
            } catch (e) {}
        }
        return null;
    },

    extract: async function(videoId, fullUrl, isRetry) {
        var url = fullUrl || 'https://www.youtube.com/watch?v=' + videoId;
        var params = new URLSearchParams({
            hostname: 'vidssave.com',
            auth: ClientExtractor.auth || '4c9b7d21',
            domain: 'api-ak.vidssave.com',
            link: url
        });
        var res = await fetch('https://api.vidssave.com/api/contentsite_api/media/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var raw = await res.json();
        if (!raw || raw.status !== 1 || !raw.data) {
            if (!isRetry) {
                await ClientExtractor.refreshAuth();
                return ClientExtractor.extract(videoId, fullUrl, true);
            }
            throw new Error('parse rejected');
        }
        var parsed = ClientExtractor.decrypt(raw.data);
        if (!parsed) throw new Error('decrypt failed');
        var list = (parsed.resources || []).filter(function(r) { return r.type === 'audio' && r.download_url; });
        if (!list.length) list = (parsed.resources || []).filter(function(r) { return r.download_url; });
        if (!list.length) throw new Error('no audio');
        var order = ['128KBPS', '256KBPS', 'LOW', '48KBPS', '360P', '480P', '720P'];
        list.sort(function(a, b) {
            var ia = order.indexOf(a.quality), ib = order.indexOf(b.quality);
            if (ia === -1) ia = 99;
            if (ib === -1) ib = 99;
            return ia - ib;
        });
        return { title: parsed.title, thumbnail: parsed.thumbnail || null, audioUrl: list[0].download_url };
    }
};
