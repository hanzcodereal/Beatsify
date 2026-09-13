function gid(id) { return document.getElementById(id); }
function es(t) { if (!t) return ''; var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

var AdminApp = {
    TOKEN_KEY: 'beatsify_admin_token',

    getToken() { return localStorage.getItem(AdminApp.TOKEN_KEY); },
    setToken(t) { localStorage.setItem(AdminApp.TOKEN_KEY, t); },
    clearToken() { localStorage.removeItem(AdminApp.TOKEN_KEY); },

    async init() {
        if (AdminApp.getToken()) {
            var ok = await AdminApp.renderDashboard();
            if (!ok) AdminApp.renderLogin();
        } else {
            AdminApp.renderLogin();
        }
    },

    renderLogin(errorMsg) {
        gid('admin-root').innerHTML = `
        <div class="glass p-6 max-w-sm mx-auto mt-16">
            <h1 class="text-2xl font-black mb-1">Beatsify Admin</h1>
            <p class="text-white/50 text-sm mb-6">Masuk untuk mengelola aplikasi</p>
            ${errorMsg ? '<p class="text-rose-400 text-sm mb-3">' + es(errorMsg) + '</p>' : ''}
            <div class="space-y-3">
                <input id="admin-username" placeholder="Username" class="glass-input w-full px-3 py-2.5 text-sm rounded-lg outline-none" />
                <input id="admin-password" type="password" placeholder="Password" class="glass-input w-full px-3 py-2.5 text-sm rounded-lg outline-none" />
                <button id="admin-login-btn" onclick="AdminApp.login()" class="w-full btn-chrome font-bold py-3 rounded-full">Masuk</button>
            </div>
        </div>`;
    },

    async login() {
        var username = gid('admin-username').value.trim();
        var password = gid('admin-password').value;
        var btn = gid('admin-login-btn');
        btn.disabled = true; btn.textContent = 'Memproses...';
        try {
            var r = await fetch('/api/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, password: password })
            });
            var d = await r.json();
            if (!d.status) { AdminApp.renderLogin(d.message || 'Login gagal'); return; }
            AdminApp.setToken(d.token);
            AdminApp.renderDashboard();
        } catch (e) {
            AdminApp.renderLogin('Gagal terhubung ke server');
        }
    },

    logout() {
        AdminApp.clearToken();
        AdminApp.renderLogin();
    },

    async renderDashboard() {
        var token = AdminApp.getToken();
        var statsRes;
        try {
            statsRes = await fetch('/api/admin-stats', { headers: { Authorization: 'Bearer ' + token } });
        } catch (e) {
            AdminApp.renderLogin('Gagal terhubung ke server');
            return false;
        }
        if (statsRes.status === 401) { AdminApp.clearToken(); return false; }
        var stats = await statsRes.json();

        gid('admin-root').innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-black">Beatsify Admin</h1>
            <button onclick="AdminApp.logout()" class="btn-chrome px-4 py-2 rounded-full text-sm font-bold">Log Out</button>
        </div>

        <div class="glass p-5 mb-6">
            <p class="text-white/50 text-xs uppercase tracking-wider mb-1">Total Akun Terdaftar</p>
            <p class="text-4xl font-black">${stats.status ? stats.totalAccounts : '-'}</p>
        </div>

        <div class="glass p-5 mb-6">
            <h2 class="font-bold mb-3">Tambah Informasi</h2>
            <div class="space-y-2">
                <input id="info-title-input" placeholder="Judul" class="glass-input w-full px-3 py-2.5 text-sm rounded-lg outline-none" />
                <textarea id="info-content-input" placeholder="Isi informasi" rows="3" class="glass-input w-full px-3 py-2.5 text-sm rounded-lg outline-none"></textarea>
                <button onclick="AdminApp.addInfo()" class="btn-chrome w-full py-2.5 rounded-full font-bold text-sm">Tambah</button>
            </div>
        </div>

        <div class="glass p-5">
            <h2 class="font-bold mb-3">Daftar Informasi</h2>
            <div id="admin-info-list" class="space-y-2 max-h-[50vh] overflow-y-auto hide-scrollbar">
                <p class="text-white/40 text-sm">Memuat...</p>
            </div>
        </div>`;

        AdminApp.loadInfoList();
        return true;
    },

    async loadInfoList() {
        var listEl = gid('admin-info-list');
        try {
            var { data, error } = await sb.from('app_info').select('*').order('created_at', { ascending: false });
            if (error) { listEl.innerHTML = '<p class="text-rose-400 text-sm">Gagal memuat: ' + es(error.message) + '</p>'; return; }
            if (!data || data.length === 0) { listEl.innerHTML = '<p class="text-white/40 text-sm">Belum ada informasi.</p>'; return; }
            listEl.innerHTML = data.map(function (item) {
                return '<div class="glass-input p-3 flex justify-between items-start gap-3">' +
                    '<div class="min-w-0">' +
                        '<p class="font-bold text-sm truncate">' + es(item.title) + '</p>' +
                        '<p class="text-white/60 text-xs whitespace-pre-line">' + es(item.content || '') + '</p>' +
                    '</div>' +
                    '<button onclick="AdminApp.deleteInfo(\'' + item.id + '\')" class="text-rose-400 text-xs font-bold shrink-0">Hapus</button>' +
                '</div>';
            }).join('');
        } catch (e) {
            listEl.innerHTML = '<p class="text-rose-400 text-sm">Gagal memuat informasi.</p>';
        }
    },

    async addInfo() {
        var title = gid('info-title-input').value.trim();
        var content = gid('info-content-input').value.trim();
        if (!title) { alert('Judul wajib diisi'); return; }
        try {
            var r = await fetch('/api/admin-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + AdminApp.getToken() },
                body: JSON.stringify({ title: title, content: content })
            });
            var d = await r.json();
            if (!d.status) { alert(d.message || 'Gagal menambah informasi'); return; }
            gid('info-title-input').value = '';
            gid('info-content-input').value = '';
            AdminApp.loadInfoList();
        } catch (e) { alert('Gagal menambah informasi'); }
    },

    async deleteInfo(id) {
        if (!confirm('Hapus informasi ini?')) return;
        try {
            var r = await fetch('/api/admin-info?id=' + encodeURIComponent(id), {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + AdminApp.getToken() }
            });
            var d = await r.json();
            if (!d.status) { alert(d.message || 'Gagal menghapus'); return; }
            AdminApp.loadInfoList();
        } catch (e) { alert('Gagal menghapus informasi'); }
    }
};

AdminApp.init();
