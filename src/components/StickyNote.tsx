import { useState, useRef, useCallback, useEffect } from "react";
import { X, Clock, Bell, BellOff } from "lucide-react";
import type { NoteColor } from "@/lib/notes-api";
import PushPin from "@/components/PushPin";

interface StickyNoteProps {
  id: string;
  text: string;
  color: NoteColor;
  rotation: number;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  reminderAt: string | null;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onResizeEnd: (id: string, w: number, h: number) => void;
  onSetReminder: (id: string, reminderAt: string | null) => void;
}

const colorClasses: Record<NoteColor, string> = {
  yellow: "bg-note-yellow",
  pink: "bg-note-pink",
  blue: "bg-note-blue",
  green: "bg-note-green",
  orange: "bg-note-orange",
};

const pinColors: Record<NoteColor, string> = {
  yellow: "#d4443b",
  pink: "#e85d9b",
  blue: "#4a7fd4",
  green: "#4aad6b",
  orange: "#e08732",
};

export default function StickyNote({
  id, text, color, rotation, positionX, positionY, width, height, reminderAt,
  onDelete, onUpdate, onDragEnd, onResizeEnd, onSetReminder,
}: StickyNoteProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const [isAlerting, setIsAlerting] = useState(false);
  const [pos, setPos] = useState({ x: positionX, y: positionY });
  const [size, setSize] = useState({ w: width, h: height });
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ mouseX: 0, mouseY: 0, w: 0, h: 0 });
  const alertInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check reminder
  useEffect(() => {
    if (!reminderAt) {
      setIsAlerting(false);
      return;
    }

    const check = () => {
      const now = new Date().getTime();
      const target = new Date(reminderAt).getTime();
      if (now >= target) {
        setIsAlerting(true);
      }
    };

    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [reminderAt]);

  // Play sound-like effect on alert start
  useEffect(() => {
    if (isAlerting && !alertInterval.current) {
      // Browser notification if allowed
      if (Notification.permission === "granted") {
        new Notification("⏰ StickyNotes Reminder", { body: text || "Your reminder is due!" });
      } else if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [isAlerting, text]);

  const dismissAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAlerting(false);
    onSetReminder(id, null);
  };

  // Time remaining display
  const getTimeRemaining = () => {
    if (!reminderAt || isAlerting) return null;
    const diff = new Date(reminderAt).getTime() - Date.now();
    if (diff <= 0) return null;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  };

  // --- Drag handlers ---
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "TEXTAREA" || isResizing) return;
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    e.preventDefault();
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };

    const onMove = (ev: MouseEvent) => {
      setPos({ x: ev.clientX - dragOffset.current.x, y: ev.clientY - dragOffset.current.y });
    };
    const onUp = (ev: MouseEvent) => {
      setIsDragging(false);
      const newX = ev.clientX - dragOffset.current.x;
      const newY = ev.clientY - dragOffset.current.y;
      setPos({ x: newX, y: newY });
      onDragEnd(id, newX, newY);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [id, pos.x, pos.y, onDragEnd, isResizing]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).tagName === "TEXTAREA" || isResizing) return;
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragOffset.current = { x: touch.clientX - pos.x, y: touch.clientY - pos.y };

    const onMove = (ev: TouchEvent) => {
      const t = ev.touches[0];
      setPos({ x: t.clientX - dragOffset.current.x, y: t.clientY - dragOffset.current.y });
    };
    const onEnd = (ev: TouchEvent) => {
      setIsDragging(false);
      const t = ev.changedTouches[0];
      const newX = t.clientX - dragOffset.current.x;
      const newY = t.clientY - dragOffset.current.y;
      setPos({ x: newX, y: newY });
      onDragEnd(id, newX, newY);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
  }, [id, pos.x, pos.y, onDragEnd, isResizing]);

  // --- Resize handler ---
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, w: size.w, h: size.h };

    const onMove = (ev: MouseEvent) => {
      const newW = Math.max(160, resizeStart.current.w + (ev.clientX - resizeStart.current.mouseX));
      const newH = Math.max(120, resizeStart.current.h + (ev.clientY - resizeStart.current.mouseY));
      setSize({ w: newW, h: newH });
    };
    const onUp = () => {
      setIsResizing(false);
      setSize((s) => {
        onResizeEnd(id, s.w, s.h);
        return s;
      });
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [id, size.w, size.h, onResizeEnd]);

  const handleSetTimer = (minutes: number) => {
    const target = new Date(Date.now() + minutes * 60000).toISOString();
    onSetReminder(id, target);
    setShowTimerPicker(false);
  };

  const timeRemaining = getTimeRemaining();

  return (
    <div
      className={`absolute group select-none ${isAlerting ? "animate-blink-border" : ""}`}
      style={{
        left: pos.x,
        top: pos.y,
        width: size.w,
        transform: `rotate(${isHovered && !isDragging ? 0 : rotation}deg) scale(${isDragging ? 1.08 : isHovered ? 1.05 : 1})`,
        zIndex: isDragging || isResizing ? 50 : isAlerting ? 40 : isHovered ? 10 : 1,
        cursor: isDragging ? "grabbing" : "grab",
        transition: isDragging || isResizing ? "transform 0.1s" : "transform 0.3s ease-out",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowTimerPicker(false); }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Push Pin */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
        <PushPin color={pinColors[color]} />
      </div>

      {/* Pin shadow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full z-10"
        style={{ background: "radial-gradient(circle, hsl(30 10% 20% / 0.15) 0%, transparent 70%)" }}
      />

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(id); }}
        className="absolute -top-2 -right-2 z-20 w-6 h-6 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110"
      >
        <X className="w-3.5 h-3.5 text-destructive-foreground" />
      </button>

      {/* Timer button */}
      <button
        data-no-drag
        onClick={(e) => { e.stopPropagation(); setShowTimerPicker(!showTimerPicker); }}
        className={`absolute -top-2 -left-2 z-20 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
          reminderAt ? "bg-destructive opacity-100" : "bg-card opacity-0 group-hover:opacity-100"
        }`}
      >
        <Clock className={`w-3.5 h-3.5 ${reminderAt ? "text-destructive-foreground" : "text-card-foreground"}`} />
      </button>

      {/* Dismiss alert button */}
      {isAlerting && (
        <button
          data-no-drag
          onClick={dismissAlert}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-destructive text-destructive-foreground rounded-full text-xs font-medium flex items-center gap-1 shadow-note hover:scale-105 transition-transform"
        >
          <BellOff className="w-3 h-3" />
          Dismiss
        </button>
      )}

      {/* Timer picker dropdown */}
      {showTimerPicker && (
        <div
          data-no-drag
          className="absolute -left-2 top-6 z-40 bg-card rounded-lg shadow-note-hover p-2 min-w-[140px]"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs font-medium text-card-foreground/70 px-2 py-1 font-handwriting">Set reminder:</p>
          {[
            { label: "1 min", mins: 1 },
            { label: "5 mins", mins: 5 },
            { label: "15 mins", mins: 15 },
            { label: "30 mins", mins: 30 },
            { label: "1 hour", mins: 60 },
            { label: "2 hours", mins: 120 },
          ].map((opt) => (
            <button
              key={opt.mins}
              onClick={() => handleSetTimer(opt.mins)}
              className="w-full text-left px-2 py-1.5 text-sm text-card-foreground hover:bg-accent/50 rounded transition-colors font-handwriting"
            >
              ⏰ {opt.label}
            </button>
          ))}
          {reminderAt && (
            <button
              onClick={() => { onSetReminder(id, null); setShowTimerPicker(false); }}
              className="w-full text-left px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded transition-colors font-handwriting"
            >
              ✕ Clear timer
            </button>
          )}
        </div>
      )}

      {/* Time remaining badge */}
      {timeRemaining && !isAlerting && (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 bg-card rounded-full text-xs font-medium text-card-foreground/80 shadow-note flex items-center gap-1">
          <Bell className="w-3 h-3" />
          {timeRemaining}
        </div>
      )}

      {/* Note body */}
      <div
        className={`${colorClasses[color]} shadow-note group-hover:shadow-note-hover p-5 pt-4 transition-shadow duration-300`}
        style={{ minHeight: size.h }}
      >
        <div
          className="absolute inset-x-5 top-10 bottom-5 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(transparent, transparent 27px, hsl(30 10% 20% / 0.08) 27px, hsl(30 10% 20% / 0.08) 28px)",
          }}
        />
        <textarea
          value={text}
          onChange={(e) => onUpdate(id, e.target.value)}
          placeholder="Write something..."
          className="w-full bg-transparent resize-none outline-none font-handwriting text-xl leading-7 text-card-foreground placeholder:text-card-foreground/40 cursor-text"
          style={{ lineHeight: "28px", height: size.h - 40 }}
        />
      </div>

      {/* Bottom curl shadow */}
      <div
        className="absolute bottom-0 left-2 right-2 h-3 rounded-b-sm"
        style={{ background: "linear-gradient(to bottom, transparent, hsl(30 10% 20% / 0.06))" }}
      />

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-30 opacity-0 group-hover:opacity-60 transition-opacity"
        onMouseDown={handleResizeMouseDown}
      >
        <svg viewBox="0 0 20 20" className="w-full h-full" fill="hsl(30 10% 20% / 0.4)">
          <path d="M18 18L8 18L18 8Z" />
          <path d="M18 18L14 18L18 14Z" fill="hsl(30 10% 20% / 0.6)" />
        </svg>
      </div>
    </div>
  );
}
