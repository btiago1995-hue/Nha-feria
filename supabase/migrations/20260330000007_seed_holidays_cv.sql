-- Seed Cabo Verde national public holidays (2025 and 2026)
-- Source: Decreto-Lei n.º 56/2019, Lei nº 54/VIII/2013

DELETE FROM public.holidays_cv;

ALTER TABLE public.holidays_cv DROP CONSTRAINT IF EXISTS holidays_cv_date_key;
ALTER TABLE public.holidays_cv ADD CONSTRAINT holidays_cv_date_key UNIQUE (date);

INSERT INTO public.holidays_cv (date, name) VALUES
-- 2025
('2025-01-01', 'Ano Novo'),
('2025-01-13', 'Dia da Democracia e da Liberdade'),
('2025-02-20', 'Carnaval'),
('2025-04-18', 'Sexta-Feira Santa'),
('2025-04-20', 'Páscoa'),
('2025-05-01', 'Dia do Trabalhador'),
('2025-06-01', 'Dia das Crianças'),
('2025-07-05', 'Dia da Independência'),
('2025-08-15', 'Assunção de Nossa Senhora'),
('2025-11-01', 'Dia de Todos os Santos'),
('2025-12-25', 'Natal'),
-- 2026
('2026-01-01', 'Ano Novo'),
('2026-01-13', 'Dia da Democracia e da Liberdade'),
('2026-02-17', 'Carnaval'),
('2026-04-03', 'Sexta-Feira Santa'),
('2026-04-05', 'Páscoa'),
('2026-05-01', 'Dia do Trabalhador'),
('2026-06-01', 'Dia das Crianças'),
('2026-07-05', 'Dia da Independência'),
('2026-08-15', 'Assunção de Nossa Senhora'),
('2026-11-01', 'Dia de Todos os Santos'),
('2026-12-25', 'Natal');
