-- ── Fix 1: Set search_path = public on all functions ──────────────────────────
-- Prevents search_path injection attacks on SECURITY DEFINER functions

ALTER FUNCTION public.get_my_company_id()                        SET search_path = public;
ALTER FUNCTION public.manager_can_access_user(uuid)              SET search_path = public;
ALTER FUNCTION public.check_plan_collaborator_limit()            SET search_path = public;
ALTER FUNCTION public.write_audit_log(uuid,uuid,text,text,text,uuid,jsonb) SET search_path = public;
ALTER FUNCTION public.audit_leave_request_change()               SET search_path = public;
ALTER FUNCTION public.audit_profile_change()                     SET search_path = public;
ALTER FUNCTION public.sync_vacation_balance()                    SET search_path = public;
ALTER FUNCTION public.gdpr_delete_user(uuid)                     SET search_path = public;
ALTER FUNCTION public.reset_annual_vacation_balances()           SET search_path = public;
ALTER FUNCTION public.update_updated_at_column()                 SET search_path = public;
ALTER FUNCTION public.handle_new_user()                          SET search_path = public;
ALTER FUNCTION public.check_user_is_manager()                    SET search_path = public;

-- ── Fix 2: Restrict audit_log INSERT policy to service_role only ──────────────
-- Prevents any authenticated user from inserting directly into audit_log

DROP POLICY IF EXISTS "Service role can insert audit log" ON public.audit_log;
CREATE POLICY "Service role can insert audit log"
  ON public.audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);
