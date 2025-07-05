ALTER TABLE user_progress
  ALTER COLUMN completed TYPE text USING completed::text; 