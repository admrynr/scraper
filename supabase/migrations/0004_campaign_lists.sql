-- Migration: Dashboard Campaign/Lists
-- Description: Create tables for prospect_lists and saved_prospects with RLS

-- 1. Create `prospect_lists` table
CREATE TABLE IF NOT EXISTS public.prospect_lists (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookup by user_id
CREATE INDEX IF NOT EXISTS prospect_lists_user_id_idx ON public.prospect_lists(user_id);

-- Trigger for auto-updating `updated_at`
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Only create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_prospect_lists_modtime'
    ) THEN
        CREATE TRIGGER update_prospect_lists_modtime
            BEFORE UPDATE ON public.prospect_lists
            FOR EACH ROW
            EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;

-- Enable RLS for `prospect_lists`
ALTER TABLE public.prospect_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for `prospect_lists`
CREATE POLICY "Users can view their own lists" 
    ON public.prospect_lists FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lists" 
    ON public.prospect_lists FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists" 
    ON public.prospect_lists FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists" 
    ON public.prospect_lists FOR DELETE 
    USING (auth.uid() = user_id);

-- 2. Create `saved_prospects` table
CREATE TABLE IF NOT EXISTS public.saved_prospects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id uuid REFERENCES public.prospect_lists(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    place_id text NOT NULL,
    name text NOT NULL,
    category text,
    address text,
    phone text,
    website text,
    rating numeric,
    reviews integer,
    maps_url text,
    status text DEFAULT 'belum_dihubungi' NOT NULL,
    notes text,
    saved_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraint: Ensure a prospect is not saved multiple times in the same list
    CONSTRAINT saved_prospects_unique_list_place UNIQUE(list_id, place_id)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS saved_prospects_list_id_idx ON public.saved_prospects(list_id);
CREATE INDEX IF NOT EXISTS saved_prospects_user_id_idx ON public.saved_prospects(user_id);
CREATE INDEX IF NOT EXISTS saved_prospects_status_idx ON public.saved_prospects(status);

-- Enable RLS for `saved_prospects`
ALTER TABLE public.saved_prospects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for `saved_prospects`
CREATE POLICY "Users can view their own saved prospects" 
    ON public.saved_prospects FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved prospects" 
    ON public.saved_prospects FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved prospects" 
    ON public.saved_prospects FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved prospects" 
    ON public.saved_prospects FOR DELETE 
    USING (auth.uid() = user_id);
