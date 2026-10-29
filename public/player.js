const API={home:'/api/home',search:'/api/search',artist:'/api/artist',suggest:'/api/suggest',lyrics:'/api/lyrics',lyrics1:'/api/lyrics1',ytplay:'/api/ytplay'};
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

const S={ht:[],htr:[],hal:[],sr:[],ar:[],hc:[],hcp:[],hca:[],sq:'',filter:'all',ct:null,pl:[],pi:-1,ps:'',ip:false,il:false,rm:'all',isShuffle:false,currentAccentColor:'#f43f5e',autoNext:true,iv:null,pt:0,pd:0,at:'home',ld:{type:'none',lines:[]},cli:-1,lo:false,lyricOffset:0,playbackRate:1.0,sleepSecondsLeft:0,sleepEndWithTrack:false,lyricsTranslate:true};

try{S.playbackRate=parseFloat(localStorage.getItem('hanz_playback_rate'))||1.0;}catch(e){S.playbackRate=1.0;}
try{var storedAutoNext = localStorage.getItem('hanz_auto_next');if(storedAutoNext!==null){S.autoNext = storedAutoNext==='true';}}catch(e){}
try{var storedLyricsTranslate = localStorage.getItem('hanz_lyrics_translate');}catch(e){}
S.lyricsTranslate = true; // terjemahan lirik selalu otomatis

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
S.vol=1;
try{
    var sv=localStorage.getItem('beatsify_volume');
    if(sv!==null){S.vol=Math.max(0,Math.min(1,parseFloat(sv)));}
    else{var ov=localStorage.getItem('hanz_volume');if(ov!==null){S.vol=Math.max(0,Math.min(100,parseInt(ov,10)))/100;}}
    if(isNaN(S.vol))S.vol=1;
    AU.volume=Math.min(1,S.vol);
}catch(e){}
// ---------- Jalur audio Web Audio (seperti NanzMusify) ----------
// Audio dialirkan lewat AudioContext (sumber -> bass -> mid -> treble -> gain -> compressor -> speaker).
// Dengan jalur ini suara tetap hidup saat layar HP dimatikan. Semua sumber harus same-origin/CORS (proxy atau blob).
var audioCtx=null,gainNode=null;
function initAudioGraph(){
    if(audioCtx||S.noGraph)return;
    var ctx=null,src=null;
    try{
        var AC=window.AudioContext||window.webkitAudioContext;
        if(!AC)return;
        ctx=new AC();
        AU.crossOrigin='anonymous';
        src=ctx.createMediaElementSource(AU);
    }catch(e){try{if(ctx)ctx.close();}catch(e2){}S.noGraph=true;return;}
    try{
        var bass=ctx.createBiquadFilter();bass.type='lowshelf';bass.frequency.value=150;bass.gain.value=0;
        var mid=ctx.createBiquadFilter();mid.type='peaking';mid.frequency.value=1000;mid.gain.value=0;
        var treble=ctx.createBiquadFilter();treble.type='highshelf';treble.frequency.value=3500;treble.gain.value=0;
        var g=ctx.createGain();g.gain.value=Math.max(0,S.vol);
        var comp=ctx.createDynamicsCompressor();
        comp.threshold.value=-12;comp.knee.value=12;comp.ratio.value=4;comp.attack.value=0.003;comp.release.value=0.25;
        src.connect(bass);bass.connect(mid);mid.connect(treble);treble.connect(g);g.connect(comp);comp.connect(ctx.destination);
        gainNode=g;
    }catch(e){
        gainNode=null;
        try{src.disconnect();}catch(e3){}
        try{src.connect(ctx.destination);}catch(e4){}
    }
    audioCtx=ctx;
    try{ctx.onstatechange=function(){if(ctx.state!=='running'&&S.ip&&!S._userPaused)resumeAudioCtx();};}catch(e){}
}
function resumeAudioCtx(){
    try{if(audioCtx&&audioCtx.state!=='running'&&audioCtx.resume)return audioCtx.resume().catch(function(){});}catch(e){}
}
document.addEventListener('visibilitychange',function(){if(!document.hidden)resumeAudioCtx();});
['touchstart','click','keydown'].forEach(function(ev){document.addEventListener(ev,resumeAudioCtx,{passive:true});});
// Elemen yang sudah "ditangkap" AudioContext tidak bisa dilepas: kalau sumbernya tak bisa dipakai, ganti elemen baru tanpa jalur ini.
function swapAudioElement(){
    var old=AU,vol=1;
    try{vol=old.volume;}catch(e){}
    try{old.pause();old.removeAttribute('src');old.load();}catch(e){}
    var el=document.createElement('audio');el.preload='auto';el.style.display='none';
    try{old.parentNode.replaceChild(el,old);}catch(e){document.body.appendChild(el);}
    el.id='audio-player';
    try{el.volume=vol;}catch(e){}
    AU=el;
    bindAudioEvents();
    try{if(audioCtx)audioCtx.close();}catch(e){}
    audioCtx=null;gainNode=null;S.noGraph=true;
}

