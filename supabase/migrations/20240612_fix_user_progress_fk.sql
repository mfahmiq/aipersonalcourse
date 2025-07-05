-- Migration: Fix user_progress.user_id foreign key to reference public.users(id)

ALTER TABLE public.user_progress DROP CONSTRAINT IF EXISTS user_progress_user_id_fkey;

ALTER TABLE public.user_progress
  ADD CONSTRAINT user_progress_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE; 