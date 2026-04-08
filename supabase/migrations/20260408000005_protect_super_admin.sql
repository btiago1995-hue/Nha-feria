-- Proteger o super-admin: este ID nunca perde o role admin
CREATE OR REPLACE FUNCTION public.protect_super_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.id = '3e58ffc6-ec2d-4ab9-888e-5e6a7710c203' THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_super_admin ON public.profiles;
CREATE TRIGGER enforce_super_admin
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin();
