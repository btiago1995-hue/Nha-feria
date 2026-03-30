-- Audit log: tracks sensitive operations for compliance/DGT inspection
CREATE TABLE IF NOT EXISTS public.audit_log (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id   UUID,
  actor_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name   TEXT,
  action       TEXT NOT NULL,
  target_type  TEXT,
  target_id    UUID,
  details      JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_log_company_created
  ON public.audit_log (company_id, created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view company audit log" ON public.audit_log
  FOR SELECT USING (
    public.check_user_is_manager()
    AND company_id = public.get_my_company_id()
  );

CREATE POLICY "Service role can insert audit log" ON public.audit_log
  FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_company_id  UUID,
  p_actor_id    UUID,
  p_actor_name  TEXT,
  p_action      TEXT,
  p_target_type TEXT,
  p_target_id   UUID,
  p_details     JSONB DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO public.audit_log
    (company_id, actor_id, actor_name, action, target_type, target_id, details)
  VALUES
    (p_company_id, p_actor_id, p_actor_name, p_action, p_target_type, p_target_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: log leave approvals and rejections
CREATE OR REPLACE FUNCTION public.audit_leave_request_change()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_actor_name TEXT;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('approved', 'rejected') THEN RETURN NEW; END IF;

  SELECT company_id INTO v_company_id FROM public.profiles WHERE id = NEW.user_id;
  SELECT full_name  INTO v_actor_name FROM public.profiles WHERE id = NEW.approved_by;

  PERFORM public.write_audit_log(
    v_company_id, NEW.approved_by,
    COALESCE(v_actor_name, 'Sistema'),
    CASE NEW.status WHEN 'approved' THEN 'leave_approved' ELSE 'leave_rejected' END,
    'leave_request', NEW.id,
    jsonb_build_object(
      'user_id', NEW.user_id, 'start_date', NEW.start_date,
      'end_date', NEW.end_date, 'type', NEW.type,
      'status_from', OLD.status, 'status_to', NEW.status
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_leave_status_change ON public.leave_requests;
CREATE TRIGGER audit_leave_status_change
  AFTER UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE PROCEDURE public.audit_leave_request_change();

-- Trigger: log profile role/balance changes
CREATE OR REPLACE FUNCTION public.audit_profile_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = NEW.role AND OLD.vacation_balance = NEW.vacation_balance THEN RETURN NEW; END IF;

  PERFORM public.write_audit_log(
    NEW.company_id, auth.uid(),
    (SELECT full_name FROM public.profiles WHERE id = auth.uid()),
    'profile_updated', 'profile', NEW.id,
    jsonb_build_object(
      'role_from', OLD.role, 'role_to', NEW.role,
      'balance_from', OLD.vacation_balance, 'balance_to', NEW.vacation_balance
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_profile_updates ON public.profiles;
CREATE TRIGGER audit_profile_updates
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.audit_profile_change();
