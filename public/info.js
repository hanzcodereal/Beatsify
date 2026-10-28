// Menampilkan daftar "Informasi" (pengumuman) yang datanya diambil dari Supabase,
// dikelola oleh admin lewat halaman /admin.
var Info = {
    SEEN_KEY: 'beatsify_info_seen',
    _getSeen() { try { return localStorage.getItem(Info.SEEN_KEY) || ''; } catch (e) { return ''; } },
    _setSeen(v) { try { if (v) localStorage.setItem(Info.SEEN_KEY, v); } catch (e) {} },
    _dot(on) { var d = gid('info-dot'); if (d) d.style.display = on ? 'block' : 'none'; },
    // Titik merah muncul jika ada informasi yang lebih baru dari yang terakhir dilihat.
    async checkNew() {
        try {
            if (!window.sb) return;
            var { data, error } = await sb.from('app_info').select('created_at').order('created_at', { ascending: false }).limit(1);
            if (error || !data || !data.length) { Info._dot(false); return; }
            Info._dot(String(data[0].created_at) !== Info._getSeen());
        } catch (e) {}
    },

    async open() {
        var existing = gid('info-modal');
        if (existing) existing.remove();

        var modal = document.createElement('div');
        modal.id = 'info-modal';
        modal.className = 'fixed inset-0 z-[300] flex items-end justify-center bg-black/60';
        modal.onclick = function (e) { if (e.target === modal) modal.remove(); };
        modal.innerHTML =
            '<div class="glass-strong w-full max-w-md rounded-t-3xl p-6 border-t border-[#333333] max-h-[75vh] overflow-y-auto hide-scrollbar" style="animation:slideUp 0.4s ease-out forwards;">' +
                '<div class="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>' +
                '<h3 class="text-lg font-black chrome-text mb-4 flex items-center gap-2"><i data-lucide="megaphone" class="w-5 h-5"></i> Informasi</h3>' +
                '<div id="info-list-body" class="space-y-3 text-left"><p class="text-white/50 text-sm text-center py-6">Memuat informasi...</p></div>' +
            '</div>';
        document.body.appendChild(modal);
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();

        try {
            var { data, error } = await sb.from('app_info').select('*').order('created_at', { ascending: false });
            var body = gid('info-list-body');
            if (!body) return;
            if (error) { body.innerHTML = '<p class="text-white/50 text-sm text-center py-6">Gagal memuat informasi.</p>'; return; }
            if (data && data.length) { Info._setSeen(String(data[0].created_at)); Info._dot(false); }
            if (!data || data.length === 0) { body.innerHTML = '<p class="text-white/50 text-sm text-center py-6">Belum ada informasi.</p>'; return; }
            body.innerHTML = data.map(function (item) {
                var d = item.created_at ? new Date(item.created_at) : null;
                var date = d && !isNaN(d) ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
                var isNew = d && !isNaN(d) && (Date.now() - d.getTime()) < 3 * 86400000;
                return '<div class="info-card">' +
                    '<div class="info-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg></div>' +
                    '<div class="info-bd">' +
                        '<div class="info-top"><h4>' + es(item.title || '') + '</h4>' + (isNew ? '<span class="info-new">Baru</span>' : '') + '</div>' +
                        (item.content ? '<p>' + es(item.content) + '</p>' : '') +
                        '<span class="info-date">' + es(date) + '</span>' +
                    '</div></div>';
            }).join('');
        } catch (e) {
            var b = gid('info-list-body');
            if (b) b.innerHTML = '<p class="text-white/50 text-sm text-center py-6">Gagal memuat informasi.</p>';
        }
    }
};