function bindAudioEvents(){
AU.addEventListener('timeupdate',function(){if(!AU.paused){S.pt=AU.currentTime||0;S.pd=AU.duration||0;renderProgress();}});
AU.addEventListener('play',function(){S._userPaused=false;resumeAudioCtx();S.ip=true;S.il=false;UB();SP();try{AU.playbackRate=S.playbackRate||1.0;}catch(ex){}});
AU.addEventListener('pause',function(){
    if(AU.ended)return;
    if(!S._userPaused&&S.ct&&audioCtx&&audioCtx.state!=='running'&&(S._autoResume||0)<5){
        S._autoResume=(S._autoResume||0)+1;
        Promise.resolve(resumeAudioCtx()).then(function(){if(AU.paused&&!S._userPaused)AU.play().catch(function(){});});
        return;
    }
    S.ip=false;UB();ST();
});
AU.addEventListener('waiting',function(){S.il=true;UB();});
AU.addEventListener('playing',function(){S.il=false;UB();});
AU.addEventListener('ended',function(){ST();if(handleTrackEnded())return;if(S.rm==='one'){AU.currentTime=0;AU.play().catch(function(){});}else if(S.autoNext){NX();}else{S.ip=false;UB();}});
AU.addEventListener('error',function(){if(AU.src&&!AU.onerror){S.il=false;S.ip=false;UB();}});
    if(typeof MediaNotif!=='undefined'&&MediaNotif.attach)MediaNotif.attach();
}
bindAudioEvents();

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

var _activeRefreshQueued=false;
// Sinkronkan penanda "sedang diputar / memuat" di semua daftar lagu yang sedang terlihat.
function refreshActiveLists(){
    if(_activeRefreshQueued)return;
    _activeRefreshQueued=true;
    requestAnimationFrame(function(){
        _activeRefreshQueued=false;
        try{
            if(typeof Home!=='undefined'&&S.at==='home'&&Home.renderActive)Home.renderActive();
            if(typeof Search!=='undefined'&&S.at==='search'&&Search.renderActive)Search.renderActive();
            if(typeof Library!=='undefined'&&Library.renderActive)Library.renderActive();
            if(typeof Artist!=='undefined'&&Artist.renderActive)Artist.renderActive();
            if(typeof Album!=='undefined'&&Album.renderActive)Album.renderActive();
        }catch(e){console.error('refreshActiveLists',e);}
    });
}

function UB(){
    refreshActiveLists();
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
            if(coverIcon) coverIcon.innerHTML='<div class="w-12 h-12 border-4 border-[#3f3f3f] border-t-white rounded-full animate-spin"></div>';
            if(coverText) coverText.innerText='MEMUAT AUDIO...';
        }
        if(fullCover){
            fullCover.style.transform='scale(0.95)';
            fullCover.style.filter='brightness(0.75)';
        }
        if(statusTag){
            statusTag.classList.remove('hidden', 'bg-white/10', 'text-white/80', 'border-[#3a3a3a]');
            statusTag.classList.add('inline-block', 'bg-white/20', 'text-white', 'border-[#3f3f3f]', 'animate-pulse');
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
                statusTag.classList.add('inline-block', 'bg-white/10', 'text-white/80', 'border-[#3a3a3a]');
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
    var ic=gid('full-inline-cover'),it=gid('full-inline-title'),ia=gid('full-inline-artist');
    if(ic){ic.src=S.ct.cover;ic.onerror=function(){handleImgError(this);};}
    if(it)it.innerText=S.ct.title;
    if(ia)ia.innerText=S.ct.artist;
    if(fba)fba.src=S.ct.cover;
    updateOG(S.ct.title,S.ct.cover,S.ct.artist);
    if(typeof updateLikeButtons==='function')updateLikeButtons();
    if(typeof MP !== 'undefined' && MP.updateBeats) MP.updateBeats(S.ct);
    if(typeof FullPlayer !== 'undefined' && FullPlayer.updateBeats) FullPlayer.updateBeats(S.ct);
}

