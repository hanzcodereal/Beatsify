// Sistem login Beatsify (Supabase Auth: email, username & password)
var Auth = {
    user: null,
    profile: null,
    ready: false,
    authTab: 'signin',

    async init() {
        if (!window.sb) {
            console.error('Beatsify: Supabase client belum siap.');
            if (typeof window.hideSplashScreen === 'function') window.hideSplashScreen();
            var gate = gid('auth-gate');
            var gateForm = gid('auth-gate-form');
            if (gate) gate.style.display = 'flex';
            if (gateForm) gateForm.innerHTML = '<div class="glass-strong rounded-2xl p-5 text-center"><p class="text-white font-bold mb-1">Gagal terhubung ke server</p><p class="text-white/50 text-xs">Cek koneksi internet kamu, lalu muat ulang halaman.</p></div>';
            return;
        }
        try {
            var { data } = await sb.auth.getSession();
            await Auth._applySession(data && data.session);
        } catch (e) { console.error(e); }
        Auth.ready = true;
        Auth.syncGate();

        sb.auth.onAuthStateChange(function (event, session) {
            if (event === 'SIGNED_OUT') {
                if (typeof DataSync !== 'undefined') DataSync.onLogout();
                location.reload();
                return;
            }
            Auth._applySession(session).then(function () {
                Auth.syncGate();
                if (S && S.at === 'profile') Auth.renderProfile();
                if (typeof Home !== 'undefined' && Home.updateGreeting) Home.updateGreeting();
                if (event === 'SIGNED_IN' && typeof DataSync !== 'undefined') DataSync.onLogin();
            });
        });
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
            } catch (e) { console.error('Gagal memuat profil:', e); }
        }
        if (typeof Home !== 'undefined' && Home.updateGreeting) Home.updateGreeting();
    },

    get isLoggedIn() { return !!Auth.user; },

    getDisplayName() {
        if (!Auth.user) return null;
        return (Auth.profile && Auth.profile.username) || (Auth.user.email || '').split('@')[0];
    },

    async signInEmail() {
        var email = (gid('auth-email').value || '').trim();
        var password = gid('auth-password').value || '';
        if (!email || !password) { showToast('Isi email dan password'); return; }
        if (!/^[^\s@]+@gmail\.com$/i.test(email)) { showToast('Email harus menggunakan @gmail.com'); return; }
        var btn = gid('auth-submit-btn'); if (btn) btn.disabled = true;
        try {
            var { error } = await sb.auth.signInWithPassword({ email: email, password: password });
            if (error) { showToast(error.message === 'Invalid login credentials' ? 'Email atau password salah' : error.message); return; }
            showToast('Berhasil masuk!');
        } catch (e) { showToast('Gagal masuk: ' + e.message); }
        finally { if (btn) btn.disabled = false; }
    },

    async signUpEmail() {
        var username = (gid('auth-username').value || '').trim();
        var email = (gid('auth-email').value || '').trim();
        var password = gid('auth-password').value || '';
        if (!username || !email || !password) { showToast('Isi username, email, dan password'); return; }
        if (!/^[^\s@]+@gmail\.com$/i.test(email)) { showToast('Email harus menggunakan @gmail.com'); return; }
        if (password.length < 6) { showToast('Password minimal 6 karakter'); return; }
        var btn = gid('auth-submit-btn'); if (btn) btn.disabled = true;
        try {
            var { data, error } = await sb.auth.signUp({
                email: email,
                password: password,
                options: { data: { username: username } }
            });
            if (error) { showToast(error.message); return; }
            if (data && data.session) {
                showToast('Akun berhasil dibuat, langsung masuk!');
            } else {
                showToast('Akun dibuat. Aktifkan "Confirm email = OFF" di Supabase agar bisa langsung masuk tanpa verifikasi.');
            }
        } catch (e) { showToast('Gagal daftar: ' + e.message); }
        finally { if (btn) btn.disabled = false; }
    },

    async signOut() {
        try {
            await sb.auth.signOut();
            showToast('Berhasil keluar');
        } catch (e) { showToast('Gagal keluar: ' + e.message); }
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

    setAuthTab(tab) {
        Auth.authTab = tab;
        Auth.renderProfile();
    },

    async saveUsername() {
        var input = gid('profile-username-input');
        if (!input || !Auth.user) return;
        var newName = input.value.trim();
        if (!newName) { showToast('Username tidak boleh kosong'); return; }
        try {
            var { error } = await sb.from('profiles').update({ username: newName }).eq('id', Auth.user.id);
            if (error) { showToast('Gagal menyimpan username'); return; }
            Auth.profile = Auth.profile || {};
            Auth.profile.username = newName;
            showToast('Username diperbarui');
            if (typeof Home !== 'undefined' && Home.updateGreeting) Home.updateGreeting();
        } catch (e) { showToast('Gagal menyimpan username'); }
    },

    async handleAvatarChange(evt) {
        var file = evt.target.files && evt.target.files[0];
        if (!file || !Auth.user) return;
        try {
            var ext = (file.name.split('.').pop() || 'png').toLowerCase();
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
            el.innerHTML = `
            <div class="glass-strong rounded-2xl p-5 flex flex-col items-center gap-4">
                <div class="relative">
                    <img id="profile-avatar-img" src="${es(p.avatar_url) || '/logo.png'}" class="w-24 h-24 rounded-full object-cover border-2 border-[#3a3a3a] bg-black" onerror="this.src='/logo.png'"/>
                    <button onclick="document.getElementById('profile-avatar-input').click()" class="absolute -bottom-1 -right-1 btn-chrome rounded-full p-2 active:scale-90">
                        <i data-lucide="camera" class="w-4 h-4"></i>
                    </button>
                    <input type="file" id="profile-avatar-input" accept="image/*" class="hidden" onchange="Auth.handleAvatarChange(event)">
                </div>
                <div class="w-full text-left">
                    <label class="text-white/50 text-xs uppercase tracking-wider">Username</label>
                    <div class="flex gap-2 mt-1.5">
                        <input id="profile-username-input" value="${es(p.username || '')}" class="glass-input flex-1 px-3 py-2.5 text-sm text-white rounded-lg outline-none" />
                        <button onclick="Auth.saveUsername()" class="btn-chrome px-4 rounded-lg text-xs font-bold active:scale-95">Simpan</button>
                    </div>
                </div>
                <div class="w-full text-left">
                    <label class="text-white/50 text-xs uppercase tracking-wider">Email</label>
                    <p class="text-white text-sm mt-1.5 truncate">${es(Auth.maskEmail(Auth.user.email || ''))}</p>
                </div>
                <button onclick="Auth.signOut()" class="w-full btn-chrome font-bold py-3 rounded-full active:scale-95 transition-all flex items-center justify-center gap-2 text-rose-400">
                    <i data-lucide="log-out" class="w-4 h-4"></i> Log Out
                </button>
            </div>`;
        } else {
            el.innerHTML = Auth.authFormHTML();
        }
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    },

    authFormHTML() {
        var isSignin = Auth.authTab !== 'signup';
        return `
            <div class="glass-strong rounded-2xl p-5">
                <div class="flex gap-2 mb-4">
                    <button onclick="Auth.setAuthTab('signin')" class="flex-1 py-2 rounded-xl font-bold text-xs ${isSignin ? 'btn-chrome text-white' : 'text-white/50'}">Masuk</button>
                    <button onclick="Auth.setAuthTab('signup')" class="flex-1 py-2 rounded-xl font-bold text-xs ${!isSignin ? 'btn-chrome text-white' : 'text-white/50'}">Daftar</button>
                </div>
                <div class="space-y-3 text-left">
                    ${!isSignin ? `
                    <div>
                        <label class="text-white/50 text-xs uppercase tracking-wider">Username buat di Beatsify</label>
                        <input id="auth-username" type="text" placeholder="Nama tampilan kamu" class="glass-input w-full px-3 py-2.5 mt-1.5 text-sm text-white rounded-lg outline-none" />
                    </div>` : ''}
                    <div>
                        <label class="text-white/50 text-xs uppercase tracking-wider">Email</label>
                        <input id="auth-email" type="email" placeholder="nama@gmail.com" class="glass-input w-full px-3 py-2.5 mt-1.5 text-sm text-white rounded-lg outline-none" />
                    </div>
                    <div>
                        <label class="text-white/50 text-xs uppercase tracking-wider">Pasword buat di Beatsify</label>
                        <input id="auth-password" type="password" placeholder="••••••••" class="glass-input w-full px-3 py-2.5 mt-1.5 text-sm text-white rounded-lg outline-none" />
                    </div>
                    <button id="auth-submit-btn" onclick="${isSignin ? 'Auth.signInEmail()' : 'Auth.signUpEmail()'}" class="w-full btn-chrome font-bold py-3 rounded-full active:scale-95 transition-all">
                        ${isSignin ? 'Masuk' : 'Buat Akun'}
                    </button>
                    ${isSignin ? `<p class="text-center text-white/40 text-xs">Belum punya akun? <button onclick="Auth.setAuthTab('signup')" class="text-white font-bold underline">Daftar dulu</button></p>` : ''}
                </div>
            </div>`;
    },

    renderGate() {
        var el = gid('auth-gate-form');
        if (!el) return;
        el.innerHTML = Auth.authFormHTML();
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    },

    _gateResolved: false,
    syncGate() {
        var gate = gid('auth-gate');
        if (Auth.user) {
            if (gate) gate.style.display = 'none';
            if (typeof window.hideSplashScreen === 'function') window.hideSplashScreen();
            if (!Auth._gateResolved) {
                Auth._gateResolved = true;
                if (typeof window.startBeatsifyApp === 'function') window.startBeatsifyApp();
            }
        } else {
            if (typeof window.hideSplashScreen === 'function') window.hideSplashScreen();
            if (gate) gate.style.display = 'flex';
            Auth.renderGate();
        }
    }
};

(function () {
    var started = false;
    function start() { if (started) return; started = true; Auth.init(); }
    if (document.readyState === 'complete' || document.readyState === 'interactive') { start(); }
    else { document.addEventListener('DOMContentLoaded', start); }
})();
