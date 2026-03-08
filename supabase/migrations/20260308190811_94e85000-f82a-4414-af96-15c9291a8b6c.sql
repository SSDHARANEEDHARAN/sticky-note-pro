
-- Create sticky notes table (no auth required - simple local app)
CREATE TABLE public.sticky_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT 'yellow',
  rotation DOUBLE PRECISION NOT NULL DEFAULT 0,
  position_x DOUBLE PRECISION NOT NULL DEFAULT 100,
  position_y DOUBLE PRECISION NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sticky_notes ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (no auth)
CREATE POLICY "Allow all read" ON public.sticky_notes FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.sticky_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.sticky_notes FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.sticky_notes FOR DELETE USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_sticky_notes_updated_at
  BEFORE UPDATE ON public.sticky_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