function PK(s,i){
    var l=[];if(s==='home1')l=S.ht.slice(0,8);else if(s==='home3')l=S.htr||[];else if(s==='home2')l=S.ht.slice(6,12);else if(s==='homecat')l=S.hc||[];else if(s==='search')l=S.sr;else if(s==='playlist'||s==='album'||s==='artist'||s==='direct')l=S.pl;else if(s==='rec0')l=S.rec0||[];else if(s==='rec1')l=S.rec1||[];else if(s==='rec2')l=S.rec2||[];else if(s==='rec3')l=S.rec3||[];
    if(!l[i])return;
    if(S.ct && (S.ct.id === l[i].id || S.ct.videoId === l[i].videoId) && AU.src && S.audioFor===(l[i].videoId||l[i].id)){
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
    if(!resumeAt){S._autoResume=0;}
    abortBlobJobsExcept(track.videoId||track.id);
    S._userPaused=true; // pause berikutnya disengaja (ganti lagu); event 'play' akan menghapusnya
    ST();
    try{AU.pause();}catch(e){}
    addToHistory(track);
    if(typeof MediaNotif!=='undefined')MediaNotif.update(track);
    fetchAudioAndPlay(track,resumeAt);
}

// ---------- Alamat stream: cache + prefetch lagu berikutnya ----------
// Saat layar HP mati, jeda saat mengambil alamat lagu berikutnya bisa membuat browser menghentikan musik.
// Karena itu alamat lagu berikutnya diambil lebih dulu sehingga pergantian lagu bisa langsung (tanpa menunggu jaringan).
var _streamCache={};
function cachedStream(vid){
    var c=_streamCache[vid];
    if(c&&Date.now()-c.at<20*60*1000)return c.url;
    return '';
}
async function resolveStreamUrl(track){
    var vid=track.videoId||track.id;
    var hit=cachedStream(vid);
    if(hit)return hit;
    var ytUrl=track.ytUrl||('https://youtube.com/watch?v='+vid);
    var streamUrl='';
    try{
        var ctrl=new AbortController();
        var tid=setTimeout(function(){ctrl.abort();},5000);
        var r=await fetch(API.ytplay,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:ytUrl}),signal:ctrl.signal});
        clearTimeout(tid);
        var d=await r.json().catch(function(){return {};});
        if(d&&d.status&&d.result&&d.result.download&&d.result.download.audio){streamUrl=d.result.download.audio;}
        else if(d&&d.url){streamUrl=d.url;}
    }catch(e){}
    if(!streamUrl&&typeof ClientExtractor!=='undefined'){
        try{
            var cr=await ClientExtractor.extract(vid,ytUrl);
            if(cr&&cr.audioUrl)streamUrl=cr.audioUrl;
        }catch(e){}
    }
    if(streamUrl){
        _streamCache[vid]={url:streamUrl,at:Date.now()};
        var keys=Object.keys(_streamCache);
        if(keys.length>12)delete _streamCache[keys[0]];
    }
    return streamUrl;
}
// Tentukan lagu berikutnya lebih awal (juga untuk mode acak) lalu siapkan alamat stream-nya.
function pickNextIndex(){
    if(!S.pl||!S.pl.length)return -1;
    if(S._nextFor===S.pi&&S._nextPl===S.pl&&S._nextIdx>=0&&S.pl[S._nextIdx])return S._nextIdx;
    var ni;
    if(S.isShuffle&&S.pl.length>1){
        ni=S.pi;var at=0;
        while(ni===S.pi&&at<10){ni=Math.floor(Math.random()*S.pl.length);at++;}
    }else{
        ni=S.pi+1;if(ni>=S.pl.length)ni=0;
    }
    S._nextFor=S.pi;S._nextPl=S.pl;S._nextIdx=ni;
    return ni;
}
function prefetchNext(){
    try{
        if(!S.autoNext||S.rm==='one')return;
        var ni=pickNextIndex();
        if(ni<0||ni===S.pi)return;
        var t=S.pl[ni];
        if(t&&!cachedStream(t.videoId||t.id))resolveStreamUrl(t);
    }catch(e){}
}

