-- SCHEMA: Learning Platform

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 2. OUTLINES
CREATE TABLE IF NOT EXISTS outlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    topic TEXT,
    level TEXT,
    duration TEXT,
    language TEXT,
    modules INTEGER,
    lessons INTEGER,
    overview TEXT,
    learning_goal TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 3. COURSES
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outline_id UUID REFERENCES outlines(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    level TEXT,
    duration TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 4. LESSONS
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    youtube_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 5. CHATBOT HISTORIES
CREATE TABLE IF NOT EXISTS chatbot_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
); 