-- Fix: profiles_select_hierarchy had a plain subquery that caused RLS infinite recursion.
-- SELECT company_id FROM profiles WHERE id = auth.uid() inside a policy triggers
-- the same policy again → infinite loop → 500 error on every profile fetch.
-- Fix: replace with get_my_company_id() SECURITY DEFINER which bypasses RLS.

DROP POLICY IF EXISTS "profiles_select_hierarchy" ON public.profiles;

CREATE POLICY "profiles_select_hierarchy" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR (
      public.get_my_role() IN ('manager', 'admin')
      AND company_id = public.get_my_company_id()
    )
  );
