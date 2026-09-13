var Search={
    render(){
        gid('view-search').innerHTML=`
        <div class="pt-12 px-4"><h1 class="text-3xl font-black chrome-text mb-4">Cari</h1><form id="search-form" class="relative" autocomplete="off"><div class="absolute inset-y-0 left-0 pl-4 flex items-center text-[#a0a5b0]"><i data-lucide="search" class="h-5 w-5"></i></div><input type="text" id="search-input" class="w-full glass-input text-white font-medium rounded-2xl pl-12 pr-20 py-3.5 focus:outline-none placeholder:text-[#a0a5b0]" placeholder="Cari lagu, artis, atau album..." autocomplete="off" /><button type="submit" class="absolute right-2 top-0 bottom-0 my-auto h-fit btn-chrome font-bold px-4 py-2 rounded-xl active:scale-90 shadow-md">Cari</button></form><div id="suggestions" class="hidden mt-2 glass-strong rounded-2xl  max-h-72 overflow-y-auto hide-scrollbar border border-white/10"></div></div>
        <div id="filter-tabs" class="hidden flex gap-2 p-1.5 glass rounded-full mx-4 mb-3 mt-4 border border-white/10">
            <button onclick="setFilter('songs')" id="f-songs" class="filter-tab active flex-1 py-2 px-4 rounded-full text-xs font-bold btn-chrome text-white  border border-white/30">Musik</button>
            <button onclick="setFilter('playlists')" id="f-playlists" class="filter-tab flex-1 py-2 px-4 rounded-full text-xs font-semibold text-[#a0a5b0] hover:text-white transition-all">Playlist</button>
            <button onclick="setFilter('artists')" id="f-artists" class="filter-tab flex-1 py-2 px-4 rounded-full text-xs font-semibold text-[#a0a5b0] hover:text-white transition-all">Artis</button>
        </div>
        <div class="px-4 mt-2" id="search-results"></div>
        <div id="search-recs" class="px-4 mt-2 space-y-6 pb-8"></div>`;
        lucide.createIcons();Search.events();
    },
    query(q){
        App.switch('search');
        var si = gid('search-input');
        if (si) {
            si.value = q;
            var sf = gid('search-form');
            if (sf) sf.dispatchEvent(new Event('submit'));
        }
    },
    onShow(){if(!S.sq){Search.renderRecs();}},
    REC_ROWS:[{key:'rec0',label:'Rilis Anyar',q:'baru rilis'},{key:'rec1',label:'Barat Top',q:'barat Top'},{key:'rec2',label:'Rap',q:'Rap Top'}],
    renderRecs(){
        var rc=gid('search-recs');if(!rc)return;
        if(S.rec0&&S.rec1&&S.rec2){Search.showRecs();return;}
        rc.innerHTML=Search.REC_ROWS.map(function(row){
            return '<div><div class="h-5 w-32 bg-white/10 rounded mb-3 animate-pulse"></div><div class="flex gap-3 overflow-x-auto hide-scrollbar pb-1">'+
                Array(4).fill(0).map(function(){return '<div class="flex-shrink-0 w-32 animate-pulse"><div class="w-32 h-32 rounded-xl bg-white/5 mb-2"></div><div class="h-3 bg-white/10 rounded w-3/4"></div></div>';}).join('')+
            '</div></div>';
        }).join('');
        Promise.all(Search.REC_ROWS.map(function(row){
            return fetch(API.search+'?query='+encodeURIComponent(row.q)+'&type=songs').then(function(r){return r.json();}).then(function(d){
                S[row.key]=d.status&&d.result.songs?d.result.songs.map(function(s){return{id:s.videoId,videoId:s.videoId,title:cn(s.title),artist:cn(s.artist),artistId:s.artistId||'',cover:toHDCover(s.thumbnail,s.videoId),ytUrl:s.url};}):[];
            }).catch(function(){S[row.key]=[];});
        })).then(function(){Search.showRecs();});
    },
    showRecs(){
        var rc=gid('search-recs');if(!rc)return;
        rc.innerHTML=Search.REC_ROWS.map(function(row){
            var list=S[row.key]||[];
            if(list.length===0)return '';
            var cardsHtml=list.map(function(t,i){
                var isCur = S.ct && (
                    S.ct.id === t.id ||
                    S.ct.videoId === t.id ||
                    (S.ct.id && t.videoId && S.ct.id === t.videoId) ||
                    (S.ct.videoId && t.id && S.ct.videoId === t.id) ||
                    (S.ct.title === t.title && S.ct.artist === t.artist)
                );
                var isPlay = isCur && S.ip;
                var isLoad = isCur && S.il;
                var recBtn = '';
                var ringClass = '';

                if(isLoad) {
                    recBtn = '<div class="absolute bottom-1.5 right-1.5 btn-chrome rounded-full p-2  shadow-black/40"><div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
                    ringClass = 'ring-2 ring-white/60 scale-[1.02]  shadow-white/10';
                } else if(isPlay) {
                    recBtn = '<div class="absolute bottom-1.5 right-1.5 bg-white text-black rounded-full p-2  shadow-white/30 ring-2 ring-white scale-105"><div class="flex items-end justify-center gap-[2px] w-3.5 h-3.5 pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
                    ringClass = 'ring-2 ring-white scale-[1.02]  shadow-white/20';
                } else if(isCur) {
                    recBtn = '<div class="absolute bottom-1.5 right-1.5 bg-white text-black rounded-full p-2  scale-105 border border-white"><i data-lucide="pause" class="w-3.5 h-3.5 fill-current"></i></div>';
                    ringClass = 'ring-2 ring-white/60 shadow-md';
                } else {
                    recBtn = '<div class="absolute bottom-1.5 right-1.5 btn-chrome rounded-full p-2  shadow-black/40 hover:scale-110 transition-all"><i data-lucide="play" class="w-3.5 h-3.5 fill-current ml-0.5"></i></div>';
                    ringClass = '';
                }

                return '<div onclick="PK(\''+row.key+'\','+i+')" class="search-rec-item flex-shrink-0 w-32 cursor-pointer active:scale-95 animate-card-left" style="animation-delay:'+Math.min(i*50, 450)+'ms"><div class="search-rec-cover w-32 h-32 mb-2 relative rounded-xl overflow-hidden glass-edge  transition-all '+ringClass+'"><img src="'+t.cover+'" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105" onerror="this.src=\''+FI+'\'" /><div class="search-rec-btn">'+recBtn+'</div></div><h3 class="search-rec-title font-semibold text-xs truncate '+(isCur?'text-white font-black':'')+'">'+es(t.title)+'</h3><p class="text-white/70 text-[10px] truncate mt-0.5">'+es(t.artist)+'</p></div>';
            }).join('');
            return '<div class="animate-card-up"><h2 class="text-base font-bold mb-3 flex items-center gap-2"><span class="w-1.5 h-4 bg-white/90 rounded-full inline-block"></span>'+row.label+'</h2><div class="flex gap-3 overflow-x-auto hide-scrollbar pb-1">'+cardsHtml+'</div></div>';
        }).join('');
        lucide.createIcons();
    },
    renderActive(){
        var c = gid('search-results');
        if (c && S.sq && S.filter === 'songs' && S.sr) {
            var items = c.querySelectorAll('.search-song-item');
            items.forEach(function(el, i){
                var t = S.sr[i];
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

                var btnHtml = '';
                if (isLoad) {
                    btnHtml = '<div class="w-9 h-9 rounded-full btn-chrome flex items-center justify-center shrink-0  shadow-white/10 scale-105"><div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
                } else if (isPlay) {
                    btnHtml = '<div class="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shrink-0  shadow-white/30 ring-2 ring-white scale-105 transition-all"><div class="flex items-end justify-center gap-[2.5px] w-4 h-4 pb-0.5"><span class="w-[2.5px] bg-black rounded-full animate-eq-1"></span><span class="w-[2.5px] bg-black rounded-full animate-eq-2"></span><span class="w-[2.5px] bg-black rounded-full animate-eq-3"></span></div></div>';
                } else if (isCur) {
                    btnHtml = '<div class="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow-md transition-all border border-white scale-105"><i data-lucide="pause" class="w-4 h-4 fill-current"></i></div>';
                } else {
                    btnHtml = '<div class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center shrink-0 text-white/70 transition-all"><i data-lucide="play" class="w-3.5 h-3.5 fill-current ml-0.5"></i></div>';
                }

                var itemBg = isCur ? (isPlay ? 'bg-white/15 border border-white/40  shadow-white/5' : 'bg-white/10 border border-white/20') : 'hover:bg-white/5 border border-transparent';
                var titleColor = isCur ? 'text-white font-black' : 'text-white';
                var badgeHtml = isPlay ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-white/20 text-white font-bold uppercase tracking-wider ml-2 border border-white/30">Diputar</span>' : (isCur ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-bold uppercase tracking-wider ml-2 border border-white/20">Dijeda</span>' : '');

                el.className = 'search-song-item flex items-center gap-3.5 p-3 rounded-xl cursor-pointer active:scale-[0.98] transition-all ' + itemBg;
                var titleEl = el.querySelector('.search-song-title');
                if (titleEl) titleEl.className = 'search-song-title font-medium truncate ' + titleColor;
                var badgeEl = el.querySelector('.search-song-badge');
                if (badgeEl) badgeEl.innerHTML = badgeHtml;
                var btnEl = el.querySelector('.search-song-btn');
                if (btnEl) btnEl.innerHTML = btnHtml;
            });
        }

        var rc = gid('search-recs');
        if (rc && !S.sq) {
            Search.REC_ROWS.forEach(function(row){
                var list = S[row.key] || [];
                list.forEach(function(t, i){
                    var isCur = S.ct && (
                        S.ct.id === t.id ||
                        S.ct.videoId === t.id ||
                        (S.ct.id && t.videoId && S.ct.id === t.videoId) ||
                        (S.ct.videoId && t.id && S.ct.videoId === t.id) ||
                        (S.ct.title === t.title && S.ct.artist === t.artist)
                    );
                    var isPlay = isCur && S.ip;
                    var isLoad = isCur && S.il;
                    var recBtn = '';
                    var ringClass = '';

                    if(isLoad) {
                        recBtn = '<div class="absolute bottom-1.5 right-1.5 btn-chrome rounded-full p-2  shadow-black/40"><div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
                        ringClass = 'ring-2 ring-white/60 scale-[1.02]  shadow-white/10';
                    } else if(isPlay) {
                        recBtn = '<div class="absolute bottom-1.5 right-1.5 bg-white text-black rounded-full p-2  shadow-white/30 ring-2 ring-white scale-105"><div class="flex items-end justify-center gap-[2px] w-3.5 h-3.5 pb-0.5"><span class="w-[2px] bg-black rounded-full animate-eq-1"></span><span class="w-[2px] bg-black rounded-full animate-eq-2"></span><span class="w-[2px] bg-black rounded-full animate-eq-3"></span></div></div>';
                        ringClass = 'ring-2 ring-white scale-[1.02]  shadow-white/20';
                    } else if(isCur) {
                        recBtn = '<div class="absolute bottom-1.5 right-1.5 bg-white text-black rounded-full p-2  scale-105 border border-white"><i data-lucide="pause" class="w-3.5 h-3.5 fill-current"></i></div>';
                        ringClass = 'ring-2 ring-white/60 shadow-md';
                    } else {
                        recBtn = '<div class="absolute bottom-1.5 right-1.5 btn-chrome rounded-full p-2  shadow-black/40 hover:scale-110 transition-all"><i data-lucide="play" class="w-3.5 h-3.5 fill-current ml-0.5"></i></div>';
                        ringClass = '';
                    }

                    var card = rc.querySelector('[onclick*="PK(\''+row.key+'\','+i+')"]');
                    if(card) {
                        var cover = card.querySelector('.search-rec-cover');
                        if(cover) cover.className = 'search-rec-cover w-32 h-32 mb-2 relative rounded-xl overflow-hidden glass-edge  transition-all ' + ringClass;
                        var btn = card.querySelector('.search-rec-btn');
                        if(btn) btn.innerHTML = recBtn;
                        var title = card.querySelector('.search-rec-title');
                        if(title) title.className = 'search-rec-title font-semibold text-xs truncate ' + (isCur?'text-white font-black':'');
                    }
                });
            });
        }
        lucide.createIcons();
    },
    events(){
        var sf=gid('search-form'),si=gid('search-input');if(!sf||!si)return;
        sf.addEventListener('submit',async function(e){
            e.preventDefault();S.sq=si.value.trim();gid('suggestions').classList.add('hidden');
            if(!S.sq){S.ar=[];S.pr=[];S.sr=[];Search.show();return;}
            var url=location.origin+'/search/'+encodeURIComponent(S.sq);
            history.pushState({},'',url);
            Search.show(true);
            try{
                var r=await fetch(API.search+'?query='+encodeURIComponent(S.sq)+'&type=all');
                var d=await r.json();
                S.ar=d.status&&d.result.songs?d.result.songs.map(function(s){return{id:s.videoId,videoId:s.videoId,title:cn(s.title),artist:cn(s.artist),artistId:s.artistId||'',cover:toHDCover(s.thumbnail,s.videoId),ytUrl:s.url};}):[];
                
                var pl = d.status&&d.result.playlists?d.result.playlists:[];
                var al = d.status&&d.result.albums?d.result.albums:[];
                S.pr = [].concat(pl).concat(al);
                S.art = d.status&&d.result.artists?d.result.artists:[];

                gid('filter-tabs').classList.remove('hidden');
                S.filter = 'songs';
                Search.updateFilterUI();
                Search.apply();
            }catch(e){S.ar=[];S.pr=[];Search.show();}
        });
        si.addEventListener('input',function(){
            var q=this.value.trim();
            if(!q){gid('suggestions').classList.add('hidden');return;}
            fetch(API.suggest+'?q='+encodeURIComponent(q)).then(function(r){return r.json();}).then(function(s){
                if(Array.isArray(s)&&s.length>0){
                    gid('suggestions').innerHTML=s.map(function(sg, i){
                        return'<div onclick="selectSuggestion(\''+es(sg).replace(/'/g,"\\'")+'\')" class="px-4 py-3 hover:bg-white/10 cursor-pointer text-sm animate-card-left flex items-center gap-3 transition-colors" style="animation-delay:'+Math.min(i*25, 250)+'ms"><i data-lucide="search" class="w-3.5 h-3.5 text-white/70"></i><span>'+es(sg)+'</span></div>';
                    }).join('');
                    gid('suggestions').classList.remove('hidden');
                    lucide.createIcons();
                }else{gid('suggestions').classList.add('hidden');}
            });
        });
        document.addEventListener('click',function(e){if(!e.target.closest('#search-form')&&!e.target.closest('#suggestions'))gid('suggestions').classList.add('hidden');});
    },
    updateFilterUI(){
        document.querySelectorAll('.filter-tab').forEach(function(el){
            el.className = 'filter-tab flex-1 py-2 px-4 rounded-full text-xs font-semibold text-[#a0a5b0] hover:text-white transition-all';
        });
        var a=gid('f-'+S.filter);
        if(a){a.className = 'filter-tab active flex-1 py-2 px-4 rounded-full text-xs font-bold btn-chrome text-white  border border-white/30 scale-105';}
    },
    show(loading){
        var c=gid('search-results'),rc=gid('search-recs');if(!c)return;
        if(!S.sq){c.innerHTML='';if(rc)rc.style.display='';return;}
        if(rc)rc.style.display='none';
        if(loading){c.innerHTML='<div class="text-center mt-10"><div class="w-8 h-8 border-3 border-[#cfd3d8] border-t-transparent rounded-full animate-spin mx-auto"></div></div>';return;}
        if(S.sr.length===0){c.innerHTML='<p class="text-center text-white/70 mt-10">Tidak ada hasil</p>';return;}
        
        if (S.filter === 'songs') {
            c.innerHTML=S.sr.map(function(t,i){
                var isCur = S.ct && (
                    S.ct.id === t.id ||
                    S.ct.videoId === t.id ||
                    (S.ct.id && t.videoId && S.ct.id === t.videoId) ||
                    (S.ct.videoId && t.id && S.ct.videoId === t.id) ||
                    (S.ct.title === t.title && S.ct.artist === t.artist)
                );
                var isPlay = isCur && S.ip;
                var isLoad = isCur && S.il;

                var btnHtml = '';
                if (isLoad) {
                    btnHtml = '<div class="w-9 h-9 rounded-full btn-chrome flex items-center justify-center shrink-0  shadow-white/10 scale-105"><div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>';
                } else if (isPlay) {
                    btnHtml = '<div class="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shrink-0  shadow-white/30 ring-2 ring-white scale-105 transition-all"><div class="flex items-end justify-center gap-[2.5px] w-4 h-4 pb-0.5"><span class="w-[2.5px] bg-black rounded-full animate-eq-1"></span><span class="w-[2.5px] bg-black rounded-full animate-eq-2"></span><span class="w-[2.5px] bg-black rounded-full animate-eq-3"></span></div></div>';
                } else if (isCur) {
                    btnHtml = '<div class="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow-md transition-all border border-white scale-105"><i data-lucide="pause" class="w-4 h-4 fill-current"></i></div>';
                } else {
                    btnHtml = '<div class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center shrink-0 text-white/70 transition-all"><i data-lucide="play" class="w-3.5 h-3.5 fill-current ml-0.5"></i></div>';
                }

                var itemBg = isCur ? (isPlay ? 'bg-white/15 border border-white/40  shadow-white/5' : 'bg-white/10 border border-white/20') : 'hover:bg-white/5 border border-transparent';
                var titleColor = isCur ? 'text-white font-black' : 'text-white';
                var badgeHtml = isPlay ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-white/20 text-white font-bold uppercase tracking-wider ml-2 border border-white/30">Diputar</span>' : (isCur ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-bold uppercase tracking-wider ml-2 border border-white/20">Dijeda</span>' : '');

                return '<div onclick="PK(\'search\','+i+')" class="search-song-item flex items-center gap-3.5 p-3 rounded-xl cursor-pointer active:scale-[0.98] transition-all animate-card-up '+itemBg+'" style="animation-delay:'+Math.min(i*35, 500)+'ms">'+
                    '<img src="'+t.cover+'" class="w-12 h-12 rounded-lg object-cover shadow-md shrink-0" onerror="this.src=\''+FI+'\'" />'+
                    '<div class="truncate flex-1 min-w-0"><div class="flex items-center"><h3 class="search-song-title font-medium truncate '+titleColor+'">'+es(t.title)+'</h3><span class="search-song-badge">'+badgeHtml+'</span></div><p class="text-white/70 text-sm truncate mt-0.5">'+es(t.artist)+'</p></div>'+
                    '<div class="search-song-btn">'+btnHtml+'</div>'+
                '</div>';
            }).join('');
            lucide.createIcons();
        } else if (S.filter === 'artists') {
            c.innerHTML='<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-8">'+S.sr.map(function(p, i){
                return '<div onclick="Artist.open(\''+p.id+'\', \''+esJs(p.name||p.title)+'\')" class="cursor-pointer active:scale-95 animate-card-up" style="animation-delay:'+Math.min(i*40, 500)+'ms"><div class="w-full aspect-square mb-2 relative rounded-full overflow-hidden glass-edge "><img src="'+(p.cover||FI)+'" class="w-full h-full object-cover" onerror="this.src=\''+FI+'\'" /></div><h3 class="font-semibold text-center text-sm truncate">'+es(p.name||p.title)+'</h3><p class="text-white/70 text-center text-xs truncate mt-0.5">'+es(p.subtitle||p.artist)+'</p></div>';
            }).join('')+'</div>';
            lucide.createIcons();
        } else {
            c.innerHTML='<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-8">'+S.sr.map(function(p, i){
                return '<div onclick="Album.open(\''+p.id+'\', \''+(p.cover||FI)+'\')" class="cursor-pointer active:scale-95 animate-card-up" style="animation-delay:'+Math.min(i*40, 500)+'ms"><div class="w-full aspect-square mb-2 relative rounded-xl overflow-hidden glass-edge "><img src="'+(p.cover||FI)+'" class="w-full h-full object-cover" onerror="this.src=\''+FI+'\'" /></div><h3 class="font-semibold text-sm truncate">'+es(p.title)+'</h3><p class="text-white/70 text-xs truncate mt-0.5">'+es(p.artist)+'</p></div>';
            }).join('')+'</div>';
            lucide.createIcons();
        }
    },
    apply(){
        if(S.filter==='songs') S.sr=S.ar||[];
        else if(S.filter==='playlists') S.sr=S.pr||[];
        else if(S.filter==='artists') S.sr=S.art||[];
        Search.show();
    }
};
function selectSuggestion(t){gid('suggestions').classList.add('hidden');gid('search-input').value=t;gid('search-form').dispatchEvent(new Event('submit'));}
function setFilter(f){S.filter=f;Search.updateFilterUI();Search.apply();}
