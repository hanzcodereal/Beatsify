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
        set('seekto', function(d) {
            if (d && typeof d.seekTime === 'number') {
                AU.currentTime = d.seekTime;
                S.pt = d.seekTime;
            }
        });
        AU.addEventListener('play', MediaNotif.state);
        AU.addEventListener('pause', MediaNotif.state);
    }
};
