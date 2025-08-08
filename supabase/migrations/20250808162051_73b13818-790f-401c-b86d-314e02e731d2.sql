-- Add unique constraint for exercise records to avoid duplicates per user/exercise
DO $$ BEGIN
  ALTER TABLE public.exercise_records
    ADD CONSTRAINT exercise_records_unique_user_exercise UNIQUE (user_id, exercise_name);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure unique push subscription per user+endpoint (supports upsert on conflict)
DO $$ BEGIN
  ALTER TABLE public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_unique_user_endpoint UNIQUE (user_id, endpoint);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Prevent duplicate friendships regardless of requester/addressee order
CREATE UNIQUE INDEX IF NOT EXISTS friendships_unique_pair_idx
  ON public.friendships (
    LEAST(requester_id, addressee_id),
    GREATEST(requester_id, addressee_id)
  );

-- Disallow self-friendships
DO $$ BEGIN
  ALTER TABLE public.friendships
    ADD CONSTRAINT friendships_requester_not_addressee CHECK (requester_id <> addressee_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Constrain friendship status values (pending | accepted | rejected)
DO $$ BEGIN
  ALTER TABLE public.friendships
    ADD CONSTRAINT friendships_status_check CHECK (status IN ('pending','accepted','rejected'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helpful index for notifications retrieval
CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);
