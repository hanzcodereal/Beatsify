-- =====================================================================
-- SKEMA DATABASE SUPABASE UNTUK BEATSIFY
-- Jalankan seluruh isi file ini SEKALI di Supabase Dashboard > SQL Editor
-- (Project: pcgrobgcavrrybuttqdy)
-- =====================================================================

-- 1) TABEL PROFILES
-- Menyimpan username, foto profil, dan email untuk tiap akun.
-- Baris dibuat otomatis saat ada user baru mendaftar (lihat trigger di bawah).
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text,
  avatar_url text,
  email text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Trigger: otomatis buat baris profile saat user baru sign up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2) TABEL APP_INFO (Informasi yang dikelola admin, ditampilkan di Home)
create table if not exists public.app_info (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text,
  created_at timestamptz default now()
);

alter table public.app_info enable row level security;

drop policy if exists "app_info_select_all" on public.app_info;
create policy "app_info_select_all" on public.app_info
  for select using (true);

-- Catatan keamanan: insert/update/delete untuk app_info dilakukan lewat
-- endpoint server /api/admin-info (dilindungi login admin di admin.json).
-- Policy di bawah mengizinkan anon key melakukan insert/delete HANYA lewat
-- endpoint tersebut, karena tidak ada service_role key yang dipakai di
-- proyek ini. Jika ingin proteksi database-level yang lebih kuat, gunakan
-- Supabase service_role key di server (simpan sbg env var, jangan di client).
drop policy if exists "app_info_write_anon" on public.app_info;
create policy "app_info_write_anon" on public.app_info
  for all using (true) with check (true);

-- 3) TABEL USER_DATA (lagu disukai, artis disukai, playlist, riwayat per akun)
-- Satu baris per user; disinkronkan dari browser lewat public/sync.js
create table if not exists public.user_data (
  user_id uuid references auth.users(id) on delete cascade primary key,
  liked_songs jsonb default '[]'::jsonb,
  liked_artists jsonb default '[]'::jsonb,
  playlists jsonb default '[]'::jsonb,
  history jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);

alter table public.user_data enable row level security;

drop policy if exists "user_data_owner_select" on public.user_data;
create policy "user_data_owner_select" on public.user_data
  for select using (auth.uid() = user_id);

drop policy if exists "user_data_owner_insert" on public.user_data;
create policy "user_data_owner_insert" on public.user_data
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_data_owner_update" on public.user_data;
create policy "user_data_owner_update" on public.user_data
  for update using (auth.uid() = user_id);

-- 4) STORAGE BUCKET UNTUK FOTO PROFIL
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_write" on storage.objects;
create policy "avatars_owner_write" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================================
-- SELESAI. Setelah menjalankan script ini:
-- 1. Aktifkan provider "Google" di Authentication > Providers (isi Client ID
--    & Secret dari Google Cloud Console) agar tombol "Lanjutkan dengan Google"
--    berfungsi.
-- 2. Ganti username & password di file admin.json sebelum deploy ke publik.
-- =====================================================================
