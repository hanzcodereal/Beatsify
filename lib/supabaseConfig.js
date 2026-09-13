// Nilai default sama dengan public/config.js (anon/publishable key, aman dipakai di server juga).
// Bisa dioverride lewat environment variable saat deploy jika suatu saat kredensial berubah.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pcgrobgcavrrybuttqdy.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_4_eb9C2iIQKa24yVLX00XA_NKImYtYq';

module.exports = { SUPABASE_URL, SUPABASE_KEY };
