// Sinkronisasi data (lagu disukai, artis disukai, playlist, riwayat) ke Supabase per akun,
// supaya data tidak hilang saat logout lalu login kembali. Saat belum login (guest),
// data tetap disimpan di localStorage seperti biasa.
var DataSync = {
    _pending: {},
    _timer: null,
    _userId: null,

    push(field, value) {
        if (typeof Auth === 'undefined' || !Auth.isLoggedIn || !window.sb) return;
        DataSync._userId = Auth.user.id;
        DataSync._pending[field] = value;
        clearTimeout(DataSync._timer);
        DataSync._timer = setTimeout(DataSync.flush, 600);
    },

    // Kirim semua perubahan yang tertunda dalam satu permintaan.
    async flush() {
        clearTimeout(DataSync._timer);
        DataSync._timer = null;
        var fields = Object.keys(DataSync._pending);
        if (!fields.length || !DataSync._userId || !window.sb) return;
        var row = { user_id: DataSync._userId, updated_at: new Date().toISOString() };
        fields.forEach(function (f) { row[f] = DataSync._pending[f]; });
        DataSync._pending = {};
        try {
            var res = await sb.from('user_data').upsert(row, { onConflict: 'user_id' });
            if (res && res.error) throw res.error;
        } catch (e) {
            console.error('Gagal sinkron data akun:', e);
            // Kembalikan ke antrean supaya dicoba lagi pada perubahan berikutnya
            fields.forEach(function (f) { if (!(f in DataSync._pending)) DataSync._pending[f] = row[f]; });
        }
    },

    async onLogin() {
        if (!Auth.isLoggedIn || !window.sb) return;
        try {
            var res = await sb.from('user_data').select('*').eq('user_id', Auth.user.id).maybeSingle();
            // Jika gagal membaca (jaringan/server), JANGAN menimpa data di server dengan data lokal yang mungkin kosong.
            if (res.error) throw res.error;
            var row = res.data;
            if (row) {
                // Ada perubahan lokal yang belum terkirim? Kirim dulu, jangan ditimpa data server yang lama.
                var pend = DataSync._pending;
                var map = { liked_songs: 'hanz_liked_songs', liked_artists: 'hanz_liked_artists', playlists: 'hanz_playlists', history: 'hanz_history' };
                Object.keys(map).forEach(function (f) {
                    if (f in pend) return;
                    localStorage.setItem(map[f], JSON.stringify(row[f] || []));
                });
            } else {
                // Belum ada data di server: migrasikan data lokal yang sudah ada ke akun ini
                await sb.from('user_data').upsert({
                    user_id: Auth.user.id,
                    liked_songs: getLikedSongs(),
                    liked_artists: getLikedArtists(),
                    playlists: getUserPlaylists(),
                    history: getPlayHistory(),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
            }
        } catch (e) { console.error('Gagal memuat data akun:', e); }
        DataSync._refreshUI();
    },

    onLogout() {
        try {
            localStorage.removeItem('hanz_liked_songs');
            localStorage.removeItem('hanz_liked_artists');
            localStorage.removeItem('hanz_playlists');
            localStorage.removeItem('hanz_history');
        } catch (e) {}
        DataSync._refreshUI();
    },

    _refreshUI() {
        if (typeof updateLikeButtons === 'function') updateLikeButtons();
        if (typeof Library !== 'undefined' && Library.render && S && S.at === 'library') Library.render();
    }
};

(function wrapPersistenceFunctions() {
    var _saveLikedSongs = saveLikedSongs;
    saveLikedSongs = function (songs) { _saveLikedSongs(songs); DataSync.push('liked_songs', songs); };

    var _saveLikedArtists = saveLikedArtists;
    saveLikedArtists = function (artists) { _saveLikedArtists(artists); DataSync.push('liked_artists', artists); };

    var _saveUserPlaylists = saveUserPlaylists;
    saveUserPlaylists = function (pls) { _saveUserPlaylists(pls); DataSync.push('playlists', pls); };

    var _addToHistory = addToHistory;
    addToHistory = function (track) { _addToHistory(track); DataSync.push('history', getPlayHistory()); };

    var _removeHistoryItem = removeHistoryItem;
    removeHistoryItem = function (index) { _removeHistoryItem(index); DataSync.push('history', getPlayHistory()); };

    var _clearPlayHistory = clearPlayHistory;
    clearPlayHistory = function () { _clearPlayHistory(); DataSync.push('history', []); };
})();

// Simpan perubahan terakhir saat tab ditutup / disembunyikan
document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') DataSync.flush();
});
window.addEventListener('pagehide', function () { DataSync.flush(); });
