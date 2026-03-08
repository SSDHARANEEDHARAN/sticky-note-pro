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
  author_name?: string;
}

const NOTE_FIELDS = "id, text, color, rotation, position_x, position_y, width, height, reminder_at, user_id";

export async function fetchNotes(): Promise<Note[]> {
  const { data: notes, error } = await supabase
    .from("sticky_notes")
    .select(NOTE_FIELDS)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!notes || notes.length === 0) return [];

  // Get unique user_ids and fetch their display names
  const userIds = [...new Set(notes.map((n) => n.user_id).filter(Boolean))];
  if (userIds.length === 0) return notes as Note[];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);

  const nameMap = new Map<string, string>();
  profiles?.forEach((p: any) => {
    if (p.display_name) nameMap.set(p.id, p.display_name);
  });

  return notes.map((n) => ({
    ...n,
    author_name: nameMap.get(n.user_id) || undefined,
  })) as Note[];
}

export async function createNote(note: Omit<Note, "id" | "author_name">): Promise<Note> {
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
