// Menampilkan daftar "Informasi" (pengumuman) yang datanya diambil dari Supabase,
// dikelola oleh admin lewat halaman /admin.
var Info = {
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
            if (!data || data.length === 0) { body.innerHTML = '<p class="text-white/50 text-sm text-center py-6">Belum ada informasi.</p>'; return; }
            body.innerHTML = data.map(function (item) {
                var date = item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
                return '<div class="glass rounded-xl p-4">' +
                    '<h4 class="text-white font-bold text-sm mb-1">' + es(item.title || '') + '</h4>' +
                    '<p class="text-white/70 text-xs whitespace-pre-line mb-2">' + es(item.content || '') + '</p>' +
                    '<span class="text-white/30 text-[10px]">' + es(date) + '</span>' +
                '</div>';
            }).join('');
        } catch (e) {
            var b = gid('info-list-body');
            if (b) b.innerHTML = '<p class="text-white/50 text-sm text-center py-6">Gagal memuat informasi.</p>';
        }
    }
};
