const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pcgrobgcavrrybuttqdy.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_4_eb9C2iIQKa24yVLX00XA_NKImYtYq';

const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_KEY;

module.exports = { SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY };
