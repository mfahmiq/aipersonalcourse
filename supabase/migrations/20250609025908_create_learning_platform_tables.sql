-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create settings table
create table if not exists settings (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create outlines table
create table if not exists outlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  topic text,
  level text,
  duration text,
  language text,
  modules integer,
  lessons integer,
  overview text,
  modules_detail jsonb,
  degree text,
  created_at timestamptz default timezone('utc', now()),
  updatedAt timestamptz
);

-- Create courses table
create table if not exists courses (
  id uuid primary key default uuid_generate_v4(),
  outline_id uuid references outlines(id) on delete cascade,
  title text not null,
  description text,
  level text not null,
  duration text,
  modules integer not null,
  lessons integer not null,
  progress integer default 0,
  status text default 'active',
  type text default 'generated',
  settings jsonb,
  overview text,
  topic text,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  completed_lessons text[] default '{}',
  generation_progress jsonb,
  image text
);

-- Create course_chapters table
create table if not exists course_chapters (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  content jsonb,
  video_url text,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  module_title text,
  module_number smallint,
  number text,
  chatbot_qa jsonb
);
