-- Fix: leave_requests_select_hierarchy concedia acesso a managers sem scoping de company_id.
-- get_my_role() IN ('manager','admin') é TRUE para todas as linhas da tabela,
-- permitindo que managers vejam pedidos de outras empresas.
-- Fix: substituir pela função manager_can_access_user() que já valida company_id.

DROP POLICY IF EXISTS "leave_requests_select_hierarchy" ON public.leave_requests;

CREATE POLICY "leave_requests_select_hierarchy" ON public.leave_requests
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.manager_can_access_user(user_id)
  );
