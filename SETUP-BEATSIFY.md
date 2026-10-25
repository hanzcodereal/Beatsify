# Setup Beatsify (Supabase)

Aplikasi ini sudah dikonfigurasi untuk pakai project Supabase kamu
(`pcgrobgcavrrybuttqdy`) dengan anon/publishable key yang sudah ditaruh di
`public/config.js`. Sebelum dipakai, lakukan langkah berikut:

## 1. Jalankan skema database
Buka **Supabase Dashboard → SQL Editor**, lalu jalankan seluruh isi file
`supabase-schema.sql` yang ada di root project ini. Ini akan membuat:
- Tabel `profiles` (username, foto profil, email) + trigger otomatis saat user daftar
- Tabel `app_info` (Informasi yang bisa ditambah/dihapus lewat `/admin`)
- Tabel `user_data` (lagu disukai, artis disukai, playlist, riwayat — per akun)
- Storage bucket `avatars` untuk foto profil

## 2. Matikan verifikasi email (biar langsung bisa masuk)
Supaya login/daftar pakai email **langsung masuk tanpa harus klik link di
email**, buka **Authentication → Sign In / Providers → Email**, lalu
matikan (uncheck) opsi **"Confirm email"**. Kalau opsi ini menyala,
Supabase akan mewajibkan user klik link verifikasi dulu sebelum bisa
login — dengan mematikannya, begitu daftar/masuk akun langsung aktif.

Login pakai **Google** memang dari awal tidak perlu verifikasi tambahan —
begitu user pilih akun Google, langsung masuk. Cukup pastikan provider
Google sudah diaktifkan (lihat langkah 3).

## 3. Aktifkan login Google
Di **Authentication → Providers → Google**:
1. Aktifkan toggle Google.
2. Isi **Client ID** dan **Client Secret** dari Google Cloud Console
   (buat OAuth Client ID tipe "Web application").
3. Tambahkan Redirect URL yang ditampilkan Supabase ke Authorized redirect
   URIs di Google Cloud Console.
4. Tambahkan domain aplikasi kamu (mis. `https://beatsify-kamu.vercel.app`)
   ke **Authentication → URL Configuration → Redirect URLs**.

Login email/password sudah langsung aktif tanpa setup tambahan.

## 4. Ganti kredensial admin
Buka `admin.json` di root project, ganti:
```json
{
  "username": "admin",
  "password": "beatsify-admin-2026",
  "jwtSecret": "beatsify-CHANGE-THIS-SECRET-3f9a7c1e"
}
```
dengan username, password, dan secret kamu sendiri **sebelum deploy ke
publik**. File ini tidak pernah dikirim ke browser — hanya dibaca oleh API
server (`/api/admin-login`, dll).

Login admin ada di: **`/admin`**

## 5. Catatan keamanan
Karena hanya tersedia anon/publishable key (bukan `service_role` key),
proteksi tambah/hapus data di tabel `app_info` bergantung pada endpoint
`/api/admin-info` yang memvalidasi token admin — bukan Row Level Security
murni di database. Untuk keamanan tingkat produksi yang lebih kuat, kamu
bisa menambahkan Supabase `service_role` key sebagai environment variable
di server dan memperketat RLS `app_info` agar hanya bisa ditulis lewat
service role.

## Ringkasan fitur yang ditambahkan
- Rebrand HanzMusify → **Beatsify**, tema warna hitam penuh
- Tombol "Install Aplikasi" dihapus
- Nav bar bawah: **Info → Profil** (isi info lama dipindah, bukan dihapus)
- Login email/password + Google, tombol Log Out
- Profil: foto profil (upload), username (bisa diubah), email (read-only)
- Home: sapaan waktu + nama user yang login, tombol "Informasi" (data dari database)
- `/admin`: jumlah akun terdaftar, tambah/hapus Informasi
- Lagu disukai, artis disukai, playlist, dan riwayat tersimpan di Supabase
  per akun — tidak hilang saat logout lalu login lagi (mode tamu/guest
  tanpa login tetap memakai localStorage seperti sebelumnya)
