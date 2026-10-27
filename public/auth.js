// Sistem login Beatsify (Supabase Auth: email, username & password)
var Auth = {
    user: null,
    profile: null,
    ready: false,
    authTab: 'signin',
    busy: false,
    _busyLabel: '',
    _busyTimer: null,
    _lastUserId: null,
    _draft: { username: '', email: '' },
    _msg: null,

    // ---------- Ikon (SVG inline, tidak bergantung pada CDN) ----------
    _iconPaths: {
        'mail': '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
        'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
        'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        'eye': '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
        'eye-off': '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>',
        'log-in': '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/>',
        'user-plus': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>',
        'alert': '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
        'check': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
        'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
        'camera': '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
        'logout': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
        'music': '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'
    },
    icon: function (name, cls) {
        return '<svg class="' + (cls || 'auth-ic') + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (Auth._iconPaths[name] || '') + '</svg>';
    },
    _attr: function (t) {
        return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },
    _withTimeout: function (promise, ms) {
        return new Promise(function (resolve, reject) {
            var t = setTimeout(function () { reject(new Error('timeout')); }, ms);
            Promise.resolve(promise).then(function (v) { clearTimeout(t); resolve(v); }, function (e) { clearTimeout(t); reject(e); });
        });
    },

    // ---------- Inisialisasi & sesi ----------
    async init() {
        if (!window.sb) {
            console.error('Beatsify: Supabase client belum siap.');
            if (typeof window.hideSplashScreen === 'function') window.hideSplashScreen();
            var gate = gid('auth-gate');
            var gateForm = gid('auth-gate-form');
            if (gate) gate.style.display = 'block';
            if (gateForm) gateForm.innerHTML = '<div class="auth-card" style="text-align:center"><div class="auth-msg auth-msg-error" style="display:flex;margin-bottom:12px">' + Auth.icon('alert', 'auth-ic') + '<span>Gagal terhubung ke server. Cek koneksi internet kamu.</span></div><button type="button" class="auth-submit" onclick="location.reload()"><span class="auth-btn-label">Muat Ulang</span></button></div>';
            return;
        }
        try {
            var res = await Auth._withTimeout(sb.auth.getSession(), 8000);
            await Auth._applySession(res && res.data && res.data.session);
            Auth._lastUserId = Auth.user ? Auth.user.id : null;
            // Tarik data akun terbaru (lagu disukai, playlist, dll.) supaya tidak menimpa perubahan dari perangkat lain.
            if (Auth.user && typeof DataSync !== 'undefined') {
                await Auth._withTimeout(DataSync.onLogin(), 3500).catch(function () {});
            }
        } catch (e) { console.error(e); }
        Auth.ready = true;
        Auth.syncGate();
        Auth.startPresence();

        sb.auth.onAuthStateChange(function (event, session) {
            if (event === 'SIGNED_OUT') {
                Auth.stopPresence();
                if (typeof DataSync !== 'undefined') DataSync.onLogout();
                location.reload();
                return;
            }
            var newId = session && session.user ? session.user.id : null;
            if (!newId) return;
            // Supabase memicu SIGNED_IN lagi setiap tab kembali fokus. Abaikan jika user-nya sama,
            // supaya data lokal yang belum tersinkron tidak tertimpa data lama dari server.
            if (newId === Auth._lastUserId) { Auth.user = session.user; return; }
            // setTimeout: hindari memanggil Supabase langsung di dalam callback (bisa deadlock)
            setTimeout(function () { Auth._handleSignIn(event, session); }, 0);
        });
    },

    async _handleSignIn(event, session) {
        await Auth._applySession(session);
        Auth._lastUserId = Auth.user ? Auth.user.id : null;
        if (Auth.user && typeof DataSync !== 'undefined') {
            Auth.setBusy(true, 'Menyiapkan akunmu...');
            await Auth._withTimeout(DataSync.onLogin(), 6000).catch(function () {});
        }
        Auth.syncGate();
        Auth.startPresence();
        if (typeof S !== 'undefined' && S.at === 'profile') Auth.renderProfile();
        if (typeof Home !== 'undefined' && Home.updateGreeting) Home.updateGreeting();
    },

    async _applySession(session) {
        Auth.user = (session && session.user) || null;
        Auth.profile = null;
        if (Auth.user) {
            try {
                var { data: prof } = await sb.from('profiles').select('*').eq('id', Auth.user.id).maybeSingle();
                if (!prof) {
                    var defaultUsername = (Auth.user.user_metadata && Auth.user.user_metadata.username) || (Auth.user.email || 'user').split('@')[0];
                    var { data: created } = await sb.from('profiles').upsert({
                        id: Auth.user.id, email: Auth.user.email, username: defaultUsername
                    }).select().maybeSingle();
                    prof = created;
                }
                Auth.profile = prof || { username: (Auth.user.email || 'user').split('@')[0] };
            } catch (e) {
                console.error('Gagal memuat profil:', e);
                Auth.profile = { username: (Auth.user.email || 'user').split('@')[0] };
            }
        }
        if (typeof Home !== 'undefined' && Home.updateGreeting) Home.updateGreeting();
    },

    get isLoggedIn() { return !!Auth.user; },

    getDisplayName() {
        if (!Auth.user) return null;
        return (Auth.profile && Auth.profile.username) || (Auth.user.email || '').split('@')[0];
    },

    // ---------- Status "memproses" & pesan ----------
    setBusy(on, label) {
        Auth.busy = !!on;
        Auth._busyLabel = label || '';
        clearTimeout(Auth._busyTimer);
        var card = gid('auth-card');
        if (card) card.classList.toggle('is-busy', Auth.busy);
        var form = gid('auth-form');
        if (form) {
            form.querySelectorAll('input').forEach(function (i) { i.readOnly = Auth.busy; });
        }
        var btn = gid('auth-submit-btn');
        if (btn) {
            btn.disabled = Auth.busy;
            btn.setAttribute('aria-busy', Auth.busy ? 'true' : 'false');
            var lbl = btn.querySelector('.auth-btn-label');
            var ic = btn.querySelector('.auth-btn-icon');
            var sp = btn.querySelector('.auth-spinner');
            if (lbl) lbl.textContent = Auth.busy ? (label || 'Memproses...') : (btn.getAttribute('data-label') || '');
            if (ic) ic.style.display = Auth.busy ? 'none' : '';
            if (sp) sp.style.display = Auth.busy ? 'inline-block' : 'none';
        }
        if (Auth.busy) {
            // Pengaman: jangan biarkan tombol "memproses" selamanya jika server tidak merespons
            Auth._busyTimer = setTimeout(function () {
                if (Auth.busy && !Auth.user) {
                    Auth.setBusy(false);
                    Auth.setMsg('error', 'Terlalu lama merespons. Periksa koneksi internet lalu coba lagi.');
                }
            }, 25000);
        }
    },

    setMsg(type, text) {
        Auth._msg = text ? { type: type, text: text } : null;
        var el = gid('auth-msg');
        if (!el) return;
        if (!text) { el.style.display = 'none'; el.innerHTML = ''; el.className = 'auth-msg'; return; }
        var iconName = type === 'success' ? 'check' : (type === 'info' ? 'info' : 'alert');
        el.className = 'auth-msg auth-msg-' + type;
        el.innerHTML = Auth.icon(iconName, 'auth-ic') + '<span></span>';
        el.lastChild.textContent = text;
        el.style.display = 'flex';
    },

    friendlyError(err) {
        var m = String((err && err.message) || err || '');
        if (/invalid login credentials/i.test(m)) return 'Sandi salah. Periksa lagi sandi dan emailmu.';
        if (/email not confirmed/i.test(m)) return 'Email belum diverifikasi. Cek inbox (atau folder spam) kamu.';
        if (/already registered|already been registered|user already exists/i.test(m)) return 'Email ini sudah terdaftar. Silakan masuk.';
        if (/rate limit|too many|security purposes|over_email_send_rate_limit/i.test(m)) return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
        if (/password should be at least|weak password/i.test(m)) return 'Password terlalu lemah. Gunakan minimal 6 karakter.';
        if (/signups? (are )?(not allowed|disabled)/i.test(m)) return 'Pendaftaran akun baru sedang dinonaktifkan.';
        if (/failed to fetch|networkerror|network request failed|load failed|timeout/i.test(m)) return 'Tidak bisa terhubung ke server. Periksa koneksi internet kamu.';
        return m || 'Terjadi kesalahan. Coba lagi.';
    },

    // Supabase memberi error yang sama untuk email salah & password salah, jadi cek tabel profiles
    // untuk membedakannya: email tidak ada => "Email salah", email ada => "Password salah".
    async _wrongCredentialMsg(email) {
        try {
            var res = await Auth._withTimeout(sb.from('profiles').select('id').eq('email', String(email).toLowerCase()).limit(1), 6000);
            if (res && !res.error && Array.isArray(res.data)) {
                return res.data.length ? 'Password salah. Coba periksa lagi.' : 'Email salah. Email ini belum terdaftar.';
            }
        } catch (e) {}
        return 'Email atau password salah. Periksa lagi.';
    },

    // ---------- Status online (Supabase Realtime Presence) ----------
    startPresence() {
        try {
            if (!Auth.user || !sb.channel) return;
            if (Auth._presence && Auth._presenceUser === Auth.user.id) { Auth._trackPresence(); return; }
            Auth.stopPresence();
            Auth._presenceUser = Auth.user.id;
            var ch = sb.channel('beatsify-online', { config: { presence: { key: Auth.user.id } } });
            Auth._presence = ch;
            ch.subscribe(function (status) { if (status === 'SUBSCRIBED') Auth._trackPresence(); });
        } catch (e) { console.warn('presence:', e); }
    },
    _trackPresence() {
        try {
            if (!Auth._presence || !Auth.user) return;
            var p = Auth.profile || {};
            Auth._presence.track({ id: Auth.user.id, username: p.username || (Auth.user.email || 'user').split('@')[0], avatar_url: p.avatar_url || null, at: Date.now() });
        } catch (e) {}
    },
    stopPresence() {
        try { if (Auth._presence) { Auth._presence.untrack && Auth._presence.untrack(); sb.removeChannel && sb.removeChannel(Auth._presence); } } catch (e) {}
        Auth._presence = null; Auth._presenceUser = null;
    },

    _readForm() {
        var v = function (id) { var el = gid(id); return el ? (el.value || '') : ''; };
        return { username: v('auth-username').trim(), email: v('auth-email').trim(), password: v('auth-password') };
    },

    // ---------- Masuk / Daftar / Keluar ----------
    submit(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (Auth.busy) return false;
        if (Auth.authTab === 'signup') Auth.signUpEmail(); else Auth.signInEmail();
        return false;
    },

    async signInEmail() {
        if (Auth.busy) return;
        var f = Auth._readForm();
        Auth._draft.email = f.email;
        if (!f.email || !f.password) { Auth.setMsg('error', 'Isi email dan password dulu ya.'); return; }
        if (!/^[^\s@]+@gmail\.com$/i.test(f.email)) { Auth.setMsg('error', 'Email harus menggunakan @gmail.com'); return; }
        Auth.setMsg(null);
        Auth.setBusy(true, 'Memproses...');
        try {
            var { error } = await Auth._withTimeout(sb.auth.signInWithPassword({ email: f.email, password: f.password }), 20000);
            if (error) {
                var wrong = /invalid login credentials/i.test(String(error.message || ''));
                var msg = wrong ? await Auth._wrongCredentialMsg(f.email) : Auth.friendlyError(error);
                Auth.setBusy(false); Auth.setMsg('error', msg); return;
            }
            // Sukses: tetap tampilkan status memproses sampai halaman utama siap
            Auth.setBusy(true, 'Berhasil! Menyiapkan akunmu...');
        } catch (e) {
            Auth.setBusy(false);
            Auth.setMsg('error', Auth.friendlyError(e));
        }
    },

    async signUpEmail() {
        if (Auth.busy) return;
        var f = Auth._readForm();
        Auth._draft.username = f.username;
        Auth._draft.email = f.email;
        if (!f.username || !f.email || !f.password) { Auth.setMsg('error', 'Isi username, email, dan password dulu ya.'); return; }
        if (f.username.length < 3) { Auth.setMsg('error', 'Username minimal 3 karakter.'); return; }
        if (f.username.length > 30) { Auth.setMsg('error', 'Username maksimal 30 karakter.'); return; }
        if (!/^[^\s@]+@gmail\.com$/i.test(f.email)) { Auth.setMsg('error', 'Email harus menggunakan @gmail.com'); return; }
        if (f.password.length < 6) { Auth.setMsg('error', 'Password minimal 6 karakter.'); return; }
        Auth.setMsg(null);
        Auth.setBusy(true, 'Membuat akun...');
        try {
            var { data, error } = await Auth._withTimeout(sb.auth.signUp({
                email: f.email,
                password: f.password,
                options: { data: { username: f.username } }
            }), 20000);
            if (error) { Auth.setBusy(false); Auth.setMsg('error', Auth.friendlyError(error)); return; }

            // Supabase tidak mengembalikan error untuk email yang sudah terdaftar (anti-enumerasi),
            // tapi daftar "identities"-nya kosong.
            if (data && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
                Auth.setBusy(false);
                Auth.setAuthTab('signin', true);
                Auth.setMsg('info', 'Email ini sudah terdaftar. Silakan masuk dengan password kamu.');
                return;
            }
            if (data && data.session) {
                Auth.setBusy(true, 'Akun dibuat! Menyiapkan akunmu...');
            } else {
                Auth.setBusy(false);
                Auth.setAuthTab('signin', true);
                Auth.setMsg('success', 'Akun berhasil dibuat! Cek email kamu untuk verifikasi, lalu masuk.');
            }
        } catch (e) {
            Auth.setBusy(false);
            Auth.setMsg('error', Auth.friendlyError(e));
        }
    },

    async signOut() {
        var btn = gid('auth-logout-btn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<span class="auth-spinner auth-spinner-light" style="display:inline-block"></span> Keluar...'; }
        try {
            // Pastikan perubahan terakhir (mis. lagu yang baru disukai) tersimpan sebelum keluar
            if (typeof DataSync !== 'undefined' && DataSync.flush) await Auth._withTimeout(DataSync.flush(), 3000).catch(function () {});
            await sb.auth.signOut();
            showToast('Berhasil keluar');
        } catch (e) {
            showToast('Gagal keluar: ' + e.message);
            if (btn) { btn.disabled = false; btn.innerHTML = Auth.icon('logout') + ' Log Out'; }
        }
    },

    maskEmail(email) {
        if (!email || email.indexOf('@') === -1) return email || '';
        var parts = email.split('@');
        var name = parts[0];
        var domain = parts[1];
        var visible = name.slice(0, Math.min(3, name.length));
        var masked = visible + '*'.repeat(Math.max(3, name.length - visible.length));
        return masked + '@' + domain;
    },

    togglePw(btn) {
        var input = gid('auth-password');
        if (!input) return;
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
        btn.innerHTML = Auth.icon(show ? 'eye-off' : 'eye');
        input.focus();
    },

    setAuthTab(tab, keepMsg) {
        if (Auth.busy) return;
        Auth.authTab = tab;
        if (!keepMsg) Auth._msg = null;
        var body = gid('auth-body');
        var tabs = gid('auth-tabs');
        if (body && tabs) {
            // Ganti isi form saja, supaya indikator tab bisa bergeser mulus
            var f = Auth._readForm();
            if (f.email) Auth._draft.email = f.email;
            if (f.username) Auth._draft.username = f.username;
            tabs.setAttribute('data-active', tab);
            tabs.querySelectorAll('.auth-tab').forEach(function (b) {
                var on = b.getAttribute('data-tab') === tab;
                b.classList.toggle('active', on);
                b.setAttribute('aria-selected', on ? 'true' : 'false');
            });
            body.innerHTML = Auth._bodyHTML();
            Auth._restoreMsg();
        } else {
            if (gid('profile-account-section')) Auth.renderProfile();
            if (gid('auth-gate-form')) Auth.renderGate();
        }
    },

    _restoreMsg() {
        if (Auth._msg) Auth.setMsg(Auth._msg.type, Auth._msg.text);
        if (Auth.busy) Auth.setBusy(true, Auth._busyLabel);
    },

    // ---------- Profil ----------
    async saveUsername() {
        var input = gid('profile-username-input');
        if (!input || !Auth.user) return;
        var newName = input.value.trim();
        if (!newName) { showToast('Username tidak boleh kosong'); return; }
        if (newName.length > 30) { showToast('Username maksimal 30 karakter'); return; }
        try {
            var { error } = await sb.from('profiles').update({ username: newName }).eq('id', Auth.user.id);
            if (error) { showToast('Gagal menyimpan username'); return; }
            Auth.profile = Auth.profile || {};
            Auth.profile.username = newName;
            var nm = document.querySelector('.prof-name'); if (nm) nm.textContent = newName;
            Auth._trackPresence();
            showToast('Username diperbarui');
            if (typeof Home !== 'undefined' && Home.updateGreeting) Home.updateGreeting();
        } catch (e) { showToast('Gagal menyimpan username'); }
    },

    async handleAvatarChange(evt) {
        var file = evt.target.files && evt.target.files[0];
        if (!file || !Auth.user) return;
        if (!/^image\//.test(file.type)) { showToast('File harus berupa gambar'); return; }
        if (file.size > 3 * 1024 * 1024) { showToast('Ukuran foto maksimal 3 MB'); return; }
        try {
            showToast('Mengunggah foto...');
            var ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
            var path = Auth.user.id + '/avatar.' + ext;
            var { error: upErr } = await sb.storage.from('avatars').upload(path, file, { upsert: true, cacheControl: '3600' });
            if (upErr) { showToast('Gagal unggah foto: ' + upErr.message); return; }
            var { data: pub } = sb.storage.from('avatars').getPublicUrl(path);
            var publicUrl = pub.publicUrl + '?t=' + Date.now();
            var { error: updErr } = await sb.from('profiles').update({ avatar_url: publicUrl }).eq('id', Auth.user.id);
            if (updErr) { showToast('Gagal menyimpan foto profil'); return; }
            Auth.profile = Auth.profile || {};
            Auth.profile.avatar_url = publicUrl;
            var img = gid('profile-avatar-img');
            if (img) img.src = publicUrl;
            showToast('Foto profil diperbarui');
        } catch (e) { showToast('Gagal unggah foto: ' + e.message); }
    },

    renderProfile() {
        var el = gid('profile-account-section');
        if (!el) return;

        if (Auth.user) {
            var p = Auth.profile || {};
            var uname = p.username || 'Pengguna';
            el.innerHTML = `
            <div class="prof-card">
                <div class="prof-cover"></div>
                <div class="prof-avatar-wrap">
                    <img id="profile-avatar-img" src="${Auth._attr(p.avatar_url) || '/logo.png'}" class="prof-avatar" alt="" onerror="this.src='/logo.png'"/>
                    <button type="button" class="prof-cam" aria-label="Ganti foto" onclick="document.getElementById('profile-avatar-input').click()">${Auth.icon('camera')}</button>
                    <input type="file" id="profile-avatar-input" accept="image/*" style="display:none" onchange="Auth.handleAvatarChange(event)">
                </div>
                <h2 class="prof-name">${es(uname)}</h2>
                <div class="prof-mail">${Auth.icon('mail')}<span>${es(Auth.maskEmail(Auth.user.email || ''))}</span></div>
                <div class="prof-edit">
                    <label for="profile-username-input">Ubah username</label>
                    <div class="prof-row">
                        <input id="profile-username-input" value="${Auth._attr(p.username || '')}" maxlength="30" placeholder="Username" autocomplete="off" />
                        <button type="button" onclick="Auth.saveUsername()">Simpan</button>
                    </div>
                </div>
                <button id="auth-logout-btn" type="button" onclick="Auth.signOut()" class="prof-logout">${Auth.icon('logout')} Log Out</button>
            </div>`;
        } else {
            el.innerHTML = Auth.authFormHTML();
            Auth._restoreMsg();
        }
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    },

    // ---------- Tampilan form login / daftar ----------
    _bodyHTML() {
        var isSignin = Auth.authTab !== 'signup';
        var d = Auth._draft;
        var label = isSignin ? 'Masuk' : 'Buat Akun';
        return `
        <div class="auth-head">
            <h2>${isSignin ? 'Selamat datang kembali' : 'Buat akun baru'}</h2>
            <p>${isSignin ? 'Masuk untuk melanjutkan musikmu.' : 'Simpan lagu favorit &amp; playlist di semua perangkat.'}</p>
        </div>
        <form id="auth-form" onsubmit="return Auth.submit(event)" novalidate>
            ${!isSignin ? `
            <div class="auth-group">
                <label for="auth-username">Username</label>
                <div class="auth-field">
                    ${Auth.icon('user', 'auth-ic auth-ic-lead')}
                    <input id="auth-username" name="username" type="text" maxlength="30" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Nama tampilan kamu" value="${Auth._attr(d.username)}" class="auth-input" />
                </div>
            </div>` : ''}
            <div class="auth-group">
                <label for="auth-email">Email</label>
                <div class="auth-field">
                    ${Auth.icon('mail', 'auth-ic auth-ic-lead')}
                    <input id="auth-email" name="email" type="email" inputmode="email" autocomplete="${isSignin ? 'username' : 'email'}" autocapitalize="none" spellcheck="false" placeholder="nama@gmail.com" value="${Auth._attr(d.email)}" class="auth-input" />
                </div>
            </div>
            <div class="auth-group">
                <label for="auth-password">Password</label>
                <div class="auth-field">
                    ${Auth.icon('lock', 'auth-ic auth-ic-lead')}
                    <input id="auth-password" name="password" type="password" autocomplete="${isSignin ? 'current-password' : 'new-password'}" placeholder="${isSignin ? 'Masukkan password' : 'Minimal 6 karakter'}" class="auth-input auth-input-pw" />
                    <button type="button" class="auth-eye" onclick="Auth.togglePw(this)" aria-label="Tampilkan password" tabindex="-1">${Auth.icon('eye')}</button>
                </div>
            </div>
            <div id="auth-msg" class="auth-msg" role="alert" aria-live="polite" style="display:none"></div>
            <button id="auth-submit-btn" type="submit" class="auth-submit" data-label="${label}">
                <span class="auth-btn-icon">${Auth.icon(isSignin ? 'log-in' : 'user-plus')}</span>
                <span class="auth-spinner" style="display:none"></span>
                <span class="auth-btn-label">${label}</span>
            </button>
        </form>
        <p class="auth-switch">
            ${isSignin
                ? 'Belum punya akun? <button type="button" onclick="Auth.setAuthTab(\'signup\')">Daftar dulu</button>'
                : 'Sudah punya akun? <button type="button" onclick="Auth.setAuthTab(\'signin\')">Masuk di sini</button>'}
        </p>`;
    },

    authFormHTML() {
        var isSignin = Auth.authTab !== 'signup';
        return `
        <div id="auth-card" class="auth-card${Auth.busy ? ' is-busy' : ''}">
            <div class="auth-progress" aria-hidden="true"><i></i></div>
            <div id="auth-tabs" class="auth-tabs" role="tablist" data-active="${isSignin ? 'signin' : 'signup'}">
                <span class="auth-tab-ind"></span>
                <button type="button" role="tab" data-tab="signin" aria-selected="${isSignin}" class="auth-tab${isSignin ? ' active' : ''}" onclick="Auth.setAuthTab('signin')">${Auth.icon('log-in')}<span>Masuk</span></button>
                <button type="button" role="tab" data-tab="signup" aria-selected="${!isSignin}" class="auth-tab${!isSignin ? ' active' : ''}" onclick="Auth.setAuthTab('signup')">${Auth.icon('user-plus')}<span>Daftar</span></button>
            </div>
            <div id="auth-body">${Auth._bodyHTML()}</div>
        </div>`;
    },

    renderGate() {
        var el = gid('auth-gate-form');
        if (!el) return;
        el.innerHTML = Auth.authFormHTML();
        Auth._restoreMsg();
    },

    _gateResolved: false,
    syncGate() {
        var gate = gid('auth-gate');
        if (Auth.user) {
            Auth.busy = false;
            clearTimeout(Auth._busyTimer);
            if (gate) gate.style.display = 'none';
            if (typeof window.hideSplashScreen === 'function') window.hideSplashScreen();
            if (!Auth._gateResolved) {
                Auth._gateResolved = true;
                if (typeof window.startBeatsifyApp === 'function') window.startBeatsifyApp();
            }
        } else {
            if (typeof window.hideSplashScreen === 'function') window.hideSplashScreen();
            if (gate) gate.style.display = 'block';
            if (!gid('auth-card')) Auth.renderGate();
        }
    }
};

(function () {
    var started = false;
    function start() { if (started) return; started = true; Auth.init(); }
    if (document.readyState === 'complete' || document.readyState === 'interactive') { start(); }
    else { document.addEventListener('DOMContentLoaded', start); }
})();
