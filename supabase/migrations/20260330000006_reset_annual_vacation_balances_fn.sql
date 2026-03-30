-- Create the function that pg_cron calls every January 1st.
-- Logic per Código Laboral CV Art. 158.º:
--   - Base: 22 days per year worked
--   - +2 days for each 5-year tenure bracket (max +8 = 30 days total)

CREATE OR REPLACE FUNCTION public.reset_annual_vacation_balances()
RETURNS void AS $$
DECLARE
  v_year       INT := EXTRACT(YEAR FROM NOW())::INT;
  v_profile    RECORD;
  v_years      INT;
  v_new_balance INT;
BEGIN
  FOR v_profile IN
    SELECT id, hire_date, vacation_balance
    FROM public.profiles
    WHERE company_id IS NOT NULL
      AND company_id != '00000000-0000-0000-0000-000000000000'
  LOOP
    IF v_profile.hire_date IS NULL THEN
      v_new_balance := 22;
    ELSE
      v_years := v_year - EXTRACT(YEAR FROM v_profile.hire_date)::INT;

      v_new_balance := CASE
        WHEN v_years < 1  THEN 22
        WHEN v_years < 5  THEN 22
        WHEN v_years < 10 THEN 24
        WHEN v_years < 15 THEN 26
        WHEN v_years < 20 THEN 28
        ELSE                   30
      END;
    END IF;

    UPDATE public.profiles
    SET vacation_balance = v_new_balance,
        updated_at       = NOW()
    WHERE id = v_profile.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
