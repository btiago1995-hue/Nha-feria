-- Versão final do handle_new_user com manager_id e sem criação de empresa no trigger.
-- Fluxo correcto:
--   Signup normal (fundador) → trigger cria perfil employee → setup_company_admin() promove a admin + cria empresa
--   Signup via convite → trigger cria perfil employee com campos do convite (incluindo manager_id)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_token      UUID;
  v_invite     public.company_invites%ROWTYPE;
BEGIN
  BEGIN
    v_token := (NEW.raw_user_meta_data->>'invite_token')::UUID;
  EXCEPTION WHEN others THEN
    v_token := NULL;
  END;

  IF v_token IS NOT NULL THEN
    SELECT * INTO v_invite
    FROM public.company_invites
    WHERE token = v_token
      AND used_at IS NULL
      AND expires_at > NOW()
    LIMIT 1;
  END IF;

  IF v_invite.id IS NOT NULL THEN
    -- Signup via convite: employee com campos do convite
    INSERT INTO public.profiles (
      id, full_name, email, role,
      company_id, department, vacation_balance,
      nif, cni, hire_date, job_title,
      manager_id
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', v_invite.full_name, 'Colaborador'),
      NEW.email,
      'employee',
      v_invite.company_id,
      v_invite.department,
      v_invite.vacation_balance,
      NULLIF(NEW.raw_user_meta_data->>'nif', ''),
      NULLIF(NEW.raw_user_meta_data->>'cni', ''),
      NULLIF(NEW.raw_user_meta_data->>'hire_date', '')::DATE,
      NULLIF(NEW.raw_user_meta_data->>'job_title', ''),
      v_invite.manager_id
    );

    UPDATE public.company_invites
    SET used_at = NOW()
    WHERE id = v_invite.id;

  ELSE
    -- Signup normal (fundador/RH): perfil simples employee
    -- setup_company_admin() é chamado a seguir pelo frontend e promove a admin + cria empresa
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Administrador'),
      NEW.email,
      'employee'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
