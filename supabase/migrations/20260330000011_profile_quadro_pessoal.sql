-- Quadro de Pessoal DGT — campos obrigatórios
-- Código Laboral CV, Art. 158.º-A — entrega anual à DGT
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender           TEXT CHECK (gender IN ('M', 'F')),
  ADD COLUMN IF NOT EXISTS birth_date       DATE,
  ADD COLUMN IF NOT EXISTS inps_number      TEXT,       -- Nº Beneficiário da Previdência (INPS)
  ADD COLUMN IF NOT EXISTS education_level  TEXT,       -- Habilitação literária
  ADD COLUMN IF NOT EXISTS employment_status TEXT,      -- Situação na profissão (Permanente, Contrato, etc.)
  ADD COLUMN IF NOT EXISTS base_salary      NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS food_allowance   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS weekly_hours     INT DEFAULT 40,
  ADD COLUMN IF NOT EXISTS last_promotion_date DATE;
