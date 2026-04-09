CREATE OR REPLACE FUNCTION public.notify_manager_on_leave()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_manager_id UUID;
  v_worker_name TEXT;
BEGIN
  -- Find the manager for this worker
  SELECT manager_id, full_name INTO v_manager_id, v_worker_name
  FROM public.profiles WHERE id = NEW.user_id;

  -- Also notify all admins
  INSERT INTO public.notifications(user_id, type, title, body, data)
  SELECT p.id, 'leave_submitted',
    v_worker_name || ' pediu férias',
    'De ' || NEW.start_date::TEXT || ' a ' || NEW.end_date::TEXT,
    jsonb_build_object('leave_request_id', NEW.id, 'worker_id', NEW.user_id)
  FROM public.profiles p
  WHERE p.company_id = (SELECT company_id FROM public.profiles WHERE id = NEW.user_id)
    AND (p.id = v_manager_id OR p.role = 'admin')
    AND p.id IS NOT NULL;

  -- Notify worker when request is decided
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_leave_request_submitted
  AFTER INSERT ON public.leave_requests
  FOR EACH ROW WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_manager_on_leave();
