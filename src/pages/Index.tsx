import { useState } from "react";
import { Plus, StickyNote as StickyNoteIcon } from "lucide-react";
import StickyNote from "@/components/StickyNote";
import ColorPicker from "@/components/ColorPicker";

type NoteColor = "yellow" | "pink" | "blue" | "green" | "orange";

interface Note {
  id: string;
  text: string;
  color: NoteColor;
  rotation: number;
}

const randomRotation = () => (Math.random() - 0.5) * 8;

const Index = () => {
  const [notes, setNotes] = useState<Note[]>([
    { id: "1", text: "Welcome to Sticky Notes! ✨", color: "yellow", rotation: randomRotation() },
    { id: "2", text: "Click + to add a new note", color: "pink", rotation: randomRotation() },
    { id: "3", text: "Pick a color before adding", color: "blue", rotation: randomRotation() },
  ]);
  const [selectedColor, setSelectedColor] = useState<NoteColor>("yellow");

  const addNote = () => {
    setNotes((prev) => [
      ...prev,
      { id: Date.now().toString(), text: "", color: selectedColor, rotation: randomRotation() },
    ]);
  };

  const deleteNote = (id: string) => setNotes((prev) => prev.filter((n) => n.id !== id));

  const updateNote = (id: string, text: string) =>
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      {/* Header */}
      <header className="max-w-5xl mx-auto mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <StickyNoteIcon className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-handwriting font-bold text-foreground">My Sticky Notes</h1>
        </div>

        <div className="flex items-center gap-4">
          <ColorPicker selected={selectedColor} onSelect={setSelectedColor} />
          <button
            onClick={addNote}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity shadow-note"
          >
            <Plus className="w-5 h-5" />
            Add Note
          </button>
        </div>
      </header>

      {/* Notes grid */}
      <main className="max-w-5xl mx-auto">
        {notes.length === 0 ? (
          <div className="text-center py-20">
            <StickyNoteIcon className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-xl font-handwriting text-muted-foreground">No notes yet. Add one!</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-8 justify-center">
            {notes.map((note) => (
              <StickyNote
                key={note.id}
                id={note.id}
                text={note.text}
                color={note.color}
                rotation={note.rotation}
                onDelete={deleteNote}
                onUpdate={updateNote}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
