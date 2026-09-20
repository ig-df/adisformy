-- ==============================================================================
-- ADIS FORMY: MODUL "MAPA ZÁVODU A STAV LISŮ" (SUPABASE SQL SCRIPT)
-- ==============================================================================

-- 1. Tabulka lisů / strojů
CREATE TABLE IF NOT EXISTS public.machines (
    id TEXT PRIMARY KEY,                       -- Např. '1', '2', '3' ... '24'
    name TEXT NOT NULL,                        -- Např. 'Lis 1', 'Lis 2'
    model TEXT DEFAULT '',                     -- Např. 'Engel 150T', 'Arburg 200T'
    tonnage TEXT DEFAULT '',                   -- Např. '150t', '250t'
    row_zone TEXT DEFAULT 'Řada A',            -- Sektor / řada: 'Řada A', 'Řada B', 'Řada C'
    status TEXT DEFAULT 'ok' CHECK (status IN ('ok', 'warning', 'error', 'off')), 
                                               -- 'ok' (zelená), 'warning' (žlutá), 'error' (červená), 'off' (šedá)
    current_mold_id TEXT DEFAULT '',           -- Číslo formy, která je právě na lisu
    notes TEXT DEFAULT '',                     -- Rychlá poznámka ke stroji
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabulka hlášení závad, úkolů a oprav mechaniků
CREATE TABLE IF NOT EXISTS public.machine_issues (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    machine_id TEXT NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
    title TEXT NOT NULL,                       -- Stručný popis závady / úkolu
    description TEXT DEFAULT '',               -- Podrobnosti opravy / součástky
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')), 
                                               -- 'low' (nízká), 'medium' (střední), 'high' (kritická)
    category TEXT DEFAULT 'Mechanika',         -- 'Mechanika', 'Hydraulika', 'Elektro', 'Teplota', 'Robot/Přísl'
    is_resolved BOOLEAN DEFAULT FALSE,         -- FALSE = otevřená závada, TRUE = opraveno
    created_by TEXT DEFAULT 'Mechanik',        -- Kdo závadu nahlásil
    resolved_by TEXT DEFAULT NULL,             -- Kdo závadu opravil
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ DEFAULT NULL
);

-- 3. Nastavení indexů pro bleskovou rychlost vyhledávání (60 FPS)
CREATE INDEX IF NOT EXISTS idx_machines_row_zone ON public.machines(row_zone);
CREATE INDEX IF NOT EXISTS idx_machines_status ON public.machines(status);
CREATE INDEX IF NOT EXISTS idx_machine_issues_machine_id ON public.machine_issues(machine_id);
CREATE INDEX IF NOT EXISTS idx_machine_issues_is_resolved ON public.machine_issues(is_resolved);

-- 4. Zabezpečení Row Level Security (RLS) a veřejná práva pro aplikaci
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_issues ENABLE ROW LEVEL SECURITY;

-- Politiky pro tabulku machines
DROP POLICY IF EXISTS "Allow public read machines" ON public.machines;
CREATE POLICY "Allow public read machines" ON public.machines FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert machines" ON public.machines;
CREATE POLICY "Allow public insert machines" ON public.machines FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update machines" ON public.machines;
CREATE POLICY "Allow public update machines" ON public.machines FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete machines" ON public.machines;
CREATE POLICY "Allow public delete machines" ON public.machines FOR DELETE USING (true);

-- Politiky pro tabulku machine_issues
DROP POLICY IF EXISTS "Allow public read machine_issues" ON public.machine_issues;
CREATE POLICY "Allow public read machine_issues" ON public.machine_issues FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert machine_issues" ON public.machine_issues;
CREATE POLICY "Allow public insert machine_issues" ON public.machine_issues FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update machine_issues" ON public.machine_issues;
CREATE POLICY "Allow public update machine_issues" ON public.machine_issues FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete machine_issues" ON public.machine_issues;
CREATE POLICY "Allow public delete machine_issues" ON public.machine_issues FOR DELETE USING (true);

-- 5. Zapnutí Supabase Realtime pro okamžitou synchronizaci změn na všech zařízeních
ALTER PUBLICATION supabase_realtime ADD TABLE public.machines;
ALTER PUBLICATION supabase_realtime ADD TABLE public.machine_issues;

-- 6. Základní výchozí naplnění lisů (1 až 24) rozdělených do řad A, B, C
INSERT INTO public.machines (id, name, model, tonnage, row_zone, status) VALUES
    ('1', 'Lis 1', 'Engel', '150T', 'Řada A', 'ok'),
    ('2', 'Lis 2', 'Engel', '150T', 'Řada A', 'ok'),
    ('3', 'Lis 3', 'Arburg', '200T', 'Řada A', 'ok'),
    ('4', 'Lis 4', 'Arburg', '200T', 'Řada A', 'ok'),
    ('5', 'Lis 5', 'Engel', '250T', 'Řada A', 'ok'),
    ('6', 'Lis 6', 'Engel', '250T', 'Řada A', 'ok'),
    ('7', 'Lis 7', 'KraussMaffei', '300T', 'Řada A', 'ok'),
    ('8', 'Lis 8', 'KraussMaffei', '300T', 'Řada A', 'ok'),
    ('9', 'Lis 9', 'Engel', '150T', 'Řada B', 'ok'),
    ('10', 'Lis 10', 'Engel', '150T', 'Řada B', 'ok'),
    ('11', 'Lis 11', 'Arburg', '200T', 'Řada B', 'ok'),
    ('12', 'Lis 12', 'Arburg', '200T', 'Řada B', 'ok'),
    ('13', 'Lis 13', 'Battenfeld', '250T', 'Řada B', 'ok'),
    ('14', 'Lis 14', 'Battenfeld', '250T', 'Řada B', 'ok'),
    ('15', 'Lis 15', 'KraussMaffei', '350T', 'Řada B', 'ok'),
    ('16', 'Lis 16', 'KraussMaffei', '350T', 'Řada B', 'ok'),
    ('17', 'Lis 17', 'Engel', '80T', 'Řada C', 'ok'),
    ('18', 'Lis 18', 'Engel', '80T', 'Řada C', 'ok'),
    ('19', 'Lis 19', 'Arburg', '100T', 'Řada C', 'ok'),
    ('20', 'Lis 20', 'Arburg', '100T', 'Řada C', 'ok'),
    ('21', 'Lis 21', 'Engel', '120T', 'Řada C', 'ok'),
    ('22', 'Lis 22', 'Engel', '120T', 'Řada C', 'ok'),
    ('23', 'Lis 23', 'Demag', '180T', 'Řada C', 'ok'),
    ('24', 'Lis 24', 'Demag', '180T', 'Řada C', 'ok')
ON CONFLICT (id) DO NOTHING;
