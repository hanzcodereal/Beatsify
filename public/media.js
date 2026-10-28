var MediaNotif = {
    ready: false,
    update: function(track) {
        if (!track || !('mediaSession' in navigator)) return;
        var cover = toHDCover(track.cover, track.videoId || track.id);
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title || 'Beatsify',
            artist: track.artist || '',
            album: 'Beatsify',
            artwork: [
                { src: cover, sizes: '96x96', type: 'image/webp' },
                { src: cover, sizes: '256x256', type: 'image/webp' },
                { src: cover, sizes: '512x512', type: 'image/webp' }
            ]
        });
        MediaNotif.bind();
        MediaNotif.state();
    },
    state: function() {
        if (!('mediaSession' in navigator)) return;
        navigator.mediaSession.playbackState = AU.paused ? 'paused' : 'playing';
    },
    bind: function() {
        if (MediaNotif.ready) return;
        MediaNotif.ready = true;
        var set = function(name, fn) {
            try { navigator.mediaSession.setActionHandler(name, fn); } catch (e) {}
        };
        set('play', function() { if (AU.paused) TP(); });
        set('pause', function() { if (!AU.paused) TP(); });
        set('previoustrack', function() { PV(); });
        set('nexttrack', function() { NX(); });
        set('seekbackward', function(d) { AU.currentTime = Math.max(0, AU.currentTime - ((d && d.seekOffset) || 10)); });
        set('seekforward', function(d) { AU.currentTime = Math.min(AU.duration || 1e9, AU.currentTime + ((d && d.seekOffset) || 10)); });
        set('seekto', function(d) {
            if (d && typeof d.seekTime === 'number') {
                AU.currentTime = d.seekTime;
                S.pt = d.seekTime;
            }
        });
        MediaNotif.attach();
    },
    // Posisi lagu di layar kunci / notifikasi, juga membantu sistem menganggap sesi audio masih aktif
    position: function() {
        try {
            if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;
            var d = AU.duration;
            if (!d || !isFinite(d)) return;
            navigator.mediaSession.setPositionState({
                duration: d,
                playbackRate: AU.playbackRate || 1,
                position: Math.max(0, Math.min(d, AU.currentTime || 0))
            });
        } catch (e) {}
    },
    _lastPos: 0,
    attach: function() {
        AU.addEventListener('play', MediaNotif.state);
        AU.addEventListener('pause', MediaNotif.state);
        AU.addEventListener('loadedmetadata', MediaNotif.position);
        AU.addEventListener('seeked', MediaNotif.position);
        AU.addEventListener('ratechange', MediaNotif.position);
        AU.addEventListener('playing', function() { MediaNotif.state(); MediaNotif.position(); });
        AU.addEventListener('timeupdate', function() {
            var n = Date.now();
            if (n - MediaNotif._lastPos > 5000) { MediaNotif._lastPos = n; MediaNotif.position(); }
        });
    }
};
