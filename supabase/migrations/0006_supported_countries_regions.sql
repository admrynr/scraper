-- Tabel untuk menyimpan daftar negara yang didukung DataForSEO
CREATE TABLE IF NOT EXISTS public.supported_countries (
    country_iso_code VARCHAR(10) PRIMARY KEY,
    location_name VARCHAR(255) NOT NULL,
    business_count INTEGER DEFAULT 0,
    is_recommended BOOLEAN DEFAULT false,
    flag_emoji VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabel untuk menyimpan cache region/kota per negara (fetch on demand)
CREATE TABLE IF NOT EXISTS public.supported_regions_cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_iso_code VARCHAR(10) NOT NULL REFERENCES public.supported_countries(country_iso_code) ON DELETE CASCADE,
    location_code INTEGER NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    parent_location_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(country_iso_code, location_code)
);

-- RLS Policies
ALTER TABLE public.supported_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_regions_cities ENABLE ROW LEVEL SECURITY;

-- Semua pengguna yang login dapat membaca (SELECT)
CREATE POLICY "Enable read access for authenticated users on supported_countries" 
ON public.supported_countries FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable read access for authenticated users on supported_regions_cities" 
ON public.supported_regions_cities FOR SELECT 
TO authenticated 
USING (true);

-- Hanya role service_role/admin yang bisa insert/update
CREATE POLICY "Enable insert/update for service_role on supported_countries" 
ON public.supported_countries FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable insert/update for service_role on supported_regions_cities" 
ON public.supported_regions_cities FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant privileges
GRANT ALL ON TABLE public.supported_countries TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.supported_regions_cities TO anon, authenticated, service_role;
