-- Hardening: make explicit that authenticated users cannot modify holidays_cv.
-- Supabase denies by default when no policy matches, but explicit deny is
-- clearer and survives future RLS resets or policy audits.

CREATE POLICY "holidays_cv_immutable"
  ON public.holidays_cv
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    current_setting('role', true) = 'service_role'
  )
  WITH CHECK (
    current_setting('role', true) = 'service_role'
  );
