import { supabase } from "@/integrations/supabase/client";

export type NoteColor = "yellow" | "pink" | "blue" | "green" | "orange";

export interface Note {
  id: string;
  text: string;
  color: NoteColor;
  rotation: number;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  reminder_at: string | null;
  user_id: string;
}

const NOTE_FIELDS = "id, text, color, rotation, position_x, position_y, width, height, reminder_at, user_id";

export async function fetchNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from("sticky_notes")
    .select(NOTE_FIELDS)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Note[];
}

export async function createNote(note: Omit<Note, "id">): Promise<Note> {
  const { data, error } = await supabase
    .from("sticky_notes")
    .insert(note)
    .select(NOTE_FIELDS)
    .single();
  if (error) throw error;
  return data as Note;
}

export async function updateNote(id: string, updates: Partial<Omit<Note, "id">>): Promise<void> {
  const { error } = await supabase.from("sticky_notes").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from("sticky_notes").delete().eq("id", id);
  if (error) throw error;
}