// ---------- Unduh lagu utuh ke memori (blob) ----------
// Saat layar HP mati, jaringan untuk streaming bisa dibatasi sistem sehingga musik berhenti setelah buffer habis.
// Lagu yang sudah terunduh utuh diputar dari memori (tanpa jaringan), dan lagu berikutnya diunduh lebih dulu.
var _blobCache={};
var _blobJobs={};
function trimBlobs(){
    var keep={};
    if(S.audioFor)keep[S.audioFor]=1;
    try{var ni=(S._nextFor===S.pi&&S._nextPl===S.pl)?S._nextIdx:-1;if(ni>=0&&S.pl[ni])keep[S.pl[ni].videoId||S.pl[ni].id]=1;}catch(e){}
    Object.keys(_blobCache).forEach(function(v){
        if(!keep[v]){try{URL.revokeObjectURL(_blobCache[v].url);}catch(e){}delete _blobCache[v];}
    });
}
async function fetchBlob(vid,streamUrl){
    if(!vid||!streamUrl||_blobCache[vid]||_blobJobs[vid])return;
    var ctrl=new AbortController();
    _blobJobs[vid]=ctrl;
    try{
        var r=await fetch('/api/proxy-audio?url='+encodeURIComponent(streamUrl),{signal:ctrl.signal});
        if(!r.ok)throw new Error('http '+r.status);
        var len=parseInt(r.headers.get('content-length')||'0',10);
        if(len>40*1024*1024)throw new Error('too big');
        var b=await r.blob();
        if(!b||b.size<50000||b.size>40*1024*1024)throw new Error('bad size');
        _blobCache[vid]={url:URL.createObjectURL(b),at:Date.now()};
        trimBlobs();
        if(S.audioFor===vid)swapToBlob(vid);
        else if(_blobCache[vid]&&S.audioFor&&vid!==S.audioFor){/* disimpan untuk lagu berikutnya */}
        prefetchNextBlob();
    }catch(e){}
    finally{delete _blobJobs[vid];}
}
function swapToBlob(vid){
    var c=_blobCache[vid];
    if(!c||S.audioFor!==vid||AU.src===c.url||AU.ended)return;
    var t=AU.currentTime||0,wasPlaying=!AU.paused;
    var onMeta=function(){AU.removeEventListener('loadedmetadata',onMeta);try{AU.currentTime=t;}catch(e){}if(wasPlaying)AU.play().catch(function(){});};
    AU.addEventListener('loadedmetadata',onMeta);
    try{AU.removeAttribute('crossorigin');}catch(e){}
    AU.src=c.url;
}
function prefetchNextBlob(){
    try{
        if(!S.autoNext||S.rm==='one'||!S.audioFor||!_blobCache[S.audioFor])return;
        var ni=pickNextIndex();
        if(ni<0||ni===S.pi)return;
        var t=S.pl[ni];if(!t)return;
        var vid=t.videoId||t.id;
        if(_blobCache[vid]||_blobJobs[vid])return;
        var u=cachedStream(vid);
        if(u){fetchBlob(vid,u);}
        else{resolveStreamUrl(t).then(function(url){if(url)fetchBlob(vid,url);});}
    }catch(e){}
}
function abortBlobJobsExcept(vid){
    Object.keys(_blobJobs).forEach(function(v){if(v!==vid){try{_blobJobs[v].abort();}catch(e){}}});
}

