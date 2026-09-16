// Nilai default sama dengan public/config.js (anon/publishable key, aman dipakai di server juga).
// Bisa dioverride lewat environment variable saat deploy jika suatu saat kredensial berubah.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pcgrobgcavrrybuttqdy.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_4_eb9C2iIQKa24yVLX00XA_NKImYtYq';

// Service role key: RAHASIA, cuma dipakai di server (bukan di browser), dipakai admin.js
// buat nulis (insert/delete) data yang dibatasi RLS, misal tabel app_info.
// WAJIB diisi lewat Environment Variable "SUPABASE_SERVICE_ROLE_KEY" di Vercel Project Settings.
// Ambil nilainya dari Supabase Dashboard > Settings > API > "service_role" key.
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_KEY;

module.exports = { SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY };
