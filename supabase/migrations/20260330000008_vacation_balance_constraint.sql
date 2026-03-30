-- Enforce vacation_balance bounds: 0 minimum, 60 maximum (legal cap CV)
ALTER TABLE public.profiles
  ADD CONSTRAINT vacation_balance_range
  CHECK (vacation_balance >= 0 AND vacation_balance <= 60);
