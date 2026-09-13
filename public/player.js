const API={search:'/api/search',artist:'/api/artist',suggest:'/api/suggest',lyrics:'/api/lyrics',lyrics1:'/api/lyrics1',ytplay:'/api/ytplay'};
const FI='data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2523374151%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20width%3D%22100%2525%22%20height%3D%22100%2525%22%20fill%3D%22%252318181b%22%2F%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%2210%22%20fill%3D%22%252327272a%22%20stroke%3D%22none%22%2F%3E%3Cpath%20d%3D%22M9%2017V5l10-2v12%22%20stroke%3D%22%252352525b%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%226%22%20cy%3D%2217%22%20r%3D%223%22%20fill%3D%22%252352525b%22%20stroke%3D%22none%22%2F%3E%3Ccircle%20cx%3D%2216%22%20cy%3D%2215%22%20r%3D%223%22%20fill%3D%22%252352525b%22%20stroke%3D%22none%22%2F%3E%3C%2Fsvg%3E';

function toHDCover(url, videoId) {
    if (!url && videoId) return 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg';
    if (!url) return FI;
    var hd = String(url);
    if (hd.includes('googleusercontent.com') || hd.includes('ggpht.com') || hd.includes('ytimg.com')) {
        if (/=w\d+-h\d+/i.test(hd)) {
            hd = hd.replace(/=w\d+-h\d+[^?#]*/i, '=w800-h800-l90-rj');
        } else if (/=s\d+/i.test(hd)) {
            hd = hd.replace(/=s\d+[^?#]*/i, '=s800-c-k-c0x00ffffff-no-rj');
        } else if (/=w\d+/i.test(hd)) {
            hd = hd.replace(/=w\d+[^?#]*/i, '=w800-h800-l90-rj');
        }
    }
    if (hd.includes('i.ytimg.com/vi/') || hd.includes('img.youtube.com/vi/')) {
        hd = hd.replace(/(hqdefault|mqdefault|sddefault|default)\.jpg/i, 'hqdefault.jpg');
    }
    return hd;
}

function handleImgError(img) {
    if (!img) return;
    if (img.src && img.src.includes('hqdefault.jpg')) {
        img.src = img.src.replace('hqdefault.jpg', 'mqdefault.jpg');
    } else {
        img.src = FI;
    }
}

const S={ht:[],sr:[],ar:[],hc:[],hcp:[],hca:[],sq:'',filter:'all',ct:null,pl:[],pi:-1,ps:'',ip:false,il:false,rm:'all',isShuffle:false,currentAccentColor:'#f43f5e',autoNext:true,iv:null,pt:0,pd:0,at:'home',ld:{type:'none',lines:[]},cli:-1,lo:false,lyricOffset:0,playbackRate:1.0,sleepSecondsLeft:0,sleepEndWithTrack:false,lyricsTranslate:false};

try{S.playbackRate=parseFloat(localStorage.getItem('hanz_playback_rate'))||1.0;}catch(e){S.playbackRate=1.0;}
try{var storedAutoNext = localStorage.getItem('hanz_auto_next');if(storedAutoNext!==null){S.autoNext = storedAutoNext==='true';}}catch(e){}
try{var storedLyricsTranslate = localStorage.getItem('hanz_lyrics_translate');S.lyricsTranslate = storedLyricsTranslate==='true';}catch(e){}

function fm(s){if(isNaN(s))return"0:00";const m=Math.floor(s/60),se=Math.floor(s%60);return m+':'+(se<10?'0':'')+se;}
function es(t){if(!t)return'';const d=document.createElement('div');d.textContent=t;return d.innerHTML;}
function esJs(t){if(!t)return'';return String(t).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;').replace(/\n/g,' ').replace(/\r/g,'');}
function cn(t){if(!t)return'Unknown';return t.replace(/[^\x20-\x7E\xA0-\xFF\u0100-\uFFFF]/g,'').replace(/\s*-\s*Topic$/i,'').trim()||'Unknown';}
function gid(id){return document.getElementById(id);}

function updateOG(title,image){
    var t=document.querySelector('meta[property="og:title"]');if(!t){t=document.createElement('meta');t.setAttribute('property','og:title');document.head.appendChild(t);}t.setAttribute('content',title+' | Beatsify');
    var i=document.querySelector('meta[property="og:image"]');if(!i){i=document.createElement('meta');i.setAttribute('property','og:image');document.head.appendChild(i);}i.setAttribute('content',image||FI);
    document.title=title+' - Beatsify';
}

var AU=gid('audio-player');
if(!AU){AU=document.createElement('audio');AU.id='audio-player';AU.preload='auto';AU.style.display='none';document.body.appendChild(AU);}
try{var storedVolume=localStorage.getItem('hanz_volume');if(storedVolume!==null){AU.volume=Math.max(0,Math.min(100,parseInt(storedVolume,10)))/100;}}catch(e){}
AU.addEventListener('timeupdate',function(){if(!AU.paused){S.pt=AU.currentTime||0;S.pd=AU.duration||0;renderProgress();}});
AU.addEventListener('play',function(){S.ip=true;S.il=false;UB();SP();try{AU.playbackRate=S.playbackRate||1.0;}catch(ex){}});
AU.addEventListener('pause',function(){if(!AU.ended){S.ip=false;UB();ST();}});
AU.addEventListener('waiting',function(){S.il=true;UB();});
AU.addEventListener('playing',function(){S.il=false;UB();});
AU.addEventListener('ended',function(){ST();if(handleTrackEnded())return;if(S.rm==='one'){AU.currentTime=0;AU.play().catch(function(){});}else if(S.autoNext){NX();}else{S.ip=false;UB();}});
AU.addEventListener('error',function(){if(AU.src){S.il=false;S.ip=false;UB();}});

function SP(){
    ST();
    S.iv=setInterval(function(){
        if(!AU.paused){S.pt=AU.currentTime||0;S.pd=AU.duration||0;renderProgress();}
    },100);
}
function ST(){if(S.iv){clearInterval(S.iv);S.iv=null;}}

function renderProgress(){
    var p=S.pd>0?(S.pt/S.pd)*100:0;
    var mp=gid('mini-progress'),fp=gid('full-progress'),sb=gid('seek-bar'),tc=gid('time-curr'),td=gid('time-dur');
    if(mp)mp.style.width=p+'%';if(fp)fp.style.width=p+'%';if(sb)sb.value=p;if(tc)tc.innerText=fm(S.pt);if(td)td.innerText=fm(S.pd);ULH(S.pt);
    var mcp = gid('mini-circle-progress');
    if (mcp) {
        var totalLen = 131.95;
        var offset = totalLen * (1 - (p / 100));
        mcp.style.strokeDashoffset = Math.max(0, offset);
    }
}

function UB(){
    var mi=gid('mini-play-btn'),fu=gid('full-play-btn');
    var coverOverlay=gid('full-cover-overlay'),coverIcon=gid('full-cover-icon'),coverText=gid('full-cover-text');
    var fullCover=gid('full-cover');
    var statusTag=gid('full-status-tag');
    var playWrap=gid('full-play-btn-wrap');
    var miniCover = gid('mini-cover');
    if (miniCover) {
        miniCover.style.animationPlayState = S.ip ? 'running' : 'paused';
    }
    if(!mi||!fu)return;
    var accent = S.currentAccentColor || '#f43f5e';
    if(S.il){
        mi.innerHTML='<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>';
        fu.innerHTML='<div class="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>';
        if(coverOverlay){
            coverOverlay.classList.remove('opacity-0', 'pointer-events-none');
            coverOverlay.classList.add('opacity-100');
            if(coverIcon) coverIcon.innerHTML='<div class="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>';
            if(coverText) coverText.innerText='MEMUAT AUDIO...';
        }
        if(fullCover){
            fullCover.style.transform='scale(0.95)';
            fullCover.style.filter='brightness(0.75)';
        }
        if(statusTag){
            statusTag.classList.remove('hidden', 'bg-white/10', 'text-white/80', 'border-white/20');
            statusTag.classList.add('inline-block', 'bg-white/20', 'text-white', 'border-white/30', 'animate-pulse');
            statusTag.innerText='MEMUAT';
        }
    }
    else if(S.ip){
        mi.innerHTML='<i data-lucide="pause" class="w-4 h-4 fill-current"></i>';
        fu.innerHTML='<i data-lucide="pause" class="w-7 h-7 fill-current"></i>';
        if(coverOverlay){
            coverOverlay.classList.remove('opacity-100');
            coverOverlay.classList.add('opacity-0', 'pointer-events-none');
        }
        if(fullCover){
            fullCover.style.transform='scale(1)';
            fullCover.style.filter='brightness(1)';
        }
        if(statusTag){
            statusTag.classList.add('hidden');
            statusTag.classList.remove('inline-block', 'animate-pulse');
        }
    }
    else{
        mi.innerHTML='<i data-lucide="play" class="w-4 h-4 fill-current ml-0.5"></i>';
        fu.innerHTML='<i data-lucide="play" class="w-7 h-7 fill-current ml-0.5"></i>';
        if(coverOverlay){
            if(S.ct){
                coverOverlay.classList.remove('opacity-0', 'pointer-events-none');
                coverOverlay.classList.add('opacity-100');
                if(coverIcon) coverIcon.innerHTML='<i data-lucide="pause-circle" class="w-12 h-12 text-white/90"></i>';
                if(coverText) coverText.innerText='DIPAUSE';
            }else{
                coverOverlay.classList.remove('opacity-100');
                coverOverlay.classList.add('opacity-0', 'pointer-events-none');
            }
        }
        if(fullCover){
            if(S.ct){
                fullCover.style.transform='scale(0.96)';
                fullCover.style.filter='brightness(0.85)';
            }else{
                fullCover.style.transform='scale(1)';
                fullCover.style.filter='brightness(1)';
            }
        }
        if(statusTag){
            if(S.ct){
                statusTag.classList.remove('hidden', 'bg-white/20', 'animate-pulse');
                statusTag.classList.add('inline-block', 'bg-white/10', 'text-white/80', 'border-white/20');
                statusTag.innerText='PAUSED';
            }else{
                statusTag.classList.add('hidden');
                statusTag.classList.remove('inline-block');
            }
        }
    }
    if(playWrap){
        playWrap.style.backgroundColor = accent;
    }
    if(mi){
        mi.style.borderColor = accent + '88';
        mi.style.color = '#ffffff';
    }
    var miniBeats = gid('mini-beats-bg');
    if(miniBeats) {
        if(S.ip) {
            miniBeats.classList.remove('opacity-0');
            miniBeats.classList.add('opacity-100');
            miniBeats.querySelectorAll('.mini-beat-bar').forEach(function(b){ b.style.animationPlayState = 'running'; });
        } else {
            miniBeats.classList.remove('opacity-100');
            miniBeats.classList.add('opacity-30');
            miniBeats.querySelectorAll('.mini-beat-bar').forEach(function(b){ b.style.animationPlayState = 'paused'; });
        }
    }
    lucide.createIcons();
}

function setMetaTag(name, content, isProperty) {
    var attr = isProperty ? 'property' : 'name';
    var el = document.querySelector('meta[' + attr + '="' + name + '"]');
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function setFavicon(url) {
    var icon = document.querySelector('link[rel="icon"]');
    var appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!url) {
        if (icon) icon.setAttribute('href', 'data:,');
        if (appleIcon) appleIcon.setAttribute('href', 'data:,');
        return;
    }
    if (!icon) {
        icon = document.createElement('link');
        icon.rel = 'icon';
        document.head.appendChild(icon);
    }
    icon.href = url;
    if (!appleIcon) {
        appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        document.head.appendChild(appleIcon);
    }
    appleIcon.href = url;
}

function updateOG(title, cover, artist) {
    if (title && cover) {
        var fullTitle = artist ? (title + ' - ' + artist) : title;
        var docTitle = fullTitle + ' | Beatsify';
        var description = 'Dengarkan ' + fullTitle + ' di Beatsify';
        document.title = docTitle;
        setMetaTag('og:title', fullTitle, true);
        setMetaTag('og:description', description, true);
        setMetaTag('og:image', cover, true);
        setMetaTag('twitter:title', fullTitle, false);
        setMetaTag('twitter:description', description, false);
        setMetaTag('twitter:image', cover, false);
        setFavicon(cover);
    } else {
        document.title = 'Beatsify';
        setMetaTag('og:title', 'Beatsify', true);
        setMetaTag('og:description', 'Beatsify - Web Music Player', true);
        setMetaTag('og:image', 'https://www.gobox.my.id/file/uZKDQkZ3c5VK.png', true);
        setMetaTag('twitter:title', 'Beatsify', false);
        setMetaTag('twitter:description', 'Beatsify - Web Music Player', false);
        setMetaTag('twitter:image', 'https://www.gobox.my.id/file/uZKDQkZ3c5VK.png', false);
        setFavicon(null);
    }
}

function UU(){
    if(!S.ct) {
        updateOG(null);
        if(typeof MP !== 'undefined' && MP.hide) MP.hide();
        return;
    }
    if (S.ct && S.ct.cover) {
        S.ct.cover = toHDCover(S.ct.cover, S.ct.videoId || S.ct.id);
    }
    var mc=gid('mini-cover'),mt=gid('mini-title'),ma=gid('mini-artist'),fc=gid('full-cover'),ft=gid('full-title'),fa=gid('full-artist'),fh=gid('full-header-artist'),fb=gid('full-bg-blur'),fba=gid('full-bg-artwork');
    if(mc){ mc.src=S.ct.cover; mc.onerror=function(){ handleImgError(this); }; }
    if(mt)mt.innerText=S.ct.title;
    if(ma)ma.innerText=S.ct.artist;
    if(fc){ fc.src=S.ct.cover; fc.onerror=function(){ handleImgError(this); }; }
    if(ft)ft.innerText=S.ct.title;
    if(fa)fa.innerText=S.ct.artist;
    if(fh)fh.innerText=S.ct.artist;
    if(fb)fb.src=S.ct.cover;
    if(fba)fba.src=S.ct.cover;
    updateOG(S.ct.title,S.ct.cover,S.ct.artist);
    if(typeof updateLikeButtons==='function')updateLikeButtons();
    if(typeof MP !== 'undefined' && MP.updateBeats) MP.updateBeats(S.ct);
    if(typeof FullPlayer !== 'undefined' && FullPlayer.updateBeats) FullPlayer.updateBeats(S.ct);
}

function PK(s,i){
    var l=[];if(s==='home1')l=S.ht.slice(0,6);else if(s==='home2')l=S.ht.slice(6,12);else if(s==='homecat')l=S.hc||[];else if(s==='search')l=S.sr;else if(s==='playlist')l=S.pl;else if(s==='rec0')l=S.rec0||[];else if(s==='rec1')l=S.rec1||[];else if(s==='rec2')l=S.rec2||[];
    if(!l[i])return;
    if(S.ct && (S.ct.id === l[i].id || S.ct.videoId === l[i].videoId) && AU.src){
        if(typeof MP !== 'undefined' && MP.togglePlay) { MP.togglePlay(); return; }
    }
    S.ps=s;S.pl=l;S.pi=i;S.ct=l[i];
    var url=location.origin+'/play/'+S.ct.videoId;history.pushState({},'',url);
    UU();MP.show();S.il=true;UB();
    resetLyricsUI(S.ct.videoId);
    loadTrack(S.ct);
}

function loadTrack(track,resumeAt){
    if(!track)return;
    ST();
    try{AU.pause();}catch(e){}
    addToHistory(track);
    fetchAudioAndPlay(track,resumeAt);
}

async function fetchAudioAndPlay(track,resumeAt){
    S.il=true;UB();
    try{
        var ytUrl=track.ytUrl||('https://youtube.com/watch?v='+track.videoId);
        var r=await fetch(API.ytplay,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:ytUrl})});
        var d=await r.json();
        if(S.ct!==track)return;
        if(d&&d.status&&d.result&&d.result.download&&d.result.download.audio){
            var audioUrl = d.result.download.audio;
            if (audioCtx) {
                AU.src = '/api/proxy-audio?url=' + encodeURIComponent(audioUrl);
            } else {
                AU.removeAttribute('crossorigin');
                AU.src = audioUrl;
            }
            if(resumeAt){
                var onMeta=function(){AU.currentTime=resumeAt;AU.removeEventListener('loadedmetadata',onMeta);};
                AU.addEventListener('loadedmetadata',onMeta);
            }
            AU.play().catch(function(){});
        }else{
            S.il=false;S.ip=false;UB();
        }
    }catch(e){
        if(S.ct===track){S.il=false;S.ip=false;UB();}
    }
}

function TP(){
    if(!S.ct)return;
    if(!AU.src)return;
    if(AU.paused)AU.play().catch(function(){});else AU.pause();
}
function NX(){
    if(!S.pl || !S.pl.length)return;
    if(S.isShuffle && S.pl.length > 1){
        var ri = S.pi;
        var attempts = 0;
        while(ri === S.pi && attempts < 10){
            ri = Math.floor(Math.random() * S.pl.length);
            attempts++;
        }
        PK(S.ps, ri);
    } else {
        var ni = S.pi + 1;
        if(ni >= S.pl.length){ ni = 0; }
        PK(S.ps, ni);
    }
}
function PV(){
    if(!S.pl || !S.pl.length)return;
    if(S.pt > 3){
        AU.currentTime = 0;
        return;
    }
    var pi = S.pi - 1;
    if(pi < 0) pi = S.pl.length - 1;
    PK(S.ps, pi);
}
function SK(v){
    if(AU.duration){
        var ct=(parseFloat(v)/100)*AU.duration;
        AU.currentTime=ct;
        S.pt=ct;
        renderProgress();
    }
}
function TR(){var b=gid('btn-repeat'),o=gid('repeat-one');if(S.rm==='all'){S.rm='one';if(b)b.classList.add('text-white');if(o)o.classList.remove('hidden');}else{S.rm='all';if(b)b.classList.remove('text-white');if(o)o.classList.add('hidden');}}
function updateShuffleUI(){
    var btn = gid('full-shuffle-btn');
    var dot = gid('full-shuffle-dot');
    var accent = S.currentAccentColor || '#f43f5e';
    if(btn){
        if(S.isShuffle){
            btn.style.color = accent;
            btn.classList.add('scale-110');
            if(dot){
                dot.classList.remove('hidden');
                dot.style.backgroundColor = accent;
            }
        }else{
            btn.style.color = '#6b7280';
            btn.classList.remove('scale-110');
            if(dot) dot.classList.add('hidden');
        }
    }
}
function toggleAutoNext(){
    S.autoNext = !S.autoNext;
    try { localStorage.setItem('hanz_auto_next', S.autoNext); } catch(e) {}
    if(typeof showToast === 'function'){
        showToast(S.autoNext ? 'Auto Next diaktifkan' : 'Auto Next dimatikan');
    }
}
function SF(){
    S.isShuffle = !S.isShuffle;
    updateShuffleUI();
    if(typeof showToast === 'function'){
        showToast(S.isShuffle ? 'Mode acak (Shuffle) diaktifkan' : 'Mode acak (Shuffle) dimatikan');
    }
}
function toggleLyricsTranslate(){
    S.lyricsTranslate = !S.lyricsTranslate;
    try { localStorage.setItem('hanz_lyrics_translate', S.lyricsTranslate); } catch(e) {}
    if(typeof showToast === 'function'){
        showToast(S.lyricsTranslate ? 'Terjemahan lirik diaktifkan' : 'Terjemahan lirik dimatikan');
    }
    if(S.ct && S.ct.videoId && typeof FL === 'function') FL(S.ct.videoId);
}

function shareTrack(){if(!S.ct||!S.ct.videoId)return;var url=location.origin+'/play/'+S.ct.videoId+'?share=true';updateOG(S.ct.title,S.ct.cover);if(navigator.share){navigator.share({title:S.ct.title,text:S.ct.title+' - '+S.ct.artist,url:url}).catch(function(){});}}

function resetLyricsUI(vid){
    S.ld={type:'none',lines:[]};S.cli=-1;S.lyricOffset=0;
    var lc=gid('lyrics-loading'),cc=gid('lyrics-content'),ec=gid('lyrics-empty');
    if(lc)lc.classList.remove('hidden');
    if(cc){cc.classList.add('hidden');cc.innerHTML='';}
    if(ec)ec.classList.add('hidden');
    updateSyncBadge();
    if (S.ct) {
        ['lyrics-header-cover', 'lyrics-desktop-cover', 'lyrics-bg-blur'].forEach(function(id){
            var el = gid(id); if(el) el.src = S.ct.cover || FI;
        });
        ['lyrics-header-title', 'lyrics-desktop-title'].forEach(function(id){
            var el = gid(id); if(el) el.innerText = S.ct.title || 'Unknown';
        });
        ['lyrics-header-artist', 'lyrics-desktop-artist'].forEach(function(id){
            var el = gid(id); if(el) el.innerText = S.ct.artist || 'Unknown';
        });
    }
    if(vid)FL(vid);
}

var lastUserLyricScroll = 0;
var lastUserInlineLyricScroll = 0;

function setupLyricScrollListener() {
    var container = gid('lyrics-scroll-container');
    if (container && !container._hasLyricScrollListener) {
        container._hasLyricScrollListener = true;
        var onUserTouch = function() {
            lastUserLyricScroll = Date.now();
        };
        container.addEventListener('touchstart', onUserTouch, { passive: true });
        container.addEventListener('touchmove', onUserTouch, { passive: true });
        container.addEventListener('wheel', onUserTouch, { passive: true });
        container.addEventListener('mousedown', onUserTouch, { passive: true });
    }

    var inlineContainer = gid('full-inline-lyrics-scroll');
    if (inlineContainer && !inlineContainer._hasLyricScrollListener) {
        inlineContainer._hasLyricScrollListener = true;
        var onUserInlineTouch = function() {
            lastUserInlineLyricScroll = Date.now();
        };
        inlineContainer.addEventListener('touchstart', onUserInlineTouch, { passive: true });
        inlineContainer.addEventListener('touchmove', onUserInlineTouch, { passive: true });
        inlineContainer.addEventListener('wheel', onUserInlineTouch, { passive: true });
        inlineContainer.addEventListener('mousedown', onUserInlineTouch, { passive: true });
    }
}

var lyricScrollAnim = null;
function smoothScrollLyricContainer(container, targetTop, duration) {
    if (!container) return;
    if (duration === 0) {
        container.scrollTop = targetTop;
        return;
    }
    try {
        container.scrollTo({
            top: targetTop,
            behavior: 'smooth'
        });
    } catch (e) {
        container.scrollTop = targetTop;
    }
}

async function fetchLyricsFrom(source, vid, translateFlag, lang){
    var endpoint = API[source] || API.lyrics;
    var r = await fetch(endpoint+'?id='+vid+'&translate='+translateFlag+'&lang='+lang+'&t='+Date.now());
    return await r.json();
}

async function FL(vid){
    var l=gid('lyrics-loading'),c=gid('lyrics-content'),e=gid('lyrics-empty');
    var il=gid('full-inline-lyrics-loading'),ic=gid('full-inline-lyrics-content'),ie=gid('full-inline-lyrics-empty');
    if(l) l.classList.remove('hidden');
    if(il) il.classList.remove('hidden');
    if(c) { c.classList.add('hidden'); c.innerHTML=''; delete c._lyricLines; delete c._activeLine; }
    if(ic) { ic.classList.add('hidden'); ic.innerHTML=''; delete ic._lyricLines; delete ic._activeLine; }
    if(e) e.classList.add('hidden');
    if(ie) ie.classList.add('hidden');
    S.ld={type:'none',lines:[]};S.cli=-1;S.lyricOffset=0;updateSyncBadge();
    try{
        var trFlag = S.lyricsTranslate ? '1' : '0';
        var lang = 'id';
        // Coba lirik.js dulu; kalau belum ada, otomatis fallback ke lyrics1.js.
        var d = await fetchLyricsFrom('lyrics', vid, trFlag, lang);
        if(!(d.status && d.result && d.result.lyrics && d.result.lyrics.lines.length>0)){
            try{ d = await fetchLyricsFrom('lyrics1', vid, trFlag, lang); }catch(e2){}
        }
        if(d.status&&d.result.lyrics&&d.result.lyrics.lines.length>0){
            S.ld=d.result.lyrics;var html='';var inlineHtml='';
            var isPlain = S.ld.type === 'plain';
            S.ld.lines.forEach(function(li,i){
                var transHtml = '';
                if (li.translation && li.translation.trim()) {
                    transHtml = '<span class="lyric-translation">(' + es(li.translation) + ')</span>';
                }
                if (isPlain) {
                    html+='<p class="lyric-line text-left py-2.5 text-white/80 font-bold">'+es(li.text)+transHtml+'</p>';
                    inlineHtml+='<p class="inline-lyric-line text-left py-1.5 text-white/80 font-bold">'+es(li.text)+transHtml+'</p>';
                } else {
                    html+='<p class="lyric-line text-left py-2.5 cursor-pointer font-bold" data-time="'+li.time+'" onclick="SLT('+li.time+')">'+es(li.text)+transHtml+'</p>';
                    inlineHtml+='<p class="inline-lyric-line text-left py-1.5 cursor-pointer font-bold" data-time="'+li.time+'" onclick="SLT('+li.time+')">'+es(li.text)+transHtml+'</p>';
                }
            });
            html+='<p class="text-left text-[#4b5563] text-sm mt-12 mb-4 opacity-50 tracking-widest">end</p>';
            inlineHtml+='<p class="text-left text-[#4b5563] text-xs mt-8 mb-2 opacity-50 tracking-widest">end</p>';
            if(c) { 
                 c.innerHTML='<div class="pt-[35vh] pb-[50vh] space-y-2 sm:space-y-3">'+html+'</div>';
                 c.classList.remove('hidden');
                 delete c._lyricLines;
                 delete c._activeLine;
             }
            if(ic) {
                 ic.innerHTML='<div class="pt-[40%] pb-[50%] space-y-1">'+inlineHtml+'</div>';
                 ic.classList.remove('hidden');
                 delete ic._lyricLines;
                 delete ic._activeLine;
             }
            if(l) l.classList.add('hidden');
            if(il) il.classList.add('hidden');
            S.cli = -2;
            if (!isPlain) ULH(S.pt, true);
        }else{
            if(l)l.classList.add('hidden');if(e)e.classList.remove('hidden');
            if(il)il.classList.add('hidden');if(ie)ie.classList.remove('hidden');
        }
    }catch(er){
        if(l)l.classList.add('hidden');if(e)e.classList.remove('hidden');
        if(il)il.classList.add('hidden');if(ie)ie.classList.remove('hidden');
    }
}

function ULH(ct, forceScroll){
    var lyricsVisible = S.lo || (typeof FullPlayer !== 'undefined' && FullPlayer.currentViewMode === 'lyrics');
    if(!lyricsVisible) return;
    if(!S.ld || !S.ld.lines || S.ld.lines.length===0 || S.ld.type === 'plain') return;
    var checkTime = ct + 0.18;
    var ni=-1;
    for(var i=0; i<S.ld.lines.length; i++){
        if(checkTime >= S.ld.lines[i].time){ ni=i; }
    }
    var off=S.lyricOffset||0;
    var ei=ni+off;
    if(ei<-1) ei=-1;
    if(ei>S.ld.lines.length-1) ei=S.ld.lines.length-1;
    if(ei === S.cli && !forceScroll) return;
    S.cli = ei;
    var container = gid('lyrics-scroll-container');
    var content = gid('lyrics-content');
    if(content){
        if(!content._lyricLines || content._lyricLines.length === 0){
            content._lyricLines = content.querySelectorAll('.lyric-line');
        }
        if(content._lyricLines && content._lyricLines.length > 0) {
            content._lyricLines.forEach(function(line, idx){
                if(idx === ei) {
                    line.classList.add('active-lyric');
                    line.classList.remove('past-lyric');
                } else if (idx < ei) {
                    line.classList.remove('active-lyric');
                    line.classList.add('past-lyric');
                } else {
                    line.classList.remove('active-lyric');
                    line.classList.remove('past-lyric');
                }
            });
        }
        if(ei >= 0 && content._lyricLines[ei] && container && (forceScroll || Date.now() - lastUserLyricScroll > 2500)) {
            var targetLine = content._lyricLines[ei];
            var targetTop = targetLine.offsetTop;
            var targetHeight = targetLine.offsetHeight;
            var containerHeight = container.clientHeight;
            var offset = Math.max(0, Math.floor(targetTop - (containerHeight / 2) + (targetHeight / 2)));
            smoothScrollLyricContainer(container, offset, forceScroll ? 0 : 300);
        }
    }

    var inlineContainer = gid('full-inline-lyrics-scroll');
    var inlineContent = gid('full-inline-lyrics-content');
    if(inlineContent){
        if(!inlineContent._lyricLines || inlineContent._lyricLines.length === 0){
            inlineContent._lyricLines = inlineContent.querySelectorAll('.inline-lyric-line');
        }
        if(inlineContent._lyricLines && inlineContent._lyricLines.length > 0) {
            inlineContent._lyricLines.forEach(function(line, idx){
                if(idx === ei) {
                    line.classList.add('active-lyric');
                    line.classList.remove('past-lyric');
                } else if (idx < ei) {
                    line.classList.remove('active-lyric');
                    line.classList.add('past-lyric');
                } else {
                    line.classList.remove('active-lyric');
                    line.classList.remove('past-lyric');
                }
            });
        }
        if(ei >= 0 && inlineContent._lyricLines[ei] && inlineContainer && (forceScroll || Date.now() - lastUserInlineLyricScroll > 2500)) {
            var iTargetLine = inlineContent._lyricLines[ei];
            var iTargetTop = iTargetLine.offsetTop;
            var iTargetHeight = iTargetLine.offsetHeight;
            var iContainerHeight = inlineContainer.clientHeight;
            var iOffset = Math.max(0, Math.floor(iTargetTop - (iContainerHeight / 2) + (iTargetHeight / 2)));
            smoothScrollLyricContainer(inlineContainer, iOffset, forceScroll ? 0 : 300);
        }
    }
}

function SLT(t){
    if(AU){
        AU.currentTime=t;
        S.pt=t;
        ULH(t, true);
    }
}

function adjustLyricSync(delta){
    if(!S.ld||!S.ld.lines||S.ld.lines.length===0){showToast('Lirik belum tersedia');return;}
    var max=S.ld.lines.length-1;
    S.lyricOffset=(S.lyricOffset||0)+delta;
    if(S.lyricOffset>max)S.lyricOffset=max;
    if(S.lyricOffset<-max)S.lyricOffset=-max;
    S.cli=-2;
    ULH(S.pt, true);
    updateSyncBadge();
    showToast((delta>0?'Lirik maju':'Lirik mundur')+' 1 baris');
}
function lyricSyncNext(){adjustLyricSync(1);}
function lyricSyncPrev(){adjustLyricSync(-1);}
function updateSyncBadge(){
    var o=S.lyricOffset||0;
    var badgeText = o===0 ? '' : (o>0?'+':'')+o;
    var dBadge = gid('lyric-sync-badge-desktop');
    var mBadge = gid('lyric-sync-badge-mobile');
    var iBadge = gid('full-inline-sync-badge');
    if(o===0){
        if(dBadge) dBadge.classList.add('hidden');
        if(mBadge) mBadge.classList.add('hidden');
        if(iBadge) iBadge.classList.add('hidden');
    }else{
        if(dBadge){ dBadge.classList.remove('hidden'); dBadge.innerText=badgeText; }
        if(mBadge){ mBadge.classList.remove('hidden'); mBadge.innerText=badgeText; }
        if(iBadge){ iBadge.classList.remove('hidden'); iBadge.innerText=badgeText; }
    }
}

function toggleLyrics(){
    var o=gid('lyrics-overlay');
    var fp=gid('full-player');
    if(S.lo){
        o.style.transform='translateY(100%)';
        setTimeout(function(){o.style.display='none';},350);
        S.lo=false;
        if(S.lfp) {
            if(typeof FullPlayer!=='undefined') FullPlayer.open();
        } else {
            MP.show();
        }
    }else{
        if(fp && fp.style.display === 'flex' && (fp.style.transform === 'translateY(0)' || fp.style.transform === 'translateY(0px)' || fp.style.transform === 'translateY(0%)')) {
            S.lfp = true;
            if(typeof FullPlayer!=='undefined') FullPlayer.close();
        } else {
            S.lfp = false;
        }
        o.style.display='flex';
        if (S.ct) {
            ['lyrics-header-cover', 'lyrics-desktop-cover', 'lyrics-bg-blur'].forEach(function(id){
                var el = gid(id); if(el) el.src = S.ct.cover || FI;
            });
            ['lyrics-header-title', 'lyrics-desktop-title'].forEach(function(id){
                var el = gid(id); if(el) el.innerText = S.ct.title || 'Unknown';
            });
            ['lyrics-header-artist', 'lyrics-desktop-artist'].forEach(function(id){
                var el = gid(id); if(el) el.innerText = S.ct.artist || 'Unknown';
            });
        }
        requestAnimationFrame(function(){
            requestAnimationFrame(function(){
                o.style.transform='translateY(0)';
            });
        });
        S.lo=true;
        if(!S.lfp) MP.hide();
        setupLyricScrollListener();
        if(S.ct&&S.ct.videoId&&S.ld.lines.length===0){
            FL(S.ct.videoId);
        } else {
            S.cli = -2;
            ULH(S.pt, true);
        }
    }
}

function getLikedSongs(){
    try{return JSON.parse(localStorage.getItem('hanz_liked_songs')||'[]');}catch(e){return[];}
}
function saveLikedSongs(songs){
    try{localStorage.setItem('hanz_liked_songs',JSON.stringify(songs));}catch(e){}
}
function isLikedSong(videoId){
    if(!videoId) return false;
    var songs = getLikedSongs();
    return songs.some(function(s){ return s.videoId === videoId; });
}
function toggleLikeSong(track){
    if(!track || !track.videoId) return;
    var songs = getLikedSongs();
    var index = songs.findIndex(function(s){ return s.videoId === track.videoId; });
    if(index >= 0){
        songs.splice(index, 1);
        saveLikedSongs(songs);
        showToast('Dihapus dari Lagu Disukai');
    } else {
        songs.unshift({
            id: track.id || track.videoId,
            videoId: track.videoId,
            title: track.title,
            artist: track.artist,
            cover: track.cover,
            artistId: track.artistId || '',
            ytUrl: track.ytUrl || ('https://youtube.com/watch?v=' + track.videoId)
        });
        saveLikedSongs(songs);
        showToast('Ditambahkan ke Lagu Disukai');
    }
    updateLikeButtons();
    if(S.at === 'library' && typeof Library !== 'undefined') {
        Library.render();
    }
}
function toggleCurrentLike(){
    if(!S.ct) return;
    toggleLikeSong(S.ct);
}

function getLikedArtists(){
    try{return JSON.parse(localStorage.getItem('hanz_liked_artists')||'[]');}catch(e){return[];}
}
function saveLikedArtists(artists){
    try{localStorage.setItem('hanz_liked_artists',JSON.stringify(artists));}catch(e){}
}
function isArtistLiked(artistId){
    if(!artistId) return false;
    var artists = getLikedArtists();
    return artists.some(function(a){ return a.artistId === artistId; });
}
function toggleLikeArtist(artist){
    if(!artist || !artist.artistId) return;
    var artists = getLikedArtists();
    var index = artists.findIndex(function(a){ return a.artistId === artist.artistId; });
    if(index >= 0){
        artists.splice(index, 1);
        saveLikedArtists(artists);
        showToast('Dihapus dari Artist Disukai');
    } else {
        artists.unshift({
            artistId: artist.artistId,
            name: artist.name,
            thumbnail: artist.thumbnail
        });
        saveLikedArtists(artists);
        showToast('Ditambahkan ke Artist Disukai');
    }
    if(S.at === 'library' && typeof Library !== 'undefined') {
        Library.render();
    }
    if(typeof Artist !== 'undefined' && Artist.currentArtistId === artist.artistId) {
        Artist.updateLikeBtn();
    }
}

function updateLikeButtons(){
    var isLiked = S.ct ? isLikedSong(S.ct.videoId) : false;
    var miniBtn = gid('mini-like-btn');
    var fullBtn = gid('full-like-btn');
    if(miniBtn){
        if(isLiked){
            miniBtn.innerHTML = '<i data-lucide="heart" class="w-4 h-4 text-rose-500 fill-rose-500"></i>';
            miniBtn.classList.add('text-rose-500');
        } else {
            miniBtn.innerHTML = '<i data-lucide="heart" class="w-4 h-4"></i>';
            miniBtn.classList.remove('text-rose-500');
        }
    }
    if(fullBtn){
        if(isLiked){
            fullBtn.innerHTML = '<i data-lucide="heart" class="w-5 h-5 text-rose-500 fill-rose-500"></i>';
            fullBtn.classList.add('bg-rose-500/20', 'border-rose-500/40');
            fullBtn.classList.remove('bg-black/50', 'border-white/20');
        } else {
            fullBtn.innerHTML = '<i data-lucide="heart" class="w-5 h-5 text-white"></i>';
            fullBtn.classList.remove('bg-rose-500/20', 'border-rose-500/40');
            fullBtn.classList.add('bg-black/50', 'border-white/20');
        }
    }
    if(typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

function getUserPlaylists(){
    try{
        var pls=JSON.parse(localStorage.getItem('hanz_playlists')||'[]');
        var changed=false;
        pls.forEach(function(p){
            if(p.image && (p.image.includes('uZKDQkZ3c5VK.png') || p.image.includes('logo.png'))){
                p.image='';
                changed=true;
            }
            if(p.songs && p.songs.length){
                p.songs.forEach(function(s){
                    if(!s.cover || s.cover.includes('uZKDQkZ3c5VK.png') || s.cover.includes('logo.png')){
                        s.cover = toHDCover('', s.videoId);
                        changed=true;
                    }
                });
            }
            if(!p.image&&p.songs&&p.songs.length>0){
                p.image=p.songs[0].cover;
                changed=true;
            }
        });
        if(changed){
            localStorage.setItem('hanz_playlists',JSON.stringify(pls));
        }
        return pls;
    }catch(e){return[];}
}
function saveUserPlaylists(pls){try{localStorage.setItem('hanz_playlists',JSON.stringify(pls));}catch(e){}}
var HISTORY_MAX_DAYS=7;
var HISTORY_MAX_ITEMS=100;
function getPlayHistory(){
    try{
        var raw=JSON.parse(localStorage.getItem('hanz_history')||'[]');
        var cutoff=Date.now()-(HISTORY_MAX_DAYS*24*60*60*1000);
        var filtered=raw.filter(function(h){return h.playedAt>=cutoff;});
        if(filtered.length!==raw.length){
            localStorage.setItem('hanz_history',JSON.stringify(filtered));
        }
        return filtered;
    }catch(e){return[];}
}
function addToHistory(track){
    if(!track||!track.videoId)return;
    try{
        var history=getPlayHistory();
        history=history.filter(function(h){return h.videoId!==track.videoId;});
        history.unshift({
            id:track.id||track.videoId,
            videoId:track.videoId,
            title:track.title,
            artist:track.artist,
            cover:track.cover,
            artistId:track.artistId||'',
            ytUrl:track.ytUrl||('https://youtube.com/watch?v='+track.videoId),
            playedAt:Date.now()
        });
        if(history.length>HISTORY_MAX_ITEMS)history=history.slice(0,HISTORY_MAX_ITEMS);
        localStorage.setItem('hanz_history',JSON.stringify(history));
        if(S.at==='library'&&typeof Library!=='undefined'&&Library.activeTab==='history'){
            Library.render();
        }
    }catch(e){}
}
function removeHistoryItem(index){
    var history=getPlayHistory();
    if(!history[index])return;
    history.splice(index,1);
    try{localStorage.setItem('hanz_history',JSON.stringify(history));}catch(e){}
    if(typeof Library!=='undefined')Library.render();
}
function clearPlayHistory(){
    try{localStorage.removeItem('hanz_history');}catch(e){}
    if(typeof Library!=='undefined')Library.render();
}
function timeAgo(ts){
    var diff=Math.max(0,Date.now()-ts);
    var mins=Math.floor(diff/60000);
    if(mins<1)return'Baru saja';
    if(mins<60)return mins+' menit lalu';
    var hours=Math.floor(mins/60);
    if(hours<24)return hours+' jam lalu';
    var days=Math.floor(hours/24);
    return days+' hari lalu';
}
function createPlaylist(name,image){var pls=getUserPlaylists();var id='pl_'+Date.now();pls.push({id:id,name:name,image:image||'',songs:[]});saveUserPlaylists(pls);return id;}
function updateUserPlaylist(id,name,image){var pls=getUserPlaylists();var pl=pls.find(function(p){return p.id===id;});if(!pl)return;if(name)pl.name=name;if(image)pl.image=image;saveUserPlaylists(pls);}
function deleteUserPlaylist(id){var pls=getUserPlaylists().filter(function(p){return p.id!==id;});saveUserPlaylists(pls);}
function addToPlaylistById(playlistId,track){var pls=getUserPlaylists();var pl=pls.find(function(p){return p.id===playlistId;});if(!pl)return;if(pl.songs.length>=15){showToast('Playlist penuh (Max 15)');return;}var exists=pl.songs.find(function(s){return s.videoId===track.videoId;});if(!exists){pl.songs.push({id:track.id,videoId:track.videoId,title:track.title,artist:track.artist,cover:track.cover,artistId:track.artistId||'',ytUrl:track.ytUrl});if(!pl.image&&pl.songs.length===1){pl.image=track.cover;}saveUserPlaylists(pls);showToast('Ditambahkan ke '+pl.name);}else{showToast('Sudah ada di playlist');}}
function showToast(msg){var toast=document.createElement('div');toast.className='fixed bottom-24 left-1/2 -translate-x-1/2 bg-white text-black font-bold px-5 py-2.5 rounded-full z-[999]';toast.style.animation='slideUp 0.3s ease-out forwards';toast.innerText=msg;document.body.appendChild(toast);setTimeout(function(){toast.remove();},2000);}
function addCurrentToPlaylist(){if(!S.ct)return;var pls=getUserPlaylists();if(pls.length===0){showToast('Belum ada playlist! Buat di Library dulu');return;}showPlaylistPicker(S.ct);}
function showPlaylistPicker(track){var pls=getUserPlaylists();var popup=document.createElement('div');popup.className='fixed inset-0 z-[300] flex items-end justify-center bg-black/60';popup.onclick=function(e){if(e.target===popup)popup.remove();};var listHtml=pls.map(function(p){return'<button onclick="addToPlaylistById(\''+p.id+'\',S.ct);this.parentElement.parentElement.remove();" class="w-full text-left p-4 hover:bg-white/5 flex items-center gap-3 border-b border-white/5"><img src="'+(p.image||(p.songs.length>0?p.songs[0].cover:FI))+'" class="w-10 h-10 rounded object-cover" /><div><p class="font-medium text-white">'+p.name+'</p><p class="text-[#6b7280] text-xs">'+p.songs.length+' lagu</p></div></button>';}).join('');popup.innerHTML='<div class="bg-[#1a1a1a] w-full max-w-md rounded-t-3xl p-6 border-t border-white/10" style="animation:slideUp 0.3s ease-out forwards;"><div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div><h3 class="font-bold text-white mb-3">Tambah ke Playlist</h3><div class="max-h-72 overflow-y-auto hide-scrollbar">'+listHtml+'</div><button onclick="this.parentElement.parentElement.remove()" class="w-full mt-3 py-3 border border-white/20 text-white rounded-full">Batal</button></div>';document.body.appendChild(popup);}

var audioCtx = null;
var sourceNode = null;
var filters = [];

function setupWebAudioEQ() {
    if (audioCtx) return;
    try {
        var AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        audioCtx = new AudioContextClass();
        var AU_el = gid('audio-player');
        if (!AU_el) return;
        AU_el.crossOrigin = "anonymous";
        sourceNode = audioCtx.createMediaElementSource(AU_el);
        var freqs = [60, 230, 910, 4000, 14000];
        var lastNode = sourceNode;
        filters = freqs.map(function(f, idx) {
            var filter = audioCtx.createBiquadFilter();
            filter.type = idx === 0 ? 'lowshelf' : (idx === 4 ? 'highshelf' : 'peaking');
            filter.frequency.value = f;
            filter.Q.value = 1.0;
            filter.gain.value = S.eqBands ? S.eqBands[idx] : 0;
            lastNode.connect(filter);
            lastNode = filter;
            return filter;
        });
        lastNode.connect(audioCtx.destination);
    } catch(e) {}
}

function updateEQGain(bandIdx, gainValue) {
    if (!S.eqBands) S.eqBands = [0, 0, 0, 0, 0];
    S.eqBands[bandIdx] = parseFloat(gainValue);
    if (filters && filters[bandIdx]) {
        try {
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            filters[bandIdx].gain.value = parseFloat(gainValue);
        } catch(e) {}
    }
}

function handleTrackEnded() {
    if (S.sleepEndWithTrack) {
        triggerSleep();
        return true;
    }
    return false;
}

var sleepIntervalId = null;

function startSleepTimer(minutes) {
    clearSleepTimer();
    var seconds = minutes * 60;
    S.sleepSecondsLeft = seconds;
    S.sleepEndWithTrack = false;
    updateSleepBadge();
    sleepIntervalId = setInterval(function() {
        if (S.sleepSecondsLeft > 0) {
            S.sleepSecondsLeft--;
            updateSleepBadge();
            var timerDisplay = gid('sleep-countdown-display');
            if (timerDisplay) {
                timerDisplay.innerText = fm(S.sleepSecondsLeft);
            }
        } else {
            triggerSleep();
        }
    }, 1000);
    showToast('Timer tidur diatur: ' + minutes + ' menit');
    closeSleepTimer();
}

function startSleepAtTrackEnd() {
    clearSleepTimer();
    S.sleepEndWithTrack = true;
    updateSleepBadge();
    showToast('Musik akan berhenti di akhir lagu ini');
    closeSleepTimer();
}

function clearSleepTimer() {
    if (sleepIntervalId) {
        clearInterval(sleepIntervalId);
        sleepIntervalId = null;
    }
    S.sleepSecondsLeft = 0;
    S.sleepEndWithTrack = false;
    updateSleepBadge();
    var popup = gid('sleep-timer-popup');
    if (popup) {
        closeSleepTimer();
        setTimeout(openSleepTimer, 100);
    }
}

function triggerSleep() {
    if (sleepIntervalId) {
        clearInterval(sleepIntervalId);
        sleepIntervalId = null;
    }
    S.sleepSecondsLeft = 0;
    S.sleepEndWithTrack = false;
    updateSleepBadge();
    if (AU) {
        try { AU.pause(); } catch(e){}
    }
    S.ip = false;
    UB();
    ST();
    showToast('Timer tidur selesai, musik dihentikan');
}

function updateSleepBadge() {
    var badge = gid('sleep-badge');
    var dot = gid('sleep-dot');
    if (!badge) return;
    if (S.sleepSecondsLeft > 0) {
        var mins = Math.ceil(S.sleepSecondsLeft / 60);
        badge.innerText = mins + 'm';
        if (dot) dot.classList.remove('hidden');
    } else if (S.sleepEndWithTrack) {
        badge.innerText = 'Akhir Lagu';
        if (dot) dot.classList.remove('hidden');
    } else {
        badge.innerText = 'Timer';
        if (dot) dot.classList.add('hidden');
    }
}

function openSleepTimer() {
    if (gid('sleep-timer-popup')) return;
    var popup = document.createElement('div');
    popup.id = 'sleep-timer-popup';
    popup.className = 'fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
    popup.onclick = function(e) { if(e.target === popup) closeSleepTimer(); };
    var contentHtml = '';
    if (S.sleepSecondsLeft > 0) {
        contentHtml = '<div class="text-center mb-6">' +
            '<p class="text-xs text-[#6b7280] uppercase tracking-wider mb-1">Timer Sedang Berjalan</p>' +
            '<h4 id="sleep-countdown-display" class="text-3xl font-black font-mono text-white">' + fm(S.sleepSecondsLeft) + '</h4>' +
            '<button onclick="clearSleepTimer()" class="mt-4 px-6 py-2.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all">Batalkan Timer</button>' +
        '</div>';
    } else if (S.sleepEndWithTrack) {
        contentHtml = '<div class="text-center mb-6">' +
            '<p class="text-sm text-[#cfd3d8] font-bold mb-1">Berhenti di akhir lagu aktif</p>' +
            '<p class="text-[11px] text-[#6b7280] mb-4">Lagu akan berhenti setelah lagu ini selesai diputar.</p>' +
            '<button onclick="clearSleepTimer()" class="px-6 py-2.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all">Batalkan Timer</button>' +
        '</div>';
    } else {
        var options = [5, 10, 15, 30, 45, 60];
        var gridHtml = options.map(function(m) {
            return '<button onclick="startSleepTimer(' + m + ')" class="py-3 px-4 rounded-2xl bg-white/5 border border-white/5 text-sm text-white font-medium hover:bg-white/10 active:scale-95 transition-all">' + m + ' Menit</button>';
        }).join('');
        contentHtml = '<div class="grid grid-cols-3 gap-3 mb-4">' + gridHtml + '</div>' +
            '<button onclick="startSleepAtTrackEnd()" class="w-full py-3.5 px-4 rounded-2xl bg-[#cfd3d8]/10 hover:bg-[#cfd3d8]/20 border border-white/10 text-xs text-white font-bold active:scale-95 transition-all flex items-center justify-center gap-2">' +
                '<i data-lucide="music-4" class="w-4 h-4"></i> Hentikan di Akhir Lagu' +
            '</button>';
    }
    popup.innerHTML = '<div class="w-full max-w-md rounded-t-3xl p-6 border-t border-white/10 glass-strong" style="animation:slideUp 0.3s ease-out forwards; background: var(--bg-color);">' +
        '<div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>' +
        '<div class="flex justify-between items-center mb-5">' +
            '<div>' +
                '<h3 class="font-black text-white text-lg">Timer Tidur</h3>' +
                '<p class="text-[#6b7280] text-xs">Hentikan musik secara otomatis saat tidur</p>' +
            '</div>' +
            '<button onclick="closeSleepTimer()" class="text-[#6b7280] hover:text-white p-1"><i data-lucide="x" class="w-5 h-5"></i></button>' +
        '</div>' +
        contentHtml +
    '</div>';
    document.body.appendChild(popup);
    lucide.createIcons();
}

function closeSleepTimer() {
    var p = gid('sleep-timer-popup');
    if (p) p.remove();
}

function openPlaybackSpeed() {
    if (gid('playback-speed-popup')) return;
    var popup = document.createElement('div');
    popup.id = 'playback-speed-popup';
    popup.className = 'fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
    popup.onclick = function(e) { if(e.target === popup) closePlaybackSpeed(); };
    var speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
    var currentSpeed = S.playbackRate || 1.0;
    var optionsHtml = speeds.map(function(sp) {
        var isSelected = currentSpeed === sp;
        var btnStyle = isSelected 
            ? 'bg-[#cfd3d8] text-black font-bold border-[#cfd3d8]' 
            : 'bg-white/5 hover:bg-white/10 text-white border-white/5';
        var label = sp === 1.0 ? '1.0x (Normal)' : sp + 'x';
        return '<button onclick="setPlaybackSpeed(' + sp + ')" class="w-full py-3.5 px-4 rounded-2xl border text-sm font-medium active:scale-98 transition-all flex items-center justify-between ' + btnStyle + '">' +
            '<span>' + label + '</span>' +
            (isSelected ? '<i data-lucide="check" class="w-4 h-4 text-black"></i>' : '') +
        '</button>';
    }).join('');
    popup.innerHTML = '<div class="w-full max-w-md rounded-t-3xl p-6 border-t border-white/10 glass-strong" style="animation:slideUp 0.3s ease-out forwards; background: var(--bg-color); max-height: 80vh; overflow-y: auto;">' +
        '<div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>' +
        '<div class="flex justify-between items-center mb-5">' +
            '<div>' +
                '<h3 class="font-black text-white text-lg">Kecepatan Putar</h3>' +
                '<p class="text-[#6b7280] text-xs">Atur kecepatan putar lagu sesuai seleramu</p>' +
            '</div>' +
            '<button onclick="closePlaybackSpeed()" class="text-[#6b7280] hover:text-white p-1"><i data-lucide="x" class="w-5 h-5"></i></button>' +
        '</div>' +
        '<div class="flex flex-col gap-2 mb-4">' +
            optionsHtml +
        '</div>' +
    '</div>';
    document.body.appendChild(popup);
    lucide.createIcons();
}

function setPlaybackSpeed(speed) {
    S.playbackRate = speed;
    try {
        localStorage.setItem('hanz_playback_rate', speed);
    } catch(e) {}
    applyPlaybackSpeed();
    closePlaybackSpeed();
    showToast('Kecepatan putar diatur ke ' + (speed === 1.0 ? 'Normal' : speed + 'x'));
}

function applyPlaybackSpeed() {
    var speed = S.playbackRate || 1.0;
    if (AU) {
        try { AU.playbackRate = speed; } catch(e) {}
    }
    updateSpeedBadge();
}

function updateSpeedBadge() {
    var badge = gid('speed-badge');
    if (!badge) return;
    var speed = S.playbackRate || 1.0;
    badge.innerText = speed === 1.0 ? 'Normal' : speed + 'x';
}

function closePlaybackSpeed() {
    var p = gid('playback-speed-popup');
    if (p) p.remove();
}

function openVolumeControl() {
    if (gid('volume-popup')) return;
    var popup = document.createElement('div');
    popup.id = 'volume-popup';
    popup.className = 'fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
    popup.onclick = function(e) { if(e.target === popup) closeVolumeControl(); };
    var vol = Math.round((AU.volume !== undefined ? AU.volume : 1) * 100);
    popup.innerHTML = '<div class="w-full max-w-md rounded-t-3xl p-6 border-t border-white/10 glass-strong" style="animation:slideUp 0.3s ease-out forwards; background: var(--bg-color);">' +
        '<div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>' +
        '<div class="flex justify-between items-center mb-6">' +
            '<div>' +
                '<h3 class="font-black text-white text-lg">Volume</h3>' +
                '<p class="text-[#6b7280] text-xs">Atur volume pemutaran lagu</p>' +
            '</div>' +
            '<button onclick="closeVolumeControl()" class="text-[#6b7280] hover:text-white p-1"><i data-lucide="x" class="w-5 h-5"></i></button>' +
        '</div>' +
        '<div class="flex items-center gap-3">' +
            '<i data-lucide="volume-1" class="w-5 h-5 text-[#a0a5b0] shrink-0"></i>' +
            '<input type="range" id="volume-slider" min="0" max="100" value="' + vol + '" oninput="setVolumeLevel(this.value)" class="flex-1 h-1.5 rounded-full accent-white cursor-pointer" />' +
            '<i data-lucide="volume-2" class="w-5 h-5 text-[#a0a5b0] shrink-0"></i>' +
        '</div>' +
        '<p id="volume-value" class="text-center text-white font-bold text-sm mt-3">' + vol + '%</p>' +
    '</div>';
    document.body.appendChild(popup);
    lucide.createIcons();
}
function closeVolumeControl() {
    var p = gid('volume-popup');
    if (p) p.remove();
}
function setVolumeLevel(v) {
    var vol = Math.max(0, Math.min(100, parseInt(v, 10) || 0));
    AU.volume = vol / 100;
    try { localStorage.setItem('hanz_volume', vol); } catch(e) {}
    var label = gid('volume-value');
    if (label) label.innerText = vol + '%';
}

function openEqualizer() {
    if (document.getElementById('equalizer-popup')) return;
    if (!S.eqBands) S.eqBands = [0, 0, 0, 0, 0];
    if (!S.activePreset) S.activePreset = 'Normal';
    var hadAudioCtx = !!audioCtx;
    setupWebAudioEQ();
    if (!hadAudioCtx && audioCtx && S.ct && !AU.paused) {
        var currTime = AU.currentTime;
        showToast('Mengaktifkan Equalizer...');
        loadTrack(S.ct, currTime);
    }
    var popup = document.createElement('div');
    popup.id = 'equalizer-popup';
    popup.className = 'fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
    popup.onclick = function(e) { if(e.target === popup) closeEqualizer(); };
    var bandsList = ['Bass', 'Low-Mid', 'Mid', 'High-Mid', 'Treble'];
    var slidersHtml = bandsList.map(function(b, idx) {
        var val = S.eqBands[idx];
        return '<div class="flex flex-col items-center flex-1 gap-2">' +
            '<span id="eq-val-label-' + idx + '" class="text-[10px] text-[#6b7280] font-mono">' + (val > 0 ? '+' : '') + Math.round(val) + 'dB</span>' +
            '<input type="range" min="-12" max="12" step="0.5" value="' + val + '" ' +
                'class="eq-slider h-32" style="writing-mode: vertical-lr; direction: rtl; -webkit-appearance: slider-vertical; width: 12px;" ' +
                'oninput="changeSlider(' + idx + ', this.value)" />' +
            '<span class="text-xs text-[#a0a5b0] font-medium">' + b + '</span>' +
        '</div>';
    }).join('');
    var presets = ['Normal', 'Bass Booster', 'Vocal Booster', 'Electronic', 'Acoustic'];
    var presetsHtml = presets.map(function(p) {
        var act = S.activePreset === p;
        var btnStyle = act ? 'bg-[#cfd3d8]/20 text-white font-bold' : 'hover:bg-white/5 text-[#a0a5b0]';
        return '<button onclick="applyPreset(\'' + p + '\')" class="px-3.5 py-1.5 rounded-full text-xs transition-all ' + btnStyle + '">' + p + '</button>';
    }).join('');
    popup.innerHTML = '<div class="w-full max-w-md rounded-t-3xl p-6 border-t border-white/10 glass-strong" style="animation:slideUp 0.3s ease-out forwards; background: var(--bg-color);">' +
        '<div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>' +
        '<div class="flex justify-between items-center mb-4">' +
            '<div>' +
                '<h3 class="font-black text-white text-lg">Equalizer</h3>' +
                '<p class="text-[#6b7280] text-xs">Atur frekuensi suara sesuai selera</p>' +
            '</div>' +
            '<div id="visualizer-container" class="flex items-end gap-1 h-8 px-3 py-1 rounded-xl bg-white/5 shadow-inner" style="box-shadow: var(--nm-shadow-inset-sm);">' +
                '<div class="eq-bar"></div>' +
                '<div class="eq-bar"></div>' +
                '<div class="eq-bar"></div>' +
                '<div class="eq-bar"></div>' +
                '<div class="eq-bar"></div>' +
                '<div class="eq-bar"></div>' +
                '<div class="eq-bar"></div>' +
                '<div class="eq-bar"></div>' +
            '</div>' +
        '</div>' +
        '<div id="eq-presets-container" class="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-6">' + presetsHtml + '</div>' +
        '<div class="flex items-center justify-around mb-8 h-48">' + slidersHtml + '</div>' +
        '<button onclick="closeEqualizer()" class="w-full btn-chrome py-3.5 font-bold rounded-full">Selesai</button>' +
    '</div>';
    document.body.appendChild(popup);
    lucide.createIcons();
}

function closeEqualizer() {
    var el = gid('equalizer-popup');
    if (el) el.remove();
}

function changeSlider(bandIdx, val) {
    if (!S.eqBands) S.eqBands = [0, 0, 0, 0, 0];
    var floatVal = parseFloat(val);
    S.eqBands[bandIdx] = floatVal;
    S.activePreset = 'Custom';
    var label = gid('eq-val-label-' + bandIdx);
    if (label) {
        label.innerText = (floatVal > 0 ? '+' : '') + Math.round(floatVal) + 'dB';
    }
    var pc = gid('eq-presets-container');
    if (pc) {
        var buttons = pc.querySelectorAll('button');
        buttons.forEach(function(btn) {
            btn.className = 'px-3.5 py-1.5 rounded-full text-xs transition-all hover:bg-white/5 text-[#a0a5b0]';
        });
    }
    updateEQGain(bandIdx, floatVal);
}

function applyPreset(presetName) {
    S.activePreset = presetName;
    if (!S.eqBands) S.eqBands = [0, 0, 0, 0, 0];
    var mapping = {
        'Normal': [0, 0, 0, 0, 0],
        'Bass Booster': [8, 5, 1, 0, -2],
        'Vocal Booster': [-3, 1, 6, 4, 1],
        'Electronic': [5, 3, -1, 2, 4],
        'Acoustic': [3, 1, 2, 3, 2]
    };
    var values = mapping[presetName] || [0, 0, 0, 0, 0];
    values.forEach(function(v, idx) {
        S.eqBands[idx] = v;
        updateEQGain(idx, v);
    });
    var pop = gid('equalizer-popup');
    if (pop) {
        pop.remove();
        openEqualizer();
    }
    showToast('Equalizer: ' + presetName);
}

function openShareCard() {
    if (!S.ct) {
        showToast('Putar lagu terlebih dahulu');
        return;
    }
    var popup = document.createElement('div');
    popup.id = 'share-card-popup';
    popup.className = 'fixed inset-0 z-[300] flex items-center justify-center bg-black/75 px-4';
    popup.onclick = function(e) { if(e.target === popup) popup.remove(); };
    popup.innerHTML = '<div class="w-full max-w-sm rounded-3xl p-6 border border-white/10 glass-strong text-center" style="animation:slideUp 0.3s ease-out forwards; background: var(--bg-color);">' +
        '<div class="flex justify-between items-center mb-4">' +
            '<h3 class="font-bold text-lg text-white">Bagikan Lagu</h3>' +
            '<button onclick="document.getElementById(\'share-card-popup\').remove()" class="text-[#a0a5b0] hover:text-white p-1"><i data-lucide="x" class="w-5 h-5"></i></button>' +
        '</div>' +
        '<div id="share-card-preview" class="p-6 rounded-2xl mb-6 flex flex-col items-center gap-4 relative overflow-hidden" ' +
            'style="box-shadow: var(--nm-shadow-inset); background: var(--bg-color); border: 1px solid var(--border-color);">' +
            '<img src="' + S.ct.cover + '" class="w-48 h-48 object-cover rounded-2xl border border-white/5" />' +
            '<div class="w-full truncate">' +
                '<p class="text-white font-black text-lg truncate">' + es(S.ct.title) + '</p>' +
                '<p class="text-[#a0a5b0] text-xs font-bold mt-1 truncate">' + es(S.ct.artist) + '</p>' +
            '</div>' +
            '<div class="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden"><div class="h-full bg-gradient-to-r from-gray-400 to-white w-2/3"></div></div>' +
            '<div class="flex justify-between w-full text-[9px] text-[#6b7280] font-mono mt-1"><span>1:48</span><span>2:56</span></div>' +
            '<div class="border-t border-white/5 w-full pt-3 mt-1 flex items-center justify-center gap-1.5">' +
                '<i data-lucide="music" class="w-3.5 h-3.5 text-[#a0a5b0]"></i>' +
                '<span class="text-[10px] text-[#6b7280] tracking-wider font-semibold uppercase">Beatsify Web App</span>' +
            '</div>' +
        '</div>' +
        '<div class="space-y-2.5">' +
            '<button onclick="downloadShareCard()" class="w-full btn-chrome py-3 flex items-center justify-center gap-2 font-bold">' +
                '<i data-lucide="download" class="w-4 h-4"></i> Unduh Gambar Card' +
            '</button>' +
            '<div class="grid grid-cols-2 gap-2">' +
                '<button onclick="copyShareLink()" class="btn-chrome py-3 text-sm font-semibold flex items-center justify-center gap-1.5">' +
                    '<i data-lucide="copy" class="w-4 h-4"></i> Salin Link' +
                '</button>' +
                '<button onclick="triggerNativeShare()" class="btn-chrome py-3 text-sm font-semibold flex items-center justify-center gap-1.5">' +
                    '<i data-lucide="share" class="w-4 h-4"></i> Bagikan' +
                '</button>' +
            '</div>' +
        '</div>' +
    '</div>';
    document.body.appendChild(popup);
    lucide.createIcons();
}

function copyShareLink() {
    if(!S.ct || !S.ct.videoId) return;
    var url = location.origin + '/play/' + S.ct.videoId + '?share=true';
    navigator.clipboard.writeText(url).then(function() {
        showToast('Link berhasil disalin ke clipboard!');
    }).catch(function() {
        showToast('Gagal menyalin link');
    });
}

function triggerNativeShare() {
    if(!S.ct || !S.ct.videoId) return;
    var url = location.origin + '/play/' + S.ct.videoId + '?share=true';
    if (navigator.share) {
        navigator.share({
            title: S.ct.title,
            text: 'Dengarkan ' + S.ct.title + ' - ' + S.ct.artist + ' di Beatsify!',
            url: url
        }).catch(function() {});
    } else {
        copyShareLink();
    }
}

function downloadShareCard() {
    if (!S.ct) return;
    var canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    var ctx = canvas.getContext('2d');
    var grad = ctx.createLinearGradient(0, 0, 0, 800);
    var isLight = localStorage.getItem('theme') === 'light';
    if (isLight) {
        grad.addColorStop(0, '#e0e5ec');
        grad.addColorStop(1, '#c8d0db');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 600, 800);
    } else {
        grad.addColorStop(0, '#000000');
        grad.addColorStop(1, '#0f1014');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 600, 800);
    }
    ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 540, 740);
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
        ctx.save();
        var rx = 100, ry = 80, rw = 400, rh = 400, radius = 24;
        ctx.beginPath();
        ctx.moveTo(rx + radius, ry);
        ctx.lineTo(rx + rw - radius, ry);
        ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
        ctx.lineTo(rx + rw, ry + rh - radius);
        ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
        ctx.lineTo(rx + radius, ry + rh);
        ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
        ctx.lineTo(rx, ry + radius);
        ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, rx, ry, rw, rh);
        ctx.restore();
        ctx.fillStyle = isLight ? '#2d3748' : '#ffffff';
        ctx.font = '900 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(S.ct.title, 300, 540, 480);
        ctx.fillStyle = isLight ? '#718096' : '#a0a5b0';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(S.ct.artist, 300, 585, 480);
        ctx.fillStyle = isLight ? '#a0aec0' : '#4a5568';
        ctx.font = '16px monospace';
        ctx.fillText('DIDENGARKAN DI BEATSIFY', 300, 710);
        try {
            var dataUrl = canvas.toDataURL('image/png');
            var a = document.createElement('a');
            a.download = S.ct.title.replace(/[^a-zA-Z0-9]/g, '_') + '_beatsify.png';
            a.href = dataUrl;
            a.click();
            showToast('Berhasil mengunduh Share Card!');
        } catch(e) {
            showToast('Gagal unduh karena CORS gambar, silakan screenshot layar!');
        }
    };
    img.onerror = function() {
        ctx.fillStyle = isLight ? '#2d3748' : '#ffffff';
        ctx.font = '900 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(S.ct.title, 300, 300, 480);
        ctx.fillStyle = isLight ? '#718096' : '#a0a5b0';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(S.ct.artist, 300, 360, 480);
        ctx.fillStyle = isLight ? '#a0aec0' : '#4a5568';
        ctx.font = '16px monospace';
        ctx.fillText('DIDENGARKAN DI BEATSIFY', 300, 710);
        try {
            var dataUrl = canvas.toDataURL('image/png');
            var a = document.createElement('a');
            a.download = S.ct.title.replace(/[^a-zA-Z0-9]/g, '_') + '_beatsify.png';
            a.href = dataUrl;
            a.click();
            showToast('Berhasil mengunduh Share Card (tanpa cover)!');
        } catch(ex) {
            showToast('Gagal mengunduh Share Card');
        }
    };
    img.src = S.ct.cover || FI;
}

function openQueue(){
    if(gid('queue-popup'))return;
    var popup=document.createElement('div');
    popup.id='queue-popup';
    popup.className='fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
    popup.onclick=function(e){if(e.target===popup)closeQueue();};
    var listHtml='';
    if(!S.pl||S.pl.length===0){
        listHtml='<div class="text-center text-[#6b7280] py-10"><i data-lucide="list-music" class="w-12 h-12 mx-auto mb-3 opacity-30"></i><p class="text-sm">Antrian kosong</p></div>';
    }else{
        listHtml=S.pl.map(function(t,i){
            var active=i===S.pi;
            return '<div onclick="playQueueIndex('+i+')" class="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer active:scale-[0.98] '+(active?'bg-white/10':'hover:bg-white/5')+'">'+
                '<img src="'+t.cover+'" class="w-11 h-11 rounded-lg object-cover flex-shrink-0" onerror="this.src=\''+FI+'\'" />'+
                '<div class="flex-1 truncate"><p class="text-sm font-medium truncate '+(active?'text-[#cfd3d8]':'text-white')+'">'+es(t.title)+'</p><p class="text-[#6b7280] text-xs truncate">'+es(t.artist)+'</p></div>'+
                (active?'<i data-lucide="volume-2" class="w-4 h-4 text-[#cfd3d8] flex-shrink-0"></i>':'<span class="text-[#6b7280] text-xs flex-shrink-0">'+(i+1)+'</span>')+
            '</div>';
        }).join('');
    }
    popup.innerHTML='<div class="w-full max-w-md rounded-t-3xl p-6 border-t border-white/10 glass-strong" style="animation:slideUp 0.3s ease-out forwards; background: var(--bg-color); max-height:75vh; display:flex; flex-direction:column;">'+
        '<div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 flex-shrink-0"></div>'+
        '<div class="flex justify-between items-center mb-4 flex-shrink-0">'+
            '<div><h3 class="font-black text-white text-lg">Daftar Antrian</h3><p class="text-[#6b7280] text-xs">'+(S.pl?S.pl.length:0)+' lagu dalam antrian</p></div>'+
            '<button onclick="closeQueue()" class="text-[#6b7280] hover:text-white p-1"><i data-lucide="x" class="w-5 h-5"></i></button>'+
        '</div>'+
        '<div class="overflow-y-auto hide-scrollbar space-y-1 flex-1">'+listHtml+'</div>'+
    '</div>';
    document.body.appendChild(popup);
    lucide.createIcons();
}
function closeQueue(){var p=gid('queue-popup');if(p)p.remove();}
function playQueueIndex(i){
    if(!S.pl||!S.pl[i])return;
    S.pi=i;S.ct=S.pl[i];
    var url=location.origin+'/play/'+S.ct.videoId;history.pushState({},'',url);
    UU();MP.show();S.il=true;UB();
    resetLyricsUI(S.ct.videoId);
    loadTrack(S.ct);
    closeQueue();
}

function downloadCurrentSong(){
    if(!S.ct)return;
    showToast('Menyiapkan unduhan...');
    var ytUrl=S.ct.ytUrl||('https://youtube.com/watch?v='+S.ct.videoId);
    fetch(API.ytplay,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:ytUrl})})
        .then(function(r){return r.json();})
        .then(function(d){
            if(d&&d.status&&d.result&&d.result.download&&d.result.download.audio){
                var audioUrl=d.result.download.audio;
                var a=document.createElement('a');
                a.href='/api/proxy-audio?url='+encodeURIComponent(audioUrl);
                a.download=(S.ct.title||'lagu').replace(/[^a-zA-Z0-9]/g,'_')+'.mp3';
                document.body.appendChild(a);
                a.click();
                a.remove();
                showToast('Unduhan dimulai!');
            }else{
                showToast('Gagal mengambil link unduhan');
            }
        })
        .catch(function(){showToast('Gagal mengunduh lagu');});
}