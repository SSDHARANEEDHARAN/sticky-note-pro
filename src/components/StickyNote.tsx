import { useState, useRef, useCallback } from "react";
import { X } from "lucide-react";
import type { NoteColor } from "@/lib/notes-api";

interface StickyNoteProps {
  id: string;
  text: string;
  color: NoteColor;
  rotation: number;
  positionX: number;
  positionY: number;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
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

export default function StickyNote({
  id, text, color, rotation, positionX, positionY,
  onDelete, onUpdate, onDragEnd,
}: StickyNoteProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: positionX, y: positionY });
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
    e.preventDefault();
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };

    const handleMouseMove = (ev: MouseEvent) => {
      setPos({ x: ev.clientX - dragOffset.current.x, y: ev.clientY - dragOffset.current.y });
    };
    const handleMouseUp = (ev: MouseEvent) => {
      setIsDragging(false);
      const newX = ev.clientX - dragOffset.current.x;
      const newY = ev.clientY - dragOffset.current.y;
      setPos({ x: newX, y: newY });
      onDragEnd(id, newX, newY);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [id, pos.x, pos.y, onDragEnd]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragOffset.current = { x: touch.clientX - pos.x, y: touch.clientY - pos.y };

    const handleTouchMove = (ev: TouchEvent) => {
      const t = ev.touches[0];
      setPos({ x: t.clientX - dragOffset.current.x, y: t.clientY - dragOffset.current.y });
    };
    const handleTouchEnd = (ev: TouchEvent) => {
      setIsDragging(false);
      const t = ev.changedTouches[0];
      const newX = t.clientX - dragOffset.current.x;
      const newY = t.clientY - dragOffset.current.y;
      setPos({ x: newX, y: newY });
      onDragEnd(id, newX, newY);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
  }, [id, pos.x, pos.y, onDragEnd]);

  return (
    <div
      className="absolute group w-56 select-none"
      style={{
        left: pos.x,
        top: pos.y,
        transform: `rotate(${isHovered && !isDragging ? 0 : rotation}deg) scale(${isDragging ? 1.08 : isHovered ? 1.05 : 1})`,
        zIndex: isDragging ? 50 : isHovered ? 10 : 1,
        cursor: isDragging ? "grabbing" : "grab",
        transition: isDragging ? "transform 0.1s" : "transform 0.3s ease-out",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Tape */}
      <div
        className={`absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-5 ${tapeColorClasses[color]} rounded-sm opacity-80 z-10`}
        style={{ backdropFilter: "blur(1px)" }}
      />

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(id); }}
        className="absolute -top-2 -right-2 z-20 w-6 h-6 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110"
      >
        <X className="w-3.5 h-3.5 text-destructive-foreground" />
      </button>

      {/* Note body */}
      <div className={`${colorClasses[color]} shadow-note group-hover:shadow-note-hover p-5 pt-6 min-h-[180px] transition-shadow duration-300`}>
        <div
          className="absolute inset-x-5 top-14 bottom-5 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(transparent, transparent 27px, hsl(30 10% 20% / 0.08) 27px, hsl(30 10% 20% / 0.08) 28px)",
          }}
        />
        <textarea
          value={text}
          onChange={(e) => onUpdate(id, e.target.value)}
          placeholder="Write something..."
          className="w-full h-full min-h-[140px] bg-transparent resize-none outline-none font-handwriting text-xl leading-7 text-card-foreground placeholder:text-card-foreground/40 cursor-text"
          style={{ lineHeight: "28px" }}
        />
      </div>

      {/* Bottom curl shadow */}
      <div
        className="absolute bottom-0 left-2 right-2 h-3 rounded-b-sm"
        style={{ background: "linear-gradient(to bottom, transparent, hsl(30 10% 20% / 0.06))" }}
      />
    </div>
  );
}
