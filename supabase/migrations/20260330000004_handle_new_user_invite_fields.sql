-- Update handle_new_user trigger to apply invite fields when a user signs up via invite link.
-- The invite token is passed in raw_user_meta_data so this works even when email
-- confirmation is required (the trigger fires on INSERT into auth.users, before confirmation).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_token      UUID;
  v_invite     public.company_invites%ROWTYPE;
BEGIN
  -- Try to find an invite for this signup
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
    -- Signup via invite: apply all invite fields
    INSERT INTO public.profiles (
      id, full_name, email, role,
      company_id, department, vacation_balance,
      nif, cni, hire_date, job_title
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
      NULLIF(NEW.raw_user_meta_data->>'job_title', '')
    );

    -- Mark invite as used
    UPDATE public.company_invites
    SET used_at = NOW()
    WHERE id = v_invite.id;
  ELSE
    -- Normal signup (no invite): create bare profile
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Utilizador'),
      NEW.email,
      'employee'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
