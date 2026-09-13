// Inisialisasi client Supabase global (window.sb) yang dipakai auth.js, sync.js, info.js
(function () {
    var cfg = window.BEATSIFY_CONFIG || {};
    if (!cfg.NEXT_PUBLIC_SUPABASE_URL || !cfg.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
        console.error('Beatsify: konfigurasi Supabase tidak ditemukan (config.js belum dimuat).');
        return;
    }
    if (typeof supabase === 'undefined') {
        console.error('Beatsify: library supabase-js gagal dimuat.');
        return;
    }
    window.sb = supabase.createClient(
        cfg.NEXT_PUBLIC_SUPABASE_URL,
        cfg.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );
})();
