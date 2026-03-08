import { useState } from "react";
import { X } from "lucide-react";

type NoteColor = "yellow" | "pink" | "blue" | "green" | "orange";

interface StickyNoteProps {
  id: string;
  text: string;
  color: NoteColor;
  rotation: number;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
}

const colorClasses: Record<NoteColor, string> = {
  yellow: "bg-note-yellow",
  pink: "bg-note-pink",
  blue: "bg-note-blue",
  green: "bg-note-green",
  orange: "bg-note-orange",
};

const tapeColorClasses: Record<NoteColor, string> = {
  yellow: "bg-note-yellow/60",
  pink: "bg-note-pink/60",
  blue: "bg-note-blue/60",
  green: "bg-note-green/60",
  orange: "bg-note-orange/60",
};

export default function StickyNote({ id, text, color, rotation, onDelete, onUpdate }: StickyNoteProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group w-56 transition-all duration-300 ease-out"
      style={{ transform: `rotate(${rotation}deg)`, ...(isHovered ? { transform: `rotate(0deg) scale(1.05)` } : {}) }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tape */}
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-5 ${tapeColorClasses[color]} rounded-sm opacity-80 z-10`}
        style={{ backdropFilter: "blur(1px)" }}
      />

      {/* Delete button */}
      <button
        onClick={() => onDelete(id)}
        className="absolute -top-2 -right-2 z-20 w-6 h-6 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110"
      >
        <X className="w-3.5 h-3.5 text-destructive-foreground" />
      </button>

      {/* Note body */}
      <div className={`${colorClasses[color]} shadow-note group-hover:shadow-note-hover p-5 pt-6 min-h-[180px] transition-shadow duration-300`}>
        {/* Lined effect */}
        <div className="absolute inset-x-5 top-14 bottom-5 pointer-events-none"
          style={{
            backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, hsl(30 10% 20% / 0.08) 27px, hsl(30 10% 20% / 0.08) 28px)",
          }}
        />

        <textarea
          value={text}
          onChange={(e) => onUpdate(id, e.target.value)}
          placeholder="Write something..."
          className="w-full h-full min-h-[140px] bg-transparent resize-none outline-none font-handwriting text-xl leading-7 text-card-foreground placeholder:text-card-foreground/40"
          style={{ lineHeight: "28px" }}
        />
      </div>

      {/* Bottom curl shadow */}
      <div className="absolute bottom-0 left-2 right-2 h-3 rounded-b-sm"
        style={{ background: "linear-gradient(to bottom, transparent, hsl(30 10% 20% / 0.06))" }}
      />
    </div>
  );
}
