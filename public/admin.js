function gid(id) { return document.getElementById(id); }
function es(t) { if (t === null || t === undefined) return ''; var d = document.createElement('div'); d.textContent = String(t); return d.innerHTML; }

var AI = {
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M9.9 4.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6"/><path d="m2 2 20 20"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    pulse: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'
};
function ai(name, cls) {
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (AI[name] || '') + '</svg>';
}

var AdminApp = {
    TOKEN_KEY: 'beatsify_admin_token',
    PAGE: 30,
    users: [], total: 0, query: '', _qTimer: null, _uReq: 0,

    getToken() { try { return localStorage.getItem(AdminApp.TOKEN_KEY); } catch (e) { return null; } },
    setToken(t) { try { localStorage.setItem(AdminApp.TOKEN_KEY, t); } catch (e) {} },
    clearToken() { try { localStorage.removeItem(AdminApp.TOKEN_KEY); } catch (e) {} },
    authHeaders(extra) { return Object.assign({ Authorization: 'Bearer ' + AdminApp.getToken() }, extra || {}); },

    toast(t) {
        var old = document.querySelector('.toast'); if (old) old.remove();
        var el = document.createElement('div'); el.className = 'toast'; el.textContent = t;
        document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2400);
    },

    async init() {
        if (AdminApp.getToken()) {
            var ok = await AdminApp.renderDashboard();
            if (!ok) AdminApp.renderLogin();
        } else AdminApp.renderLogin();
    },

    renderLogin(errorMsg) {
        gid('admin-root').innerHTML = `
        <div class="login-wrap"><div class="login-box">
            <div class="brand">
                <div class="brand-logo"><img src="/logo.png" alt="Beatsify" onerror="this.style.display='none'"></div>
                <h1>Beatsify Admin</h1>
                <p>Masuk untuk mengelola aplikasi</p>
                <span class="badge">${ai('shield')} Area Admin</span>
            </div>
            <form id="admin-form" class="card" autocomplete="on" novalidate>
                <div class="progress"><i></i></div>
                <div class="group"><label for="admin-username">Username</label>
                    <div class="field">${ai('user', 'lead')}
                        <input id="admin-username" class="input" placeholder="Username admin" autocomplete="username" autocapitalize="none" spellcheck="false">
                    </div></div>
                <div class="group"><label for="admin-password">Password</label>
                    <div class="field">${ai('lock', 'lead')}
                        <input id="admin-password" type="password" class="input pw" placeholder="Password" autocomplete="current-password">
                        <button type="button" class="eye" id="admin-eye" aria-label="Tampilkan sandi">${ai('eye')}</button>
                    </div></div>
                <div id="admin-msg" class="msg" role="alert">${ai('alert')}<span></span></div>
                <button type="submit" id="admin-login-btn" class="btn-main"><span>Masuk</span></button>
            </form>
            <p class="foot">Hanya untuk pengelola Beatsify</p>
        </div></div>`;
        gid('admin-form').addEventListener('submit', function (e) { e.preventDefault(); AdminApp.login(); });
        gid('admin-eye').addEventListener('click', function () {
            var i = gid('admin-password'), show = i.type === 'password';
            i.type = show ? 'text' : 'password';
            this.innerHTML = ai(show ? 'eyeoff' : 'eye');
        });
        if (errorMsg) AdminApp.setMsg(errorMsg);
    },

    setMsg(t) {
        var m = gid('admin-msg'); if (!m) return;
        if (!t) { m.style.display = 'none'; return; }
        m.querySelector('span').textContent = t; m.style.display = 'flex';
    },

    setBusy(on) {
        var card = gid('admin-form'), btn = gid('admin-login-btn'); if (!card) return;
        card.classList.toggle('busy', on);
        btn.disabled = on;
        btn.innerHTML = on ? '<div class="spinner"></div><span>Memproses...</span>' : '<span>Masuk</span>';
        ['admin-username', 'admin-password'].forEach(function (id) { var i = gid(id); if (i) i.readOnly = on; });
    },

    async login() {
        var username = gid('admin-username').value.trim();
        var password = gid('admin-password').value;
        if (!username || !password) { AdminApp.setMsg('Isi username dan password dulu.'); return; }
        AdminApp.setMsg(''); AdminApp.setBusy(true);
        try {
            var r = await fetch('/api/admin-login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, password: password })
            });
            var d = {}; try { d = await r.json(); } catch (e) {}
            if (!d.status) {
                AdminApp.setBusy(false);
                AdminApp.setMsg(r.status === 401 ? 'Username atau password salah.' : (d.message || 'Login gagal'));
                return;
            }
            AdminApp.setToken(d.token);
            var ok = await AdminApp.renderDashboard();
            if (!ok) AdminApp.renderLogin('Sesi admin tidak valid, coba masuk lagi.');
        } catch (e) {
            AdminApp.setBusy(false);
            AdminApp.setMsg('Gagal terhubung ke server.');
        }
    },

    // ---------- Pengguna online (Supabase Realtime Presence) ----------
    online: {},
    startOnline() {
        AdminApp.stopOnline();
        try {
            if (!window.sb || !sb.channel) { AdminApp.renderOnline(); return; }
            var ch = sb.channel('beatsify-online', { config: { presence: { key: 'admin-' + Math.random().toString(36).slice(2) } } });
            AdminApp._ch = ch;
            ch.on('presence', { event: 'sync' }, function () {
                var st = ch.presenceState(), out = {};
                Object.keys(st).forEach(function (k) {
                    if (k.indexOf('admin-') === 0) return;
                    var m = st[k] && st[k][0]; if (m) out[k] = m;
                });
                AdminApp.online = out;
                AdminApp.renderOnline();
            }).subscribe();
        } catch (e) { AdminApp.renderOnline(); }
    },
    stopOnline() {
        try { if (AdminApp._ch && window.sb) sb.removeChannel(AdminApp._ch); } catch (e) {}
        AdminApp._ch = null; AdminApp.online = {};
    },
    renderOnline() {
        var ids = Object.keys(AdminApp.online);
        var n = gid('stat-online'); if (n) n.textContent = ids.length;
        var c = gid('online-count'); if (c) c.textContent = ids.length;
        var el = gid('admin-online'); if (!el) return;
        if (!ids.length) { el.innerHTML = '<p class="empty">Belum ada pengguna online.</p>'; }
        else {
            el.innerHTML = ids.map(function (id) {
                var u = AdminApp.online[id];
                return '<div class="olu">' + AdminApp.avatarHTML(u) + '<span class="dot dot-abs"></span>' +
                    '<div class="olname">' + es(u.username || 'Pengguna') + '</div></div>';
            }).join('');
        }
        // tandai titik hijau di daftar akun
        document.querySelectorAll('.user[data-id]').forEach(function (r) {
            r.classList.toggle('is-online', !!AdminApp.online[r.getAttribute('data-id')]);
        });
    },

    logout() { AdminApp.stopOnline(); AdminApp.clearToken(); AdminApp.renderLogin(); },

    async renderDashboard() {
        var statsRes;
        try { statsRes = await fetch('/api/admin-stats', { headers: AdminApp.authHeaders() }); }
        catch (e) { AdminApp.renderLogin('Gagal terhubung ke server.'); return false; }
        if (statsRes.status === 401) { AdminApp.clearToken(); return false; }
        var stats = {}; try { stats = await statsRes.json(); } catch (e) {}

        gid('admin-root').innerHTML = `
        <div class="dash">
            <div class="topbar">
                <div class="who"><div class="logo"><img src="/logo.png" alt="" onerror="this.style.display='none'"></div>
                    <div><h1>Beatsify Admin</h1><p>Panel pengelolaan</p></div></div>
                <button class="btn-ghost danger" onclick="AdminApp.logout()">${ai('logout')} Keluar</button>
            </div>
            <div class="stats">
                <div class="stat"><div class="lbl">${ai('users')} Total Akun</div><div class="num" id="stat-total">${stats.status ? es(stats.totalAccounts) : '-'}</div></div>
                <div class="stat"><div class="lbl"><span class="dot"></span> Online Sekarang</div><div class="num" id="stat-online">0</div></div>
                <div class="stat"><div class="lbl">${ai('bell')} Informasi</div><div class="num" id="stat-info">-</div></div>
            </div>
            <div class="panel">
                <div class="panel-h"><h2>${ai('pulse')} Sedang Online <span class="count" id="online-count">0</span></h2></div>
                <div id="admin-online" class="online"><p class="empty">Menunggu data...</p></div>
            </div>
            <div class="panel">
                <div class="panel-h">
                    <h2>${ai('users')} Akun Pengguna <span class="count" id="users-count">0</span></h2>
                    <div class="search">${ai('search', 'lead')}<input id="user-search" placeholder="Cari nama..." autocomplete="off"></div>
                </div>
                <div id="admin-users" class="users"><p class="empty">Memuat...</p></div>
                <button id="users-more" class="btn-ghost more" style="display:none" onclick="AdminApp.loadUsers(false)">Muat lebih banyak</button>
            </div>
            <div class="panel">
                <div class="panel-h"><h2>${ai('plus')} Tambah Informasi</h2></div>
                <div class="form-grid">
                    <input id="info-title-input" class="ti" placeholder="Judul">
                    <textarea id="info-content-input" class="ta" placeholder="Isi informasi" rows="3"></textarea>
                    <button id="info-add-btn" class="btn-add" onclick="AdminApp.addInfo()">${ai('plus')} Tambah</button>
                </div>
            </div>
            <div class="panel">
                <div class="panel-h"><h2>${ai('bell')} Daftar Informasi</h2></div>
                <div id="admin-info-list" class="infos"><p class="empty">Memuat...</p></div>
            </div>
        </div>`;

        gid('user-search').addEventListener('input', function () {
            var v = this.value.trim();
            clearTimeout(AdminApp._qTimer);
            AdminApp._qTimer = setTimeout(function () { AdminApp.query = v; AdminApp.loadUsers(true); }, 350);
        });
        AdminApp.query = '';
        AdminApp.loadUsers(true);
        AdminApp.loadInfoList();
        AdminApp.startOnline();
        return true;
    },

    avatarHTML(u) {
        var ini = es(((u.username || '?').trim()[0] || '?').toUpperCase());
        if (u.avatar_url && /^https?:\/\//i.test(u.avatar_url)) {
            return '<div class="avatar"><img src="' + es(u.avatar_url).replace(/"/g, '&quot;') + '" alt="" referrerpolicy="no-referrer" loading="lazy" onerror="this.remove()"></div>';
        }
        return '<div class="avatar">' + ini + '</div>';
    },

    async loadUsers(reset) {
        var list = gid('admin-users'); if (!list) return;
        var req = ++AdminApp._uReq;
        if (reset) { AdminApp.users = []; list.innerHTML = '<p class="empty">Memuat...</p>'; }
        var offset = AdminApp.users.length;
        var url = '/api/admin-users?limit=' + AdminApp.PAGE + '&offset=' + offset + (AdminApp.query ? '&q=' + encodeURIComponent(AdminApp.query) : '');
        try {
            var r = await fetch(url, { headers: AdminApp.authHeaders() });
            if (r.status === 401) { AdminApp.clearToken(); AdminApp.renderLogin('Sesi berakhir, masuk lagi.'); return; }
            var d = {}; try { d = await r.json(); } catch (e) {}
            if (req !== AdminApp._uReq) return;
            if (!d.status) { list.innerHTML = '<p class="empty">Gagal memuat akun' + (d.message ? ': ' + es(d.message) : '') + '</p>'; return; }
            AdminApp.users = AdminApp.users.concat(d.users || []);
            AdminApp.total = typeof d.total === 'number' ? d.total : AdminApp.users.length;
            AdminApp.renderUsers();
        } catch (e) {
            if (req === AdminApp._uReq) list.innerHTML = '<p class="empty">Gagal terhubung ke server.</p>';
        }
    },

    renderUsers() {
        var list = gid('admin-users'); if (!list) return;
        var c = gid('users-count'); if (c) c.textContent = AdminApp.total;
        if (!AdminApp.users.length) {
            list.innerHTML = '<p class="empty">' + (AdminApp.query ? 'Tidak ada akun yang cocok.' : 'Belum ada akun.') + '</p>';
        } else {
            list.innerHTML = AdminApp.users.map(function (u) {
                var d = u.created_at ? new Date(u.created_at) : null;
                var date = d && !isNaN(d) ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                return '<div class="user' + (AdminApp.online[u.id] ? ' is-online' : '') + '" data-id="' + es(u.id) + '">' + AdminApp.avatarHTML(u) + '<span class="dot dot-abs"></span>' +
                    '<div class="meta"><div class="name">' + es(u.username || 'Tanpa nama') + '</div>' +
                    '<div class="mail">' + es(u.email || '-') + '</div></div>' +
                    '<div class="date">' + es(date) + '</div></div>';
            }).join('');
        }
        var more = gid('users-more');
        if (more) more.style.display = AdminApp.users.length < AdminApp.total ? 'flex' : 'none';
    },

    async loadInfoList() {
        var listEl = gid('admin-info-list'); if (!listEl) return;
        try {
            var { data, error } = await sb.from('app_info').select('*').order('created_at', { ascending: false });
            if (error) { listEl.innerHTML = '<p class="empty">Gagal memuat: ' + es(error.message) + '</p>'; return; }
            var n = gid('stat-info'); if (n) n.textContent = (data || []).length;
            if (!data || !data.length) { listEl.innerHTML = '<p class="empty">Belum ada informasi.</p>'; return; }
            listEl.innerHTML = data.map(function (item) {
                var d = item.created_at ? new Date(item.created_at) : null;
                var date = d && !isNaN(d) ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
                return '<div class="info"><div class="iic">' + ai('megaphone') + '</div>' +
                    '<div style="min-width:0;flex:1"><div class="t">' + es(item.title) + '</div>' +
                    (item.content ? '<div class="c">' + es(item.content) + '</div>' : '') +
                    '<div class="d">' + es(date) + '</div></div>' +
                    '<button class="del" data-id="' + es(item.id) + '">' + ai('trash') + ' Hapus</button></div>';
            }).join('');
            listEl.querySelectorAll('.del').forEach(function (b) {
                b.addEventListener('click', function () { AdminApp.deleteInfo(b.getAttribute('data-id')); });
            });
        } catch (e) { listEl.innerHTML = '<p class="empty">Gagal memuat informasi.</p>'; }
    },

    async addInfo() {
        var title = gid('info-title-input').value.trim();
        var content = gid('info-content-input').value.trim();
        if (!title) { AdminApp.toast('Judul wajib diisi'); return; }
        var btn = gid('info-add-btn'); btn.disabled = true;
        try {
            var r = await fetch('/api/admin-info', {
                method: 'POST', headers: AdminApp.authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ title: title, content: content })
            });
            var d = {}; try { d = await r.json(); } catch (e) {}
            if (!d.status) { AdminApp.toast(d.message || 'Gagal menambah informasi'); return; }
            gid('info-title-input').value = ''; gid('info-content-input').value = '';
            AdminApp.toast('Informasi ditambahkan');
            AdminApp.loadInfoList();
        } catch (e) { AdminApp.toast('Gagal menambah informasi'); }
        finally { btn.disabled = false; }
    },

    async deleteInfo(id) {
        if (!confirm('Hapus informasi ini?')) return;
        try {
            var r = await fetch('/api/admin-info?id=' + encodeURIComponent(id), { method: 'DELETE', headers: AdminApp.authHeaders() });
            var d = {}; try { d = await r.json(); } catch (e) {}
            if (!d.status) { AdminApp.toast(d.message || 'Gagal menghapus'); return; }
            AdminApp.toast('Informasi dihapus');
            AdminApp.loadInfoList();
        } catch (e) { AdminApp.toast('Gagal menghapus informasi'); }
    }
};

AdminApp.init();
