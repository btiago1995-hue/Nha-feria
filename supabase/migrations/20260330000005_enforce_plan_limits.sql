-- Enforce collaborator limits per plan server-side.
-- Runs as a BEFORE INSERT trigger on profiles — raises an exception if the company is at capacity.

CREATE OR REPLACE FUNCTION public.check_plan_collaborator_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_plan       TEXT;
  v_current    INT;
  v_limit      INT;
BEGIN
  IF NEW.company_id IS NULL OR NEW.company_id = '00000000-0000-0000-0000-000000000000' THEN
    RETURN NEW;
  END IF;

  SELECT plan INTO v_plan FROM public.companies WHERE id = NEW.company_id;

  v_limit := CASE v_plan
    WHEN 'starter'    THEN 5
    WHEN 'pro'        THEN 50
    WHEN 'enterprise' THEN 2147483647
    ELSE 5
  END;

  SELECT COUNT(*) INTO v_current
  FROM public.profiles
  WHERE company_id = NEW.company_id;

  IF v_current >= v_limit THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED: O plano % permite no máximo % colaboradores.', v_plan, v_limit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_plan_limit_on_profile ON public.profiles;
CREATE TRIGGER enforce_plan_limit_on_profile
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.check_plan_collaborator_limit();