async function fetchAudioAndPlay(track,resumeAt,autoplay){
    if(autoplay===undefined)autoplay=true;
    S.il=true;UB();
    var vid=track.videoId||track.id;
    var streamUrl=cachedStream(vid);
    if(!streamUrl){
        streamUrl=await resolveStreamUrl(track);
        if(S.ct!==track)return;
    }
    if(!streamUrl){
        S.audioFor='';S.il=false;S.ip=false;UB();
        if(typeof showToast==='function')showToast('Gagal memutar lagu, coba lagi');
        return;
    }
    var isDirect=streamUrl.indexOf('vidssave.com')>-1||streamUrl.indexOf('aliyuncs.com')>-1;
    var proxyUrl='/api/proxy-audio?url='+encodeURIComponent(streamUrl);
    // Seperti NanzMusify: host biasa lewat proxy + Web Audio; CDN langsung hanya dipakai bila belum ada jalur Web Audio.
    if(!isDirect)initAudioGraph();
    var useGraph=!!audioCtx;
    var fellBack=false;
    AU.onerror=function(){
        if(S.ct!==track)return;
        if(!fellBack&&streamUrl){
            fellBack=true;
            if(useGraph){
                // Proxy gagal: lepas jalur Web Audio supaya lagu tetap bisa diputar langsung.
                swapAudioElement();
                useGraph=false;
                S.audioFor=vid;
                AU.onerror=function(){if(S.ct===track){S.audioFor='';S.il=false;S.ip=false;UB();}};
                AU.src=streamUrl;
                if(resumeAt){var om=function(){try{AU.currentTime=resumeAt;}catch(e){}AU.removeEventListener('loadedmetadata',om);};AU.addEventListener('loadedmetadata',om);}
                AU.play().catch(function(){S.il=false;S.ip=false;UB();});
            }else{
                try{AU.removeAttribute('crossorigin');}catch(e){}
                AU.src=streamUrl;
                AU.play().catch(function(){S.il=false;S.ip=false;UB();});
            }
        }else{
            S.audioFor='';S.il=false;S.ip=false;UB();
        }
    };
    if(useGraph||!isDirect){AU.crossOrigin='anonymous';}
    else{AU.removeAttribute('crossorigin');}
    S.audioFor=vid;
    var bc=null; // unduhan blob dimatikan: pemutaran sama seperti NanzMusify (langsung dari proxy/CDN)
    AU.src=bc?bc.url:((useGraph||!isDirect)?proxyUrl:streamUrl);
    if(useGraph)resumeAudioCtx();
    if(resumeAt){
        var onMeta=function(){try{AU.currentTime=resumeAt;}catch(e){}AU.removeEventListener('loadedmetadata',onMeta);};
        AU.addEventListener('loadedmetadata',onMeta);
    }
    if(autoplay){AU.play().catch(function(){});}
    else{S.il=false;S.ip=false;UB();}
}

