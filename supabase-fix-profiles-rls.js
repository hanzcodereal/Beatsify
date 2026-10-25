-- ============================================
-- 1. Bikin tabel profiles (kalau belum ada)
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text,
  avatar_url text,
  created_at timestamptz default now()
);

-- ============================================
-- 2. Aktifkan RLS + policy tabel profiles
-- ============================================
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can view own profile"
on public.profiles for select
using (true);

create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- ============================================
-- 3. Bucket storage buat foto profil (avatars)
-- ============================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Users can upload own avatar" on storage.objects;
drop policy if exists "Users can update own avatar" on storage.objects;

create policy "Avatar images are publicly accessible"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Users can upload own avatar"
on storage.objects for insert
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update own avatar"
on storage.objects for update
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================
-- 4. Bikin tabel app_info (buat fitur Informasi/pengumuman admin)
-- ============================================
create table if not exists public.app_info (
  id bigint generated always as identity primary key,
  title text not null,
  content text,
  created_at timestamptz default now()
);

alter table public.app_info enable row level security;

drop policy if exists "Anyone can view app_info" on public.app_info;
drop policy if exists "Service role can manage app_info" on public.app_info;

-- Semua orang (termasuk yang belum login) boleh baca informasi
create policy "Anyone can view app_info"
on public.app_info for select
using (true);

-- Insert/update/delete TIDAK dikasih policy sama sekali di sini secara sengaja.
-- Supaya user biasa (pakai anon key) tetap tidak bisa nulis ke tabel ini.
-- Admin nulis lewat "service role key" yang otomatis melewati RLS (lihat catatan kode).

-- ============================================
-- 5. Tabel user_data (lagu disukai, artis disukai, playlist, riwayat per akun)
-- ============================================
create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  liked_songs jsonb default '[]'::jsonb,
  liked_artists jsonb default '[]'::jsonb,
  playlists jsonb default '[]'::jsonb,
  history jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);

alter table public.user_data enable row level security;

drop policy if exists "Users can view own data" on public.user_data;
drop policy if exists "Users can insert own data" on public.user_data;
drop policy if exists "Users can update own data" on public.user_data;

create policy "Users can view own data"
on public.user_data for select
using (auth.uid() = user_id);

create policy "Users can insert own data"
on public.user_data for insert
with check (auth.uid() = user_id);

create policy "Users can update own data"
on public.user_data for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ============================================
-- 6. Trigger otomatis: bikin baris profiles begitu user baru daftar,
--    langsung ambil username dari data signup (bukan dari email).
--    Jalan di level server (SECURITY DEFINER), jadi tidak kena masalah
--    timing/RLS seperti kalau dilakukan dari browser.
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
    set username = coalesce(excluded.username, public.profiles.username),
        email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
