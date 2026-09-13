// Sinkronisasi data (lagu disukai, artis disukai, playlist, riwayat) ke Supabase per akun,
// supaya data tidak hilang saat logout lalu login kembali. Saat belum login (guest),
// data tetap disimpan di localStorage seperti biasa.
var DataSync = {
    _pushTimers: {},

    push(field, value) {
        if (!Auth || !Auth.isLoggedIn || !window.sb) return;
        var userId = Auth.user.id;
        clearTimeout(DataSync._pushTimers[field]);
        DataSync._pushTimers[field] = setTimeout(async function () {
            try {
                var row = {}; row.user_id = userId; row[field] = value; row.updated_at = new Date().toISOString();
                await sb.from('user_data').upsert(row, { onConflict: 'user_id' });
            } catch (e) { console.error('Gagal sinkron ' + field + ':', e); }
        }, 600);
    },

    async onLogin() {
        if (!Auth.isLoggedIn || !window.sb) return;
        try {
            var { data: row } = await sb.from('user_data').select('*').eq('user_id', Auth.user.id).maybeSingle();
            if (row) {
                localStorage.setItem('hanz_liked_songs', JSON.stringify(row.liked_songs || []));
                localStorage.setItem('hanz_liked_artists', JSON.stringify(row.liked_artists || []));
                localStorage.setItem('hanz_playlists', JSON.stringify(row.playlists || []));
                localStorage.setItem('hanz_history', JSON.stringify(row.history || []));
            } else {
                // Belum ada data di server: migrasikan data lokal (guest) yang sudah ada ke akun ini
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
