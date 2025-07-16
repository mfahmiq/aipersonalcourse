-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create outlines table
create table outlines (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  topic text not null,
  degree text,
  level text not null,
  duration text,
  language text not null,
  include_video boolean default false,
  status text default 'Draft',
  modules integer not null,
  lessons integer not null,
  estimated_hours text,
  overview text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  user_id uuid references auth.users(id) on delete cascade
);

-- Create learning_goals table
create table learning_goals (
  id uuid primary key default uuid_generate_v4(),
  outline_id uuid references outlines(id) on delete cascade,
  goal text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create modules table
create table modules (
  id uuid primary key default uuid_generate_v4(),
  outline_id uuid references outlines(id) on delete cascade,
  module_number integer not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create lessons table
create table lessons (
  id uuid primary key default uuid_generate_v4(),
  module_id uuid references modules(id) on delete cascade,
  lesson_number text not null,
  title text not null,
  duration text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create courses table
create table courses (
  id uuid primary key default uuid_generate_v4(),
  outline_id uuid references outlines(id) on delete cascade,
  title text not null,
  description text,
  level text not null,
  duration text,
  estimated_hours text,
  modules integer not null,
  lessons integer not null,
  progress integer default 0,
  status text default 'active',
  type text default 'generated',
  settings jsonb,
  learning_goals text[],
  overview text,
  topic text,
  chatbot_qa jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  user_id uuid references auth.users(id) on delete cascade
);

-- Create course_chapters table
create table course_chapters (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  content text,
  video_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create user_progress table
create table user_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  completed boolean default false,
  progress_percentage integer default 0,
  last_accessed timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create profiles table for user information
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text default 'student',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create user_settings table
create table user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  theme text default 'light',
  language text default 'en',
  notifications_enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create user_sessions table
create table user_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  session_token text unique not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');

  insert into public.user_settings (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user registration
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to handle user deletion
create or replace function public.handle_user_deletion()
returns trigger as $$
begin
  delete from public.profiles where id = old.id;
  delete from public.user_settings where user_id = old.id;
  delete from public.user_sessions where user_id = old.id;
  return old;
end;
$$ language plpgsql security definer;

-- Create trigger for user deletion
create trigger on_auth_user_deleted
  before delete on auth.users
  for each row execute procedure public.handle_user_deletion();

-- Enable RLS on new tables
alter table profiles enable row level security;
alter table user_settings enable row level security;
alter table user_sessions enable row level security;

-- Create RLS policies for profiles
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Create RLS policies for user_settings
create policy "Users can view their own settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users can update their own settings"
  on user_settings for update
  using (auth.uid() = user_id);

-- Create RLS policies for user_sessions
create policy "Users can view their own sessions"
  on user_sessions for select
  using (auth.uid() = user_id);

create policy "Users can delete their own sessions"
  on user_sessions for delete
  using (auth.uid() = user_id);

-- Create indexes for better query performance
create index idx_outlines_topic on outlines(topic);
create index idx_outlines_status on outlines(status);
create index idx_learning_goals_outline_id on learning_goals(outline_id);
create index idx_modules_outline_id on modules(outline_id);
create index idx_lessons_module_id on lessons(module_id);
create index idx_courses_outline_id on courses(outline_id);
create index idx_courses_status on courses(status);
create index idx_course_chapters_course_id on course_chapters(course_id);
create index idx_user_progress_user_id on user_progress(user_id);
create index idx_user_progress_course_id on user_progress(course_id);
create index idx_user_progress_lesson_id on user_progress(lesson_id);
create index idx_profiles_email on profiles(email);
create index idx_user_settings_user_id on user_settings(user_id);
create index idx_user_sessions_user_id on user_sessions(user_id);
create index idx_user_sessions_token on user_sessions(session_token);

-- Create RLS (Row Level Security) policies
alter table outlines enable row level security;
alter table learning_goals enable row level security;
alter table modules enable row level security;
alter table lessons enable row level security;
alter table courses enable row level security;
alter table course_chapters enable row level security;
alter table user_progress enable row level security;

-- Create policies for authenticated users
create policy "Users can view their own outlines"
  on outlines for select
  using (auth.uid() = user_id);

create policy "Users can create outlines"
  on outlines for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own outlines"
  on outlines for update
  using (auth.uid() = user_id);

create policy "Users can delete their own outlines"
  on outlines for delete
  using (auth.uid() = user_id);

-- Similar policies for other tables
create policy "Users can view their own courses"
  on courses for select
  using (auth.uid() = user_id);

create policy "Users can create courses"
  on courses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own courses"
  on courses for update
  using (auth.uid() = user_id);

create policy "Users can delete their own courses"
  on courses for delete
  using (auth.uid() = user_id);
