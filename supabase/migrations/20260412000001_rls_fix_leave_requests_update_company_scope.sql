-- Fix: leave_requests_update_manager allowed any admin to UPDATE leave requests
-- from any company (missing company_id scope). An admin in Company A could
-- approve/reject requests belonging to Company B.

DROP POLICY IF EXISTS "leave_requests_update_manager" ON public.leave_requests;

CREATE POLICY "leave_requests_update_manager" ON public.leave_requests
  FOR UPDATE USING (
    -- Manager can update their direct reports' requests
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = leave_requests.user_id
        AND p.manager_id = auth.uid()
    )
    OR
    -- Admin can update anyone in their own company only
    (
      public.get_my_role() = 'admin'
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = leave_requests.user_id
          AND p.company_id = public.get_my_company_id()
      )
    )
  );
