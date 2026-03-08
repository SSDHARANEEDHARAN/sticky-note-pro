import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, StickyNote as StickyNoteIcon, Loader2 } from "lucide-react";
import StickyNote from "@/components/StickyNote";
import ColorPicker from "@/components/ColorPicker";
import BackgroundPicker, { type BgStyle } from "@/components/BackgroundPicker";
import AnimatedBackground from "@/components/AnimatedBackground";
import { fetchNotes, createNote, updateNote, deleteNote, type NoteColor } from "@/lib/notes-api";

const randomRotation = () => (Math.random() - 0.5) * 8;

const Index = () => {
  const queryClient = useQueryClient();
  const [selectedColor, setSelectedColor] = useState<NoteColor>("yellow");
  const [bgStyle, setBgStyle] = useState<BgStyle>(() => {
    const saved = localStorage.getItem("stickynotes-bg") as BgStyle | null;
    return saved && ["grid", "clouds", "rain", "waves", "snow", "confetti", "aurora", "hearts", "flowers"].includes(saved) ? saved : "grid";
  });
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleBgChange = (bg: BgStyle) => {
    setBgStyle(bg);
    localStorage.setItem("stickynotes-bg", bg);
  };

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["sticky_notes"],
    queryFn: fetchNotes,
  });

  const addMutation = useMutation({
    mutationFn: createNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sticky_notes"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<{ text: string; position_x: number; position_y: number; width: number; height: number; reminder_at: string | null }>) =>
      updateNote(id, updates),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sticky_notes"] }),
  });

  const handleAdd = () => {
    addMutation.mutate({
      text: "",
      color: selectedColor,
      rotation: randomRotation(),
      position_x: 80 + Math.random() * 400,
      position_y: 120 + Math.random() * 300,
      width: 224,
      height: 180,
      reminder_at: null,
    });
  };

  const handleUpdateText = useCallback((id: string, text: string) => {
    queryClient.setQueryData(["sticky_notes"], (old: any) =>
      old?.map((n: any) => (n.id === id ? { ...n, text } : n))
    );
    if (debounceTimers.current[id]) clearTimeout(debounceTimers.current[id]);
    debounceTimers.current[id] = setTimeout(() => {
      updateMutation.mutate({ id, text });
    }, 500);
  }, [queryClient, updateMutation]);

  const handleDragEnd = useCallback((id: string, x: number, y: number) => {
    queryClient.setQueryData(["sticky_notes"], (old: any) =>
      old?.map((n: any) => (n.id === id ? { ...n, position_x: x, position_y: y } : n))
    );
    updateMutation.mutate({ id, position_x: x, position_y: y });
  }, [queryClient, updateMutation]);

  const handleResizeEnd = useCallback((id: string, w: number, h: number) => {
    queryClient.setQueryData(["sticky_notes"], (old: any) =>
      old?.map((n: any) => (n.id === id ? { ...n, width: w, height: h } : n))
    );
    updateMutation.mutate({ id, width: w, height: h });
  }, [queryClient, updateMutation]);

  const handleSetReminder = useCallback((id: string, reminderAt: string | null) => {
    queryClient.setQueryData(["sticky_notes"], (old: any) =>
      old?.map((n: any) => (n.id === id ? { ...n, reminder_at: reminderAt } : n))
    );
    updateMutation.mutate({ id, reminder_at: reminderAt });
  }, [queryClient, updateMutation]);

  const handleDelete = (id: string) => deleteMutation.mutate(id);

  return (
    <div className="min-h-screen relative bg-background overflow-hidden">
      <AnimatedBackground style={bgStyle} />

      <div className="absolute inset-0 pointer-events-none border-[12px] border-foreground/10 rounded-sm"
        style={{ boxShadow: "inset 0 0 20px hsl(30 10% 20% / 0.05)" }}
      />

      <header className="relative z-30 p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-note">
          <StickyNoteIcon className="w-7 h-7 text-card-foreground" />
          <h1 className="text-2xl font-handwriting font-bold text-card-foreground">My Sticky Notes</h1>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3 bg-card/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-note">
            <BackgroundPicker selected={bgStyle} onSelect={handleBgChange} />
          </div>
          <div className="flex items-center gap-4 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-note">
            <ColorPicker selected={selectedColor} onSelect={setSelectedColor} />
            <button
              onClick={handleAdd}
              disabled={addMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity shadow-note disabled:opacity-50"
            >
              {addMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Add Note
            </button>
          </div>
        </div>
      </header>

      <main className="relative min-h-[80vh]">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-card-foreground animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-card/80 backdrop-blur-sm inline-block px-8 py-6 rounded-lg shadow-note">
              <StickyNoteIcon className="w-16 h-16 text-card-foreground/40 mx-auto mb-4" />
              <p className="text-xl font-handwriting text-card-foreground">No notes yet. Add one!</p>
            </div>
          </div>
        ) : (
          notes.map((note) => (
            <StickyNote
              key={note.id}
              id={note.id}
              text={note.text}
              color={note.color as NoteColor}
              rotation={note.rotation}
              positionX={note.position_x}
              positionY={note.position_y}
              width={note.width}
              height={note.height}
              reminderAt={note.reminder_at}
              onDelete={handleDelete}
              onUpdate={handleUpdateText}
              onDragEnd={handleDragEnd}
              onResizeEnd={handleResizeEnd}
              onSetReminder={handleSetReminder}
            />
          ))
        )}
      </main>
    </div>
  );
};

export default Index;
