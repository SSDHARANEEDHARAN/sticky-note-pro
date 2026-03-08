
-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Board shares table with 10-digit share codes
CREATE TABLE public.board_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  share_code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.board_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage shares" ON public.board_shares FOR ALL TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Guest can read share" ON public.board_shares FOR SELECT TO authenticated USING (guest_id = auth.uid());
CREATE POLICY "Anyone can read unclaimed share" ON public.board_shares FOR SELECT TO authenticated USING (guest_id IS NULL);
CREATE POLICY "Authenticated can claim share" ON public.board_shares FOR UPDATE TO authenticated USING (guest_id IS NULL) WITH CHECK (guest_id = auth.uid());

-- Add user_id to sticky_notes
ALTER TABLE public.sticky_notes ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old policies
DROP POLICY IF EXISTS "Allow all delete" ON public.sticky_notes;
DROP POLICY IF EXISTS "Allow all insert" ON public.sticky_notes;
DROP POLICY IF EXISTS "Allow all read" ON public.sticky_notes;
DROP POLICY IF EXISTS "Allow all update" ON public.sticky_notes;

-- Security definer function to check board access
CREATE OR REPLACE FUNCTION public.can_access_notes(_user_id uuid, _note_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id = _note_owner_id
    OR EXISTS (
      SELECT 1 FROM public.board_shares
      WHERE (owner_id = _note_owner_id AND guest_id = _user_id)
         OR (owner_id = _user_id AND guest_id = _note_owner_id)
    );
$$;

-- New RLS policies for sticky_notes
CREATE POLICY "Users can read own and shared notes" ON public.sticky_notes FOR SELECT TO authenticated
  USING (public.can_access_notes(auth.uid(), user_id));

CREATE POLICY "Users can insert own notes" ON public.sticky_notes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own and shared notes" ON public.sticky_notes FOR UPDATE TO authenticated
  USING (public.can_access_notes(auth.uid(), user_id));

CREATE POLICY "Users can delete own notes" ON public.sticky_notes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Enable realtime for sticky_notes
ALTER PUBLICATION supabase_realtime ADD TABLE public.sticky_notes;
