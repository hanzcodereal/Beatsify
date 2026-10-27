var Home = {
    activeCategory: null,
    loadingCategory: false,
    categories: [
        { name: 'Semua' },
        { name: 'Chill', icon: 'coffee' },
        { name: 'Focus', icon: 'brain' },
        { name: 'Commute', icon: 'car' },
        { name: 'Gaming', icon: 'gamepad-2' },
        { name: 'Energize', icon: 'zap' },
        { name: 'Party', icon: 'party-popper' },
        { name: 'Feel good', icon: 'smile' },
        { name: 'Romance', icon: 'heart' },
        { name: 'Workout', icon: 'dumbbell' },
        { name: 'Sleep', icon: 'moon' },
        { name: 'Sad', icon: 'cloud-rain' },
        { name: 'Happy', icon: 'sun' },
        { name: 'Nostalgia', icon: 'disc' },
        { name: 'Acoustic', icon: 'guitar' },
        { name: 'Pop', icon: 'music' },
        { name: 'Rock', icon: 'flame' }
    ],

    updateGreeting() {
        var el = gid('home-greeting');
        if (!el) return;
        var h = new Date().getHours();
        var salam = h < 10 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam';
        var name = (typeof Auth !== 'undefined' && Auth.getDisplayName) ? Auth.getDisplayName() : null;
        el.textContent = name ? (salam + ', ' + name + '!') : (salam + '! Rekomendasi musik buat kamu');
    },

    render() {
        var chipsHtml = Home.categories.map(function(c) {
            var isActive = (Home.activeCategory === c.name) || (!Home.activeCategory && c.name === 'Semua');
            var btnStyle = isActive
                ? 'bg-white text-black font-extrabold shadow-white/20 border border-white scale-105'
                : 'glass text-[#a0a5b0] hover:text-white hover:bg-white/10 border border-[#2a2a2a] font-medium';
            return '<button onclick="Home.selectCategory(\'' + c.name + '\')" class="home-chip-btn px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all duration-500 ease-out flex items-center gap-1.5 cursor-pointer shrink-0 ' + btnStyle + '">' +
                (c.icon ? '<i data-lucide="' + c.icon + '" class="w-3.5 h-3.5"></i>' : '') +
                '<span>' + es(c.name) + '</span>' +
            '</button>';
        }).join('');

        gid('view-home').innerHTML = `
        <div class="glass-pane border-b border-[#2a2a2a] pt-12 pb-3 px-4 sticky top-0 z-20 bg-[#000000]/90">
            <div class="flex justify-between items-center mb-1">
                <div>
                    <h1 class="text-2xl md:text-3xl font-black chrome-text">Beatsify</h1>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="Info.open()" class="glass glass-hover rounded-full p-2.5 text-[#b3b3b3] hover:text-white active:scale-90 transition-all" title="Informasi">
                        <i data-lucide="megaphone" class="w-4 h-4"></i>
                    </button>
                    <button onclick="Home.refresh()" class="glass glass-hover rounded-full p-2.5 text-[#b3b3b3] hover:text-white active:scale-90 transition-all" title="Muat Ulang">
                        <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <p id="home-greeting" class="text-[#b3b3b3] text-xs mb-3"></p>
            <div id="home-category-bar" class="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 py-1 scroll-smooth">
                ${chipsHtml}
            </div>
        </div>
        <div class="px-4 mt-4" id="home-main-content">
            <div id="home-default-view">
                <div class="space-y-6">
                    <div>
                        <h2 class="text-base font-bold mb-3 flex items-center gap-2">
                            <span class="w-1.5 h-4 bg-white/90 rounded-full inline-block"></span>
                            <span class="chrome-text">Pilihan Cepat</span>
                        </h2>
                        <div id="home-grid" class="grid grid-cols-2 md:grid-cols-4 gap-3"></div>
                    </div>
                    <div id="home-trending-wrap">
                        <h2 class="text-base font-bold mb-3 flex items-center gap-2">
                            <span class="w-1.5 h-4 bg-white/90 rounded-full inline-block"></span>
                            <span class="chrome-text">Trending di Indonesia</span>
                        </h2>
                        <div id="home-trending" class="grid grid-cols-1 md:grid-cols-2 gap-2.5"></div>
                    </div>
                    <div>
                        <h2 class="text-base font-bold mb-3 flex items-center gap-2">
                            <span class="w-1.5 h-4 bg-white/90 rounded-full inline-block"></span>
                            <span class="chrome-text">Hits & Playlist Indonesia</span>
                        </h2>
                        <div id="home-scroll" class="flex gap-4 overflow-x-auto hide-scrollbar pb-4"></div>
                    </div>
                    <div id="home-albums-wrap">
                        <h2 class="text-base font-bold mb-3 flex items-center gap-2">
                            <span class="w-1.5 h-4 bg-white/90 rounded-full inline-block"></span>
                            <span class="chrome-text">Album & Singgel Terbaru</span>
                        </h2>
                        <div id="home-albums" class="flex gap-4 overflow-x-auto hide-scrollbar pb-4"></div>
                    </div>
                    <div>
                        <h2 class="text-base font-bold mb-3 flex items-center gap-2">
                            <span class="w-1.5 h-4 bg-white/90 rounded-full inline-block"></span>
                            <span class="chrome-text">Artis Teratas</span>
                        </h2>
                        <div id="home-artists" class="flex gap-4 overflow-x-auto hide-scrollbar pb-4"></div>
                    </div>
                </div>
            </div>
            <div id="home-category-view" style="display:none;"></div>
        </div>`;

        lucide.createIcons();
        Home.updateGreeting();

        if (Home.activeCategory && Home.activeCategory !== 'Semua') {
            Home.displayCategoryView();
        } else {
            var defView = gid('home-default-view'), catView = gid('home-category-view');
            if (defView) defView.style.display = 'block';
            if (catView) catView.style.display = 'none';
            if (S.ht && S.ht.length > 0) {
                Home.show();
            } else {
                Home.showSkeleton();
                Home.fetch();
            }
        }
    },

    selectCategory(catName) {
        if (Home.activeCategory === catName && catName !== 'Semua') {
            catName = 'Semua';
        }

        if (!catName || catName === 'Semua') {
            Home.activeCategory = null;
            var bar = gid('home-category-bar');
            if (bar) {
                bar.querySelectorAll('.home-chip-btn').forEach(function(btn, i) {
                    var c = Home.categories[i];
                    var isAct = (c && c.name === 'Semua');
                    btn.className = 'home-chip-btn px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 ' + (isAct
                        ? 'bg-white text-black font-extrabold shadow-white/20 border border-white scale-105'
                        : 'glass text-[#a0a5b0] hover:text-white hover:bg-white/10 border border-[#2a2a2a] font-medium');
                });
            }
            var defView = gid('home-default-view'), catView = gid('home-category-view');
            if (defView) defView.style.display = 'block';
            if (catView) catView.style.display = 'none';
            if (!S.ht || S.ht.length === 0) Home.fetch();
            else Home.show();
            return;
        }

        Home.activeCategory = catName;

        var bar = gid('home-category-bar');
        if (bar) {
            bar.querySelectorAll('.home-chip-btn').forEach(function(btn, i) {
                var c = Home.categories[i];
                var isAct = (c && c.name === catName);
                btn.className = 'home-chip-btn px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 ' + (isAct
                    ? 'bg-white text-black font-extrabold shadow-white/20 border border-white scale-105'
                    : 'glass text-[#a0a5b0] hover:text-white hover:bg-white/10 border border-[#2a2a2a] font-medium');
            });
        }

        Home.fetchCategoryData(catName);
    },

    _catReq: 0,
    async fetchCategoryData(catName) {
        var reqId = ++Home._catReq;
        var defView = gid('home-default-view'), catView = gid('home-category-view');
        if (defView) defView.style.display = 'none';
        if (catView) {
            catView.style.display = 'block';
            catView.innerHTML = `
            <div class="mb-4 flex justify-between items-center bg-white/5 p-3.5 rounded-2xl border border-[#333333] animate-pulse">
                <div class="flex items-center gap-2">
                    <span class="text-xs text-[#a0a5b0]">Kategori:</span>
                    <span class="font-bold text-sm text-white">${es(catName)}</span>
                </div>
                <button onclick="Home.selectCategory('Semua')" class="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#b3b3b3] hover:text-white transition-all flex items-center gap-1">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i> Reset
                </button>
            </div>
            <div class="text-center py-12">
                <div class="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p class="text-xs text-[#a0a5b0] animate-pulse">Memuat musik ${es(catName)}...</p>
            </div>`;
            lucide.createIcons();
        }

        var query = catName + ' Music';
        if (catName === 'Acoustic') query = 'Acoustic Songs Hits';
        else if (catName === 'Chill') query = 'Chill Vibes Lofi Songs';
        else if (catName === 'Focus') query = 'Focus Deep Work Music';
        else if (catName === 'Commute') query = 'Driving Roadtrip Music';
        else if (catName === 'Gaming') query = 'Gaming EDM Hype Songs';
        else if (catName === 'Energize') query = 'Energetic Workout Beats';
        else if (catName === 'Party') query = 'Party Dance Hits';
        else if (catName === 'Feel good') query = 'Feel Good Happy Songs';
        else if (catName === 'Romance') query = 'Romantic Love Songs';
        else if (catName === 'Workout') query = 'Gym Workout Motivation Music';
        else if (catName === 'Sleep') query = 'Sleeping Calming Relaxation Music';
        else if (catName === 'Sad') query = 'Sad Melancholic Songs';
        else if (catName === 'Happy') query = 'Upbeat Happy Songs';
        else if (catName === 'Nostalgia') query = '2000s Hits Nostalgia Songs';

        try {
            var r = await fetch(API.search + '?query=' + encodeURIComponent(query) + '&type=all');
            var d = await r.json();
            if (d.status) {
                S.hc = d.result.songs ? d.result.songs.map(function(s) {
                    return {
                        id: s.videoId,
                        videoId: s.videoId,
                        title: cn(s.title),
                        artist: cn(s.artist),
                        artistId: s.artistId || '',
                        cover: toHDCover(s.thumbnail, s.videoId),
                        ytUrl: s.url
                    };
                }) : [];
                S.hcp = [].concat(d.result.playlists || []).concat(d.result.albums || []);
                S.hca = d.result.artists || [];
            }
        } catch(e) { if (reqId === Home._catReq) { S.hc = []; S.hcp = []; S.hca = []; } }

        if (reqId !== Home._catReq || Home.activeCategory !== catName) return;
        Home.displayCategoryView();
    },

    displayCategoryView() {
        var defView = gid('home-default-view'), catView = gid('home-category-view');
        if (defView) defView.style.display = 'none';
        if (catView) catView.style.display = 'block';
        if (!catView) return;

        var catName = Home.activeCategory || 'Kategori';

        var songsHtml = '';
        if (S.hc && S.hc.length > 0) {
            songsHtml = S.hc.map(function(t, i) {
                var isCur = S.ct && (
                    S.ct.id === t.id ||
                    S.ct.videoId === t.id ||
                    (S.ct.id && t.videoId && S.ct.id === t.videoId) ||
                    (S.ct.videoId && t.id && S.ct.videoId === t.id) ||
                    (S.ct.title === t.title && S.ct.artist === t.artist)
                );
                var isPlay = isCur && S.ip;
                var isLoad = isCur && S.il;

                var playIconHtml = '';
                if (isLoad) {
                    playIconHtml = '<div class="w-7 h-7 rounded-full btn-chrome flex items-center justify-center shrink-0 ml-auto"><div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
                } else if (isPlay) {
                    playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto shadow-white/30 ring-2 ring-white scale-105"><div class="flex items-end justify-center gap-[2px] w-3.5 h-3.5 pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
                } else if (isCur) {
                    playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto border border-white"><i data-lucide="pause" class="w-3.5 h-3.5 fill-current"></i></div>';
                } else {
                    playIconHtml = '<div class="w-7 h-7 rounded-full bg-white/5 group-hover:bg-white/20 flex items-center justify-center shrink-0 ml-auto text-white transition-all"><i data-lucide="play" class="w-3.5 h-3.5 fill-current ml-0.5"></i></div>';
                }

                var cardBg = isPlay ? 'bg-white/15 border border-[#4a4a4a] shadow-white/5' : (isCur ? 'bg-white/10 border border-[#3f3f3f]' : 'glass glass-hover');

                return '<div onclick="PK(\'homecat\','+i+')" class="home-cat-card group '+cardBg+' rounded-xl flex items-center gap-3 p-2.5 cursor-pointer active:scale-95 transition-all animate-card-up" style="animation-delay:'+Math.min(i*30, 450)+'ms">'+
                    '<img src="'+t.cover+'" class="w-12 h-12 rounded-lg object-cover shadow-md shrink-0" onerror="this.src=\''+FI+'\'" />'+
                    '<div class="truncate flex-1 min-w-0"><h3 class="font-bold text-sm truncate '+(isCur?'text-white font-black':'text-white/90')+'">'+es(t.title)+'</h3><p class="text-[#a0a5b0] text-xs truncate mt-0.5">'+es(t.artist)+'</p></div>'+
                    '<div class="ml-auto">'+playIconHtml+'</div>'+
                '</div>';
            }).join('');
        } else {
            songsHtml = '<p class="text-center text-white/70 text-sm py-8 col-span-2">Tidak ada lagu ditemukan untuk kategori ini</p>';
        }

        var plistHtml = '';
        if (S.hcp && S.hcp.length > 0) {
            plistHtml = S.hcp.slice(0, 10).map(function(p, i) {
                return '<div onclick="Album.open(\''+esJs(p.id)+'\', \''+esJs(p.cover||FI)+'\')" class="flex-shrink-0 w-36 cursor-pointer active:scale-95 animate-card-left" style="animation-delay:'+Math.min(i*40, 400)+'ms"><div class="w-36 h-36 mb-2 relative rounded-xl overflow-hidden glass-edge "><img src="'+(p.cover||FI)+'" class="w-full h-full object-cover" onerror="this.src=\''+FI+'\'" /></div><h3 class="font-semibold text-xs truncate">'+es(p.title)+'</h3><p class="text-white/70 text-[10px] truncate mt-0.5">'+es(p.artist)+'</p></div>';
            }).join('');
        }

        var artistsHtml = '';
        if (S.hca && S.hca.length > 0) {
            artistsHtml = S.hca.slice(0, 8).map(function(p, i) {
                return '<div onclick="Artist.open(\''+esJs(p.id)+'\', \''+esJs(p.name||p.title)+'\')" class="flex-shrink-0 w-28 cursor-pointer active:scale-95 animate-card-left" style="animation-delay:'+Math.min(i*40, 400)+'ms"><div class="w-28 h-28 mb-2 relative rounded-full overflow-hidden glass-edge "><img src="'+(p.cover||FI)+'" class="w-full h-full object-cover" onerror="this.src=\''+FI+'\'" /></div><h3 class="font-semibold text-center text-xs truncate">'+es(p.name||p.title)+'</h3></div>';
            }).join('');
        }

        catView.innerHTML = `
        <div class="space-y-6 pb-6 animate-card-up">
            <div class="flex justify-between items-center bg-white/5 p-3.5 rounded-2xl border border-[#333333]">
                <div class="flex items-center gap-2">
                    <span class="text-xs text-[#a0a5b0]">Kategori:</span>
                    <span class="font-bold text-sm text-white bg-white/10 px-3 py-1 rounded-full border border-[#3a3a3a]">${es(catName)}</span>
                </div>
                <button onclick="Home.selectCategory('Semua')" class="text-xs px-3.5 py-1.5 rounded-full btn-chrome text-white hover:text-white transition-all flex items-center gap-1 active:scale-95">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i> Reset / Semua
                </button>
            </div>

            <div>
                <h2 class="text-base font-bold mb-3 flex items-center gap-2">
                    <span class="w-1.5 h-4 bg-white/90 rounded-full inline-block"></span>
                    <span class="chrome-text">Trending di Indonesia</span>
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">${songsHtml}</div>
            </div>

            ${plistHtml ? `<div>
                <h2 class="text-base font-bold mb-3 flex items-center gap-2">
                    <span class="w-1.5 h-4 bg-white/90 rounded-full inline-block"></span>
                    <span class="chrome-text">Hits & Playlist Indonesia</span>
                </h2>
                <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-3">${plistHtml}</div>
            </div>` : ''}

            ${artistsHtml ? `<div>
                <h2 class="text-base font-bold mb-3 flex items-center gap-2">
                    <span class="w-1.5 h-4 bg-white/90 rounded-full inline-block"></span>
                    <span class="chrome-text">Artis Related</span>
                </h2>
                <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-3">${artistsHtml}</div>
            </div>` : ''}
        </div>`;

        lucide.createIcons();
    },

    showSkeleton() {
        var g = gid('home-grid'), s = gid('home-scroll'), a = gid('home-artists'), t = gid('home-trending'), al = gid('home-albums');
        var rowSk = '<div class="glass rounded-xl flex items-center gap-3 p-2 animate-pulse"><div class="w-14 h-14 rounded-lg bg-white/5"></div><div class="flex-grow space-y-2"><div class="h-3.5 bg-white/10 rounded w-3/4"></div><div class="h-2.5 bg-white/5 rounded w-1/2"></div></div></div>';
        var cardSk = '<div class="flex-shrink-0 w-40 animate-pulse"><div class="w-40 h-40 mb-2 rounded-xl bg-white/5"></div><div class="h-3.5 bg-white/10 rounded w-3/4 mb-1"></div><div class="h-2.5 bg-white/5 rounded w-1/2"></div></div>';
        if (g) g.innerHTML = Array(8).fill(rowSk).join('');
        if (t) t.innerHTML = Array(6).fill(rowSk).join('');
        if (s) s.innerHTML = Array(4).fill(cardSk).join('');
        if (al) al.innerHTML = Array(4).fill(cardSk).join('');
        if (a) {
            a.innerHTML = Array(4).fill(0).map(function() {
                return '<div class="flex-shrink-0 w-32 animate-pulse"><div class="w-32 h-32 mb-2 rounded-full bg-white/5"></div><div class="h-3.5 bg-white/10 rounded w-3/4 mx-auto mb-1"></div></div>';
            }).join('');
        }
    },

    mapSong(s) {
        var vid = s.videoId || s.id;
        return {
            id: vid,
            videoId: vid,
            title: cn(s.title),
            artist: cn(s.artist),
            artistId: s.artistId || '',
            cover: toHDCover(s.cover || s.thumbnail, vid),
            ytUrl: s.url
        };
    },

    _fetching: null,
    fetch() {
        // Hindari permintaan ganda saat start (render + switch memanggil fetch bersamaan)
        if (Home._fetching) return Home._fetching;
        Home._fetching = Home._doFetch().finally(function() { Home._fetching = null; });
        return Home._fetching;
    },

    async _doFetch() {
        Home.showSkeleton();
        // Bagian "Trending di Indonesia" & "Hits & Playlist Indonesia" diisi dari pencarian dengan judul yang sama.
        var srch = function(q, type) {
            return fetch(API.search + '?query=' + encodeURIComponent(q) + '&type=' + type)
                .then(function(r) { return r.json(); }).catch(function() { return null; });
        };
        var pHome = fetch(API.home).then(function(r) { return r.json(); }).catch(function() { return null; });
        var pTrend = srch('Trending di Indonesia', 'songs');
        var pHits = srch('Hits & Playlist Indonesia', 'playlists');
        var res = await Promise.all([pHome, pTrend, pHits]);
        var d = res[0], dt = res[1], dh = res[2];
        try {
            if (d && d.status && d.result) {
                S.ht = (d.result.quickPicks || []).map(Home.mapSong);
                S.htr = (d.result.trending || []).map(Home.mapSong);
                S.hp = d.result.playlists || [];
                S.hal = d.result.albums || [];
                S.ha = d.result.artists || [];
            }
            if (dt && dt.status && dt.result && dt.result.songs && dt.result.songs.length > 0) {
                S.htr = dt.result.songs.map(function(x) {
                    return { id: x.videoId, videoId: x.videoId, title: cn(x.title), artist: cn(x.artist), artistId: x.artistId || '', cover: toHDCover(x.thumbnail, x.videoId), ytUrl: x.url };
                });
            }
            if (dh && dh.status && dh.result) {
                var found = [].concat(dh.result.playlists || [], dh.result.albums || []);
                if (found.length > 0) S.hp = found;
            }
        } catch(e){}

        if (!S.ht || S.ht.length === 0) {
            try {
                var rs = await fetch(API.search + '?query=' + encodeURIComponent('Indonesia Populer') + '&type=songs');
                var ds = await rs.json();
                if (ds.status && ds.result.songs && ds.result.songs.length > 0) {
                    S.ht = ds.result.songs.map(function(x) {
                        return {
                            id: x.videoId,
                            videoId: x.videoId,
                            title: cn(x.title),
                            artist: cn(x.artist),
                            artistId: x.artistId || '',
                            cover: toHDCover(x.thumbnail, x.videoId),
                            ytUrl: x.url
                        };
                    });
                    S.htr = S.ht.slice(0, 10);
                    S.hp = [].concat(ds.result.playlists || []);
                    S.hal = [].concat(ds.result.albums || []);
                }
            } catch(e){}
        }

        Home.show();
    },

    trackState(t) {
        var isCur = S.ct && (
            S.ct.id === t.id ||
            S.ct.videoId === t.id ||
            (S.ct.id && t.videoId && S.ct.id === t.videoId) ||
            (S.ct.videoId && t.id && S.ct.videoId === t.id) ||
            (S.ct.title === t.title && S.ct.artist === t.artist)
        );
        return { isCur: !!isCur, isPlay: !!(isCur && S.ip), isLoad: !!(isCur && S.il) };
    },

    stateIcon(st, idle) {
        if (st.isLoad) {
            return '<div class="w-7 h-7 rounded-full btn-chrome flex items-center justify-center shrink-0 ml-auto"><div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
        }
        if (st.isPlay) {
            return '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto shadow-white/30 ring-2 ring-white scale-105"><div class="flex items-end justify-center gap-[2px] w-3.5 h-3.5 pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
        }
        if (st.isCur) {
            return '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto border border-white"><i data-lucide="pause" class="w-3.5 h-3.5 fill-current"></i></div>';
        }
        return idle || '';
    },

    show() {
        if (Home.activeCategory && Home.activeCategory !== 'Semua') {
            Home.displayCategoryView();
            return;
        }

        var defView = gid('home-default-view'), catView = gid('home-category-view');
        if (defView) defView.style.display = 'block';
        if (catView) catView.style.display = 'none';

        var g = gid('home-grid'), s = gid('home-scroll'); if (!g || !s) return;
        g.innerHTML = (S.ht || []).slice(0, 8).map(function(t, i) {
            var st = Home.trackState(t);
            var playIconHtml = Home.stateIcon(st, '');
            var cardBg = st.isPlay ? 'bg-white/15 border border-[#4a4a4a] shadow-white/5' : (st.isCur ? 'bg-white/10 border border-[#3f3f3f]' : 'glass glass-hover');
            var textStyle = st.isCur ? 'text-white font-black' : '';

            return '<div onclick="PK(\'home1\','+i+')" class="home-grid-card '+cardBg+' rounded-xl flex items-center gap-3 p-2 cursor-pointer active:scale-95 transition-all animate-stagger" style="animation-delay:'+(i*50)+'ms">'+
                '<img src="'+t.cover+'" class="w-14 h-14 rounded-lg object-cover shrink-0" onerror="this.src=\''+FI+'\'" />'+
                '<div class="min-w-0 flex-1"><span class="home-grid-title font-bold text-sm line-clamp-2 '+textStyle+'">'+es(t.title)+'</span><p class="text-white/60 text-[11px] truncate mt-0.5">'+es(t.artist)+'</p></div>'+
                '<div class="home-grid-icon ml-auto">'+playIconHtml+'</div>'+
            '</div>';
        }).join('');

        var tr = gid('home-trending'), trWrap = gid('home-trending-wrap');
        if (tr) {
            if (S.htr && S.htr.length > 0) {
                tr.innerHTML = S.htr.slice(0, 6).map(function(t, i) {
                    var st = Home.trackState(t);
                    var cardBg = st.isPlay ? 'bg-white/15 border border-[#4a4a4a]' : (st.isCur ? 'bg-white/10 border border-[#3f3f3f]' : 'glass glass-hover');
                    return '<div onclick="PK(\'home3\','+i+')" class="home-trend-card '+cardBg+' rounded-xl flex items-center gap-3 p-2.5 cursor-pointer active:scale-95 transition-all animate-stagger" style="animation-delay:'+(i*50)+'ms">'+
                        '<div class="w-6 text-center text-xs font-black text-white/70 shrink-0">#'+(i+1)+'</div>'+
                        '<img src="'+t.cover+'" class="w-12 h-12 rounded-lg object-cover shrink-0" onerror="this.src=\''+FI+'\'" />'+
                        '<div class="min-w-0 flex-1"><h3 class="home-trend-title font-semibold text-sm truncate '+(st.isCur?'text-white font-black':'')+'">'+es(t.title)+'</h3><p class="text-white/70 text-xs truncate mt-0.5">'+es(t.artist)+'</p></div>'+
                        '<div class="home-trend-icon ml-auto">'+Home.stateIcon(st, '<div class="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0 ml-auto text-white/70"><i data-lucide="play" class="w-3.5 h-3.5 fill-current ml-0.5"></i></div>')+'</div>'+
                    '</div>';
                }).join('');
                if (trWrap) trWrap.style.display = 'block';
            } else if (trWrap) {
                trWrap.style.display = 'none';
            }
        }

        var pls = typeof getUserPlaylists === 'function' ? getUserPlaylists() : [];
        var plHtml = '';

        pls.forEach(function(p, i) {
            plHtml += '<div onclick="Library.open(\''+p.id+'\')" class="flex-shrink-0 w-40 cursor-pointer active:scale-95 animate-stagger" style="animation-delay:'+(i*50)+'ms"><div class="w-40 h-40 mb-2 relative rounded-xl overflow-hidden glass-edge"><img src="'+(p.image||(p.songs.length>0?p.songs[0].cover:FI))+'" class="w-full h-full object-cover" onerror="this.src=\''+FI+'\'" /><div class="absolute bottom-2 right-2 btn-chrome rounded-full p-3 opacity-0 hover:opacity-100 transition-all shadow-black/40"><i data-lucide="play" class="w-5 h-5 fill-current ml-0.5"></i></div></div><h3 class="font-semibold text-sm truncate">'+es(p.name)+'</h3><p class="text-white/70 text-xs truncate mt-1">'+p.songs.length+' lagu</p></div>';
        });

        plHtml += '<div onclick="if(typeof Library !== \'undefined\') Library.createNew()" class="flex-shrink-0 w-40 cursor-pointer active:scale-95 flex flex-col"><div class="w-40 h-40 mb-2 relative rounded-xl overflow-hidden glass flex flex-col items-center justify-center border border-dashed border-[#3a3a3a] hover:border-[#4a4a4a]"><i data-lucide="plus" class="w-8 h-8 text-white/70"></i><span class="text-xs text-white/70 mt-2">Buat Playlist</span></div><h3 class="font-semibold text-sm truncate text-white/70">Buat Baru</h3></div>';

        var coverCard = function(p, i, offset) {
            return '<div onclick="Album.open(\''+esJs(p.id)+'\', \''+esJs(p.cover||FI)+'\')" class="flex-shrink-0 w-40 cursor-pointer active:scale-95 animate-stagger" style="animation-delay:'+((i+offset)*50)+'ms"><div class="w-40 h-40 mb-2 relative rounded-xl overflow-hidden glass-edge"><img src="'+(p.cover||FI)+'" class="w-full h-full object-cover" onerror="this.src=\''+FI+'\'" /></div><h3 class="font-semibold text-sm truncate">'+es(p.title)+'</h3><p class="text-white/70 text-xs truncate mt-1">'+es(p.artist)+'</p></div>';
        };

        if (S.hp && S.hp.length > 0) {
            S.hp.slice(0, 10).forEach(function(p, i) { plHtml += coverCard(p, i, pls.length + 1); });
        }

        s.innerHTML = plHtml;

        var al = gid('home-albums'), alWrap = gid('home-albums-wrap');
        if (al) {
            if (S.hal && S.hal.length > 0) {
                al.innerHTML = S.hal.slice(0, 10).map(function(p, i) { return coverCard(p, i, 0); }).join('');
                if (alWrap) alWrap.style.display = 'block';
            } else if (alWrap) {
                alWrap.style.display = 'none';
            }
        }

        var a = gid('home-artists');
        if (a) {
            if (S.ha && S.ha.length > 0) {
                var artHtml = S.ha.slice(0, 15).map(function(p, i) {
                    return '<div onclick="Artist.open(\''+esJs(p.id)+'\', \''+esJs(p.name||p.title)+'\')" class="flex-shrink-0 w-32 cursor-pointer active:scale-95 animate-stagger" style="animation-delay:'+(i*50)+'ms"><div class="w-32 h-32 mb-2 relative rounded-full overflow-hidden glass-edge"><img src="'+(p.cover||FI)+'" class="w-full h-full object-cover" onerror="this.src=\''+FI+'\'" /></div><h3 class="font-semibold text-center text-sm truncate">'+es(p.name||p.title)+'</h3></div>';
                }).join('');
                a.innerHTML = artHtml;
                a.parentElement.style.display = 'block';
            } else {
                a.parentElement.style.display = 'none';
            }
        }
        lucide.createIcons();
    },

    renderActive() {
        if (Home.activeCategory && Home.activeCategory !== 'Semua') {
            Home.renderActiveCategory();
            return;
        }

        var g = gid('home-grid');
        if (g && g.children && S.ht) {
            var items = S.ht.slice(0, 8);
            var cards = g.querySelectorAll('.home-grid-card');
            cards.forEach(function(el, i) {
                var t = items[i];
                if (!t) return;
                var isCur = S.ct && (
                    S.ct.id === t.id ||
                    S.ct.videoId === t.id ||
                    (S.ct.id && t.videoId && S.ct.id === t.videoId) ||
                    (S.ct.videoId && t.id && S.ct.videoId === t.id) ||
                    (S.ct.title === t.title && S.ct.artist === t.artist)
                );
                var isPlay = isCur && S.ip;
                var isLoad = isCur && S.il;

                var playIconHtml = '';
                if (isLoad) {
                    playIconHtml = '<div class="w-7 h-7 rounded-full btn-chrome flex items-center justify-center shrink-0 ml-auto"><div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
                } else if (isPlay) {
                    playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto shadow-white/30 ring-2 ring-white scale-105"><div class="flex items-end justify-center gap-[2px] w-3.5 h-3.5 pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
                } else if (isCur) {
                    playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto border border-white"><i data-lucide="pause" class="w-3.5 h-3.5 fill-current"></i></div>';
                }

                var cardBg = isPlay ? 'bg-white/15 border border-[#4a4a4a] shadow-white/5' : (isCur ? 'bg-white/10 border border-[#3f3f3f]' : 'glass glass-hover');
                el.className = 'home-grid-card ' + cardBg + ' rounded-xl flex items-center gap-3 p-2 cursor-pointer active:scale-95 transition-all';

                var titleEl = el.querySelector('.home-grid-title');
                if (titleEl) {
                    titleEl.className = 'home-grid-title font-bold text-sm line-clamp-2 ' + (isCur ? 'text-white font-black' : '');
                }
                var iconWrap = el.querySelector('.home-grid-icon');
                if (iconWrap) {
                    iconWrap.innerHTML = playIconHtml;
                }
            });
        }
        var tr = gid('home-trending');
        if (tr && S.htr) {
            tr.querySelectorAll('.home-trend-card').forEach(function(el, i) {
                var t = S.htr[i];
                if (!t) return;
                var st = Home.trackState(t);
                var cardBg = st.isPlay ? 'bg-white/15 border border-[#4a4a4a]' : (st.isCur ? 'bg-white/10 border border-[#3f3f3f]' : 'glass glass-hover');
                el.className = 'home-trend-card ' + cardBg + ' rounded-xl flex items-center gap-3 p-2.5 cursor-pointer active:scale-95 transition-all';
                var titleEl = el.querySelector('.home-trend-title');
                if (titleEl) titleEl.className = 'home-trend-title font-semibold text-sm truncate ' + (st.isCur ? 'text-white font-black' : '');
                var iconWrap = el.querySelector('.home-trend-icon');
                if (iconWrap) iconWrap.innerHTML = Home.stateIcon(st, '<div class="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0 ml-auto text-white/70"><i data-lucide="play" class="w-3.5 h-3.5 fill-current ml-0.5"></i></div>');
            });
        }
        lucide.createIcons();
    },

    renderActiveCategory() {
        var catView = gid('home-category-view');
        if (!catView || !S.hc) return;

        var cards = catView.querySelectorAll('.home-cat-card');
        cards.forEach(function(el, i) {
            var t = S.hc[i];
            if (!t) return;

            var isCur = S.ct && (
                S.ct.id === t.id ||
                S.ct.videoId === t.id ||
                (S.ct.id && t.videoId && S.ct.id === t.videoId) ||
                (S.ct.videoId && t.id && S.ct.videoId === t.id) ||
                (S.ct.title === t.title && S.ct.artist === t.artist)
            );
            var isPlay = isCur && S.ip;
            var isLoad = isCur && S.il;

            var playIconHtml = '';
            if (isLoad) {
                playIconHtml = '<div class="w-7 h-7 rounded-full btn-chrome flex items-center justify-center shrink-0 ml-auto"><div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
            } else if (isPlay) {
                playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto shadow-white/30 ring-2 ring-white scale-105"><div class="flex items-end justify-center gap-[2px] w-3.5 h-3.5 pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
            } else if (isCur) {
                playIconHtml = '<div class="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-auto border border-white"><i data-lucide="pause" class="w-3.5 h-3.5 fill-current"></i></div>';
            } else {
                playIconHtml = '<div class="w-7 h-7 rounded-full bg-white/5 group-hover:bg-white/20 flex items-center justify-center shrink-0 ml-auto text-white transition-all"><i data-lucide="play" class="w-3.5 h-3.5 fill-current ml-0.5"></i></div>';
            }

            var cardBg = isPlay ? 'bg-white/15 border border-[#4a4a4a] shadow-white/5' : (isCur ? 'bg-white/10 border border-[#3f3f3f]' : 'glass glass-hover');
            el.className = 'home-cat-card group ' + cardBg + ' rounded-xl flex items-center gap-3 p-2.5 cursor-pointer active:scale-95 transition-all';

            var titleEl = el.querySelector('h3');
            if (titleEl) {
                titleEl.className = 'font-bold text-sm truncate ' + (isCur ? 'text-white font-black' : 'text-white/90');
            }
            var iconWrap = el.children[el.children.length - 1];
            if (iconWrap) {
                iconWrap.innerHTML = playIconHtml;
            }
        });
        lucide.createIcons();
    },

    refresh() {
        if (Home.activeCategory && Home.activeCategory !== 'Semua') {
            Home.fetchCategoryData(Home.activeCategory);
        } else {
            Home.fetch();
        }
        var m = gid('main-area');
        if (m) m.scrollTop = 0;
    }
};