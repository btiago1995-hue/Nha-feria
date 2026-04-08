-- Fix: managers precisam de ver toda a empresa no calendário global.
-- A restrição de hierarquia aplica-se só a UPDATE (aprovações), não a SELECT.
-- Employee: vê só o próprio perfil e os seus pedidos.
-- Manager/Admin: vê toda a empresa (para calendário, diretório, dashboards).
-- UPDATE em leave_requests: manager só aprova a sua equipa (manager_id).

-- ── profiles SELECT ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select_hierarchy" ON public.profiles;

CREATE POLICY "profiles_select_hierarchy" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id                                      -- employee vê o próprio
    OR (                                                 -- manager/admin vê toda a empresa
      public.get_my_role() IN ('manager', 'admin')
      AND company_id = (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- ── leave_requests SELECT ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "leave_requests_select_hierarchy" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_select_own" ON public.leave_requests;

CREATE POLICY "leave_requests_select_hierarchy" ON public.leave_requests
  FOR SELECT USING (
    user_id = auth.uid()                                 -- employee vê os seus
    OR public.get_my_role() IN ('manager', 'admin')      -- manager/admin vê todos
  );
