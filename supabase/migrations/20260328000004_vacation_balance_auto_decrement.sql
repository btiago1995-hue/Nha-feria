-- Auto-decrement vacation balance on leave approval (férias only)
-- Restores balance when approval is reverted (rejected/cancelled)

CREATE OR REPLACE FUNCTION public.sync_vacation_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_days INTEGER;
BEGIN
  -- Only affect férias type
  IF NEW.type != 'férias' THEN
    RETURN NEW;
  END IF;

  -- Count business days (Mon-Fri) for the leave period
  SELECT COUNT(*)
  INTO v_days
  FROM generate_series(NEW.start_date::date, NEW.end_date::date, '1 day'::interval) d
  WHERE EXTRACT(DOW FROM d) NOT IN (0, 6);

  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Deduct days on approval
    UPDATE public.profiles
    SET vacation_balance = GREATEST(0, vacation_balance - v_days)
    WHERE id = NEW.user_id;

  ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
    -- Restore days when approval is reverted
    UPDATE public.profiles
    SET vacation_balance = vacation_balance + v_days
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_leave_request_status_change ON public.leave_requests;

CREATE TRIGGER on_leave_request_status_change
  AFTER UPDATE OF status ON public.leave_requests
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_vacation_balance();
