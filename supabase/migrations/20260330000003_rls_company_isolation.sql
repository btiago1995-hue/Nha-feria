-- Enforce company_id isolation on all manager RLS policies
-- Fixes: managers could previously see/edit profiles and requests across ALL companies

-- ── Step 1: helper functions (SECURITY DEFINER bypasses RLS to avoid recursion) ──

-- Returns the company_id of the current authenticated user
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Returns true if the given user_id belongs to the same company as the current user
-- and the current user is a manager/admin
CREATE OR REPLACE FUNCTION public.manager_can_access_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles AS me
    JOIN  public.profiles AS them ON them.id = target_user_id
    WHERE me.id     = auth.uid()
    AND   me.role   IN ('manager', 'admin')
    AND   me.company_id = them.company_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Step 2: drop old broad policies ──
DROP POLICY IF EXISTS "Managers can view all profiles"    ON public.profiles;
DROP POLICY IF EXISTS "Managers can update all profiles"  ON public.profiles;
DROP POLICY IF EXISTS "Managers can handle all requests"  ON public.leave_requests;

-- ── Step 3: recreate with company_id scoping ──

-- Profiles: managers only see their own company
CREATE POLICY "Managers can view company profiles" ON public.profiles
  FOR SELECT USING (
    public.check_user_is_manager()
    AND company_id = public.get_my_company_id()
  );

-- Profiles: managers only update employees in their company
CREATE POLICY "Managers can update company profiles" ON public.profiles
  FOR UPDATE
  USING (
    public.check_user_is_manager()
    AND company_id = public.get_my_company_id()
  );

-- Leave requests: managers only see/touch requests from their company's employees
CREATE POLICY "Managers can handle company requests" ON public.leave_requests
  FOR ALL USING (
    public.manager_can_access_user(user_id)
  );
