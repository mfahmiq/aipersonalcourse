-- Aktifkan ekstensi UUID
create extension if not exists "uuid-ossp";

-- Tabel profil
create table if not exists profil (
  id uuid primary key references auth.users(id) on delete cascade,
  nama_lengkap text,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabel outlines (nama dan kolom outline tetap, kolom lain bahasa Indonesia)
create table if not exists outlines (
  id uuid primary key default gen_random_uuid(),
  pengguna_id uuid references auth.users(id) on delete cascade,
  judul text not null,
  deskripsi text,
  topik text,
  tingkat text,
  durasi text,
  bahasa text,
  jumlah_modul integer,
  jumlah_materi integer,
  ringkasan text,
  detail_modul jsonb,
  mata_pelajaran text,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz
);

-- Tabel kursus
create table if not exists kursus (
  id uuid primary key default uuid_generate_v4(),
  outline_id uuid references outlines(id) on delete cascade,
  judul text not null,
  deskripsi text,
  tingkat text not null,
  durasi text,
  jumlah_modul integer not null,
  jumlah_materi integer not null,
  kemajuan integer default 0,
  ringkasan text,
  topik text,
  pengguna_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  materi_selesai text[] default '{}',
  gambar text
);

-- Tabel materi
create table if not exists materi (
  id uuid primary key default uuid_generate_v4(),
  kursus_id uuid references kursus(id) on delete cascade,
  judul text not null,
  konten jsonb,
  url_video text,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  judul_modul text,
  nomor_modul smallint,
  nomor_materi text,
  chatbot_qa jsonb
);