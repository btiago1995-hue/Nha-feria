-- ── Hierarquia de roles: manager_id em profiles ─────────────────────────────
-- Cada employee aponta para o seu manager direto.
-- Admin (RH) vê toda a empresa.
-- Manager vê só os seus employees (manager_id = auth.uid()).
-- Employee vê apenas os seus próprios dados.

-- ── 1. Adicionar manager_id a profiles ───────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ── 2. Adicionar manager_id a company_invites ─────────────────────────────────
ALTER TABLE public.company_invites
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ── 3. Função helper get_my_role() — evita subquery recursiva em RLS ─────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ── 4. Atualizar RLS em profiles ─────────────────────────────────────────────

-- Remover todas as policies de SELECT/UPDATE existentes em profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in same company" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view all company profiles" ON public.profiles;

-- SELECT: employee vê o próprio; manager vê a sua equipa; admin vê todos
CREATE POLICY "profiles_select_hierarchy" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id                                    -- vê o próprio
    OR manager_id = auth.uid()                         -- manager vê a sua equipa
    OR public.get_my_role() = 'admin'                  -- admin vê todos
  );

-- UPDATE: utilizador atualiza o próprio (exceto role); admin atualiza qualquer perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can update company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (
    public.get_my_role() = 'admin'
  );

-- ── 5. Atualizar RLS em leave_requests ───────────────────────────────────────

-- Remover policies existentes de managers em leave_requests
DROP POLICY IF EXISTS "Managers can view all leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Managers can handle all requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Managers can handle company requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Managers can update leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.leave_requests;

-- SELECT: employee vê os seus; manager vê os da sua equipa; admin vê todos
CREATE POLICY "leave_requests_select_hierarchy" ON public.leave_requests
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = leave_requests.user_id
        AND manager_id = auth.uid()
    )
    OR public.get_my_role() = 'admin'
  );

-- UPDATE (aprovação): manager aprova pedidos da sua equipa; admin aprova todos
CREATE POLICY "leave_requests_update_manager" ON public.leave_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = leave_requests.user_id
        AND manager_id = auth.uid()
    )
    OR public.get_my_role() = 'admin'
  );

-- SELECT para o próprio employee (deixar ver os seus pedidos)
CREATE POLICY "leave_requests_select_own" ON public.leave_requests
  FOR SELECT USING (user_id = auth.uid());

-- INSERT: só o próprio employee pode criar o seu pedido
DROP POLICY IF EXISTS "Users can insert their own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can create their own requests" ON public.leave_requests;
CREATE POLICY "leave_requests_insert_own" ON public.leave_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ── 6. Índice para performance ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS profiles_manager_id_idx ON public.profiles(manager_id);
CREATE INDEX IF NOT EXISTS profiles_company_manager_idx ON public.profiles(company_id, manager_id);
