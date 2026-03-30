-- RGPD: secure function to delete a user and all their data
-- Only callable by a manager/admin of the same company

CREATE OR REPLACE FUNCTION public.gdpr_delete_user(p_target_user_id UUID)
RETURNS void AS $$
DECLARE
  v_caller_company UUID;
  v_target_company UUID;
  v_caller_role    TEXT;
BEGIN
  SELECT company_id, role INTO v_caller_company, v_caller_role
  FROM public.profiles WHERE id = auth.uid();

  IF v_caller_role NOT IN ('manager', 'admin') THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: Apenas gestores podem apagar colaboradores.';
  END IF;

  SELECT company_id INTO v_target_company
  FROM public.profiles WHERE id = p_target_user_id;

  IF v_target_company IS DISTINCT FROM v_caller_company THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: Não podes apagar utilizadores de outra empresa.';
  END IF;

  IF p_target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'SELF_DELETE: Não podes apagar a tua própria conta.';
  END IF;

  PERFORM public.write_audit_log(
    v_caller_company, auth.uid(),
    (SELECT full_name FROM public.profiles WHERE id = auth.uid()),
    'user_deleted', 'profile', p_target_user_id,
    jsonb_build_object(
      'deleted_user_name', (SELECT full_name FROM public.profiles WHERE id = p_target_user_id),
      'gdpr_request', true
    )
  );

  DELETE FROM public.leave_requests WHERE user_id = p_target_user_id;
  DELETE FROM public.profiles WHERE id = p_target_user_id;
  DELETE FROM auth.users WHERE id = p_target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