function TP(){
    if(!S.ct)return;
    if(!AU.src)return;
    if(AU.paused){S._userPaused=false;AU.play().catch(function(){});}else{S._userPaused=true;AU.pause();}
}
function NX(){
    if(!S.pl || !S.pl.length)return;
    var ni=pickNextIndex();
    if(ni<0)return;
    S._nextIdx=-1;
    PK(S.ps, ni);
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

var _lyricsReq=0;
async function FL(vid){
    var reqId=++_lyricsReq;
    var l=gid('lyrics-loading'),c=gid('lyrics-content'),e=gid('lyrics-empty');
    var il=gid('full-inline-lyrics-loading'),ic=gid('full-inline-lyrics-content'),ie=gid('full-inline-lyrics-empty');
    if(l) l.classList.remove('hidden');
    if(il) il.classList.remove('hidden');
    if(c) { c.classList.add('hidden'); c.innerHTML=''; delete c._lyricLines; delete c._activeLine; }
    if(ic) { ic.classList.add('hidden'); ic.innerHTML=''; delete ic._lyricLines; delete ic._activeLine; }
    if(e) e.classList.add('hidden');
    if(ie) ie.classList.add('hidden');
    S.ld={type:'none',lines:[]};S.cli=-1;S.lyricOffset=0;updateSyncBadge();
    var showEmpty=function(){
        if(l)l.classList.add('hidden');if(e)e.classList.remove('hidden');
        if(il)il.classList.add('hidden');if(ie)ie.classList.remove('hidden');
    };
    var hasLines=function(d){return !!(d&&d.status&&d.result&&d.result.lyrics&&d.result.lyrics.lines&&d.result.lyrics.lines.length>0);};
    try{
        var trFlag = S.lyricsTranslate ? '1' : '0';
        var lang = 'id';
        var d = null;
        // Coba /api/lyrics dulu; kalau gagal atau kosong, fallback ke /api/lyrics1.
        try{ d = await fetchLyricsFrom('lyrics', vid, trFlag, lang); }catch(e1){ d = null; }
        if(reqId!==_lyricsReq) return;
        if(!hasLines(d)){
            try{ d = await fetchLyricsFrom('lyrics1', vid, trFlag, lang); }catch(e2){ d = null; }
            if(reqId!==_lyricsReq) return;
        }
        if(hasLines(d)){
            S.ld=d.result.lyrics;var html='';var inlineHtml='';
            var isPlain = S.ld.type === 'plain';
            S.ld.lines.forEach(function(li,i){
                var transHtml = '';
                if (S.lyricsTranslate && li.translation && li.translation.trim() && li.translation.trim() !== (li.text||'').trim()) {
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
            showEmpty();
        }
    }catch(er){
        if(reqId===_lyricsReq) showEmpty();
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
        miniBtn.className = 'active:scale-90 p-1.5 cursor-pointer transition-colors ' + (isLiked ? 'text-white' : 'text-[#a0a5b0] hover:text-white');
        miniBtn.innerHTML = '<i data-lucide="heart" class="w-5 h-5 ' + (isLiked ? 'fill-current' : '') + '"></i>';
    }
    if(fullBtn){
        fullBtn.className = 'w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-all shrink-0 cursor-pointer shadow-md ' +
            (isLiked ? 'bg-white text-black border border-white' : 'bg-white/10 hover:bg-white/20 border border-[#333333] text-white');
        fullBtn.innerHTML = '<i data-lucide="heart" class="w-5 h-5 ' + (isLiked ? 'fill-current text-black' : 'text-white') + '"></i>';
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
function showToast(msg){var toast=document.createElement('div');toast.className='fixed bottom-24 left-1/2 -translate-x-1/2 bg-white text-black font-bold px-5 py-2.5 rounded-full z-[10000] max-w-[90vw] text-center text-sm';toast.style.animation='slideUp 0.3s ease-out forwards';toast.innerText=msg;document.body.appendChild(toast);setTimeout(function(){toast.remove();},2000);}
function addCurrentToPlaylist(){if(!S.ct)return;var pls=getUserPlaylists();if(pls.length===0){showToast('Belum ada playlist! Buat di Library dulu');return;}showPlaylistPicker(S.ct);}
function showPlaylistPicker(track){
    if(!track||!track.videoId){showToast('Lagu tidak valid');return;}
    var pls=getUserPlaylists();
    if(pls.length===0){showToast('Belum ada playlist! Buat di Library dulu');return;}
    var popup=document.createElement('div');
    popup.className='fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
    popup.onclick=function(e){if(e.target===popup)popup.remove();};
    var listHtml=pls.map(function(p){
        return '<button data-pl="'+es(p.id)+'" class="pl-pick w-full text-left p-4 hover:bg-white/5 flex items-center gap-3 border-b border-[#2a2a2a]"><img src="'+(p.image||(p.songs.length>0?p.songs[0].cover:FI))+'" class="w-10 h-10 rounded object-cover" onerror="this.src=\''+FI+'\'" /><div><p class="font-medium text-white">'+es(p.name)+'</p><p class="text-[#6b7280] text-xs">'+p.songs.length+' lagu</p></div></button>';
    }).join('');
    popup.innerHTML='<div class="bg-[#1a1a1a] w-full max-w-md rounded-t-3xl p-6 border-t border-[#333333]" style="animation:slideUp 0.3s ease-out forwards;"><div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div><h3 class="font-bold text-white mb-3">Tambah ke Playlist</h3><div class="max-h-72 overflow-y-auto hide-scrollbar">'+listHtml+'</div><button class="pl-cancel w-full mt-3 py-3 border border-[#3a3a3a] text-white rounded-full">Batal</button></div>';
    popup.querySelectorAll('.pl-pick').forEach(function(btn){
        btn.onclick=function(){addToPlaylistById(btn.getAttribute('data-pl'),track);popup.remove();};
    });
    popup.querySelector('.pl-cancel').onclick=function(){popup.remove();};
    document.body.appendChild(popup);
}

// ---------- Volume (0-100%), mirip NanzMusify ----------
function setVolumeLevel(pct) {
    var v = Math.max(0, Math.min(1, (parseFloat(pct) || 0) / 100));
    S.vol = v;
    if (v > 0) S.lastVol = v;
    try { AU.volume = v; } catch(e) {}
    try { if (gainNode && audioCtx) gainNode.gain.setTargetAtTime(Math.max(0, v), audioCtx.currentTime, 0.05); } catch(e) {}
    try { localStorage.setItem('beatsify_volume', String(v)); } catch(e) {}
    updateVolumeUI();
}
function toggleMuteVolume() {
    if (S.vol > 0) { S.lastVol = S.vol; setVolumeLevel(0); }
    else setVolumeLevel((S.lastVol || 1) * 100);
}
function volIconSvg(muted) {
    return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/>' +
        (muted ? '<path d="m22 9-6 6M16 9l6 6"/>' : '<path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>') + '</svg>';
}
function volChipsHtml() {
    var pct = Math.round(S.vol * 100);
    return [0, 25, 50, 75, 100].map(function(v) {
        var sel = pct === v;
        var cls = sel ? 'bg-[#cfd3d8] text-black font-bold border-[#cfd3d8]' : 'bg-white/5 hover:bg-white/10 text-white border-[#2a2a2a]';
        var label = v === 0 ? '0% (Bisu)' : (v === 100 ? '100% (Maksimal)' : v + '%');
        return '<button onclick="setVolumeLevel(' + v + ')" class="w-full py-3.5 px-4 rounded-2xl border text-sm font-medium active:scale-98 transition-all flex items-center justify-between ' + cls + '">' +
            '<span>' + label + '</span>' + (sel ? '<i data-lucide="check" class="w-4 h-4 text-black"></i>' : '') + '</button>';
    }).join('');
}
function updateVolumeUI() {
    var pct = Math.round(S.vol * 100);
    var lbl = gid('vol-pct'); if (lbl) lbl.textContent = pct + '%';
    var inp = gid('vol-input'); if (inp && parseFloat(inp.value) !== pct) inp.value = pct;
    var ic = gid('vol-icon'); if (ic) ic.innerHTML = volIconSvg(S.vol === 0);
    var ch = gid('vol-chips'); if (ch) { ch.innerHTML = volChipsHtml(); if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons(); }
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
        S._userPaused = true;
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
            return '<button onclick="startSleepTimer(' + m + ')" class="py-3 px-4 rounded-2xl bg-white/5 border border-[#2a2a2a] text-sm text-white font-medium hover:bg-white/10 active:scale-95 transition-all">' + m + ' Menit</button>';
        }).join('');
        contentHtml = '<div class="grid grid-cols-3 gap-3 mb-4">' + gridHtml + '</div>' +
            '<button onclick="startSleepAtTrackEnd()" class="w-full py-3.5 px-4 rounded-2xl bg-[#cfd3d8]/10 hover:bg-[#cfd3d8]/20 border border-[#333333] text-xs text-white font-bold active:scale-95 transition-all flex items-center justify-center gap-2">' +
                '<i data-lucide="music-4" class="w-4 h-4"></i> Hentikan di Akhir Lagu' +
            '</button>';
    }
    popup.innerHTML = '<div class="w-full max-w-md rounded-t-3xl p-6 border-t border-[#333333] glass-strong" style="animation:slideUp 0.3s ease-out forwards; background: var(--bg-color);">' +
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
            : 'bg-white/5 hover:bg-white/10 text-white border-[#2a2a2a]';
        var label = sp === 1.0 ? '1.0x (Normal)' : sp + 'x';
        return '<button onclick="setPlaybackSpeed(' + sp + ')" class="w-full py-3.5 px-4 rounded-2xl border text-sm font-medium active:scale-98 transition-all flex items-center justify-between ' + btnStyle + '">' +
            '<span>' + label + '</span>' +
            (isSelected ? '<i data-lucide="check" class="w-4 h-4 text-black"></i>' : '') +
        '</button>';
    }).join('');
    popup.innerHTML = '<div class="w-full max-w-md rounded-t-3xl p-6 border-t border-[#333333] glass-strong" style="animation:slideUp 0.3s ease-out forwards; background: var(--bg-color); max-height: 80vh; overflow-y: auto;">' +
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

function openVolume() {
    if (gid('volume-popup')) return;
    var pct = Math.round(S.vol * 100);
    var popup = document.createElement('div');
    popup.id = 'volume-popup';
    popup.className = 'fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
    popup.onclick = function(e) { if (e.target === popup) closeVolume(); };
    popup.innerHTML = '<div class="w-full max-w-md rounded-t-3xl p-6 border-t border-[#333333] glass-strong" style="animation:slideUp 0.3s ease-out forwards; background: var(--bg-color); max-height: 80vh; overflow-y: auto;">' +
        '<div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>' +
        '<div class="flex justify-between items-center mb-5">' +
            '<div>' +
                '<h3 class="font-black text-white text-lg">Volume</h3>' +
                '<p class="text-[#6b7280] text-xs">Atur keras suara lagu sesuai seleramu</p>' +
            '</div>' +
            '<button onclick="closeVolume()" class="text-[#6b7280] hover:text-white p-1" aria-label="Tutup"><i data-lucide="x" class="w-5 h-5"></i></button>' +
        '</div>' +
        '<div class="w-full py-4 px-4 rounded-2xl border border-[#2a2a2a] bg-white/5 flex items-center gap-3 mb-3">' +
            '<button id="vol-icon" onclick="toggleMuteVolume()" aria-label="Bisukan / nyalakan suara" class="text-white/80 hover:text-white p-1 active:scale-90 transition shrink-0" style="background:none;border:0">' + volIconSvg(S.vol === 0) + '</button>' +
            '<input id="vol-input" type="range" min="0" max="100" value="' + pct + '" aria-label="Tingkat volume" oninput="setVolumeLevel(this.value)" class="flex-1" style="accent-color:#cfd3d8;height:28px;cursor:pointer;min-width:0" />' +
            '<span id="vol-pct" class="text-sm text-white font-bold w-11 text-right shrink-0">' + pct + '%</span>' +
        '</div>' +
        '<div id="vol-chips" class="flex flex-col gap-2 mb-4">' + volChipsHtml() + '</div>' +
    '</div>';
    document.body.appendChild(popup);
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

function closeVolume() {
    var el = gid('volume-popup');
    if (el) el.remove();
}

function openShareCard() {
    if (!S.ct) {
        showToast('Putar lagu terlebih dahulu');
        return;
    }
    var old = gid('share-card-popup'); if (old) old.remove();
    var popup = document.createElement('div');
    popup.id = 'share-card-popup';
    popup.className = 'fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
    popup.onclick = function(e) { if(e.target === popup) popup.remove(); };
    popup.innerHTML = '<div class="w-full max-w-md rounded-t-3xl p-6 border-t border-[#333333] glass-strong space-y-4" style="animation:slideUp 0.3s ease-out forwards; background: var(--bg-color);">' +
        '<div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3"></div>' +
        '<h3 class="font-bold text-white text-base">Bagikan Lagu</h3>' +
        '<div class="flex items-center gap-3 p-3 rounded-2xl bg-white/5">' +
            '<img src="' + Auth._attr(S.ct.cover || FI) + '" class="w-14 h-14 rounded-xl object-cover" onerror="this.src=\'' + FI + '\'" />' +
            '<div class="min-w-0 flex-1"><h4 class="font-bold text-white text-sm truncate">' + es(S.ct.title) + '</h4><p class="text-xs text-white/60 truncate mt-0.5">' + es(S.ct.artist) + '</p></div>' +
        '</div>' +
        '<div class="flex gap-3">' +
            '<button onclick="triggerNativeShare()" class="flex-1 btn-chrome font-bold py-3 rounded-full text-xs flex items-center justify-center gap-2">Bagikan Langsung</button>' +
            '<button onclick="copyShareLink()" class="px-6 py-3 glass glass-hover text-white rounded-full text-xs font-bold">Salin Link</button>' +
        '</div>' +
    '</div>';
    document.body.appendChild(popup);
}

function closeShareCard() { var p = gid('share-card-popup'); if (p) p.remove(); }

function copyShareLink() {
    if(!S.ct || !S.ct.videoId) return;
    var url = location.origin + '/play/' + S.ct.videoId + '?share=true';
    var done = function() { showToast('Link berhasil disalin ke clipboard!'); closeShareCard(); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done).catch(function() { showToast('Gagal menyalin link'); });
    } else {
        showToast('Gagal menyalin link');
    }
}

function triggerNativeShare() {
    if(!S.ct || !S.ct.videoId) return;
    var url = location.origin + '/play/' + S.ct.videoId + '?share=true';
    if (navigator.share) {
        navigator.share({
            title: S.ct.title + ' - ' + S.ct.artist,
            text: 'Dengarkan lagu ' + S.ct.title + ' di Beatsify!',
            url: url
        }).then(closeShareCard).catch(function() {});
    } else {
        copyShareLink();
    }
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
    popup.innerHTML='<div class="w-full max-w-md rounded-t-3xl p-6 border-t border-[#333333] glass-strong" style="animation:slideUp 0.3s ease-out forwards; background: var(--bg-color); max-height:75vh; display:flex; flex-direction:column;">'+
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
