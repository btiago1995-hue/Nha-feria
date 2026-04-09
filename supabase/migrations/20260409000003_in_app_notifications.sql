CREATE TABLE public.notifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type        TEXT NOT NULL, -- 'leave_submitted' | 'leave_decided' | 'invite_accepted'
  title       TEXT NOT NULL,
  body        TEXT,
  read        BOOLEAN DEFAULT FALSE,
  data        JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_notifications" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = FALSE;
