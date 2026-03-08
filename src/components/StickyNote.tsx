import { useState, useRef, useCallback, useEffect } from "react";
import { X, Clock, Bell, BellOff, CalendarIcon, User } from "lucide-react";
import { format } from "date-fns";
import type { NoteColor } from "@/lib/notes-api";
import PushPin from "@/components/PushPin";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

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
  authorName?: string;
  isOwnNote: boolean;
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
  id, text, color, rotation, positionX, positionY, width, height, reminderAt, authorName, isOwnNote,
  onDelete, onUpdate, onDragEnd, onResizeEnd, onSetReminder,
}: StickyNoteProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showQuickTimer, setShowQuickTimer] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState("12");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedAmPm, setSelectedAmPm] = useState<"AM" | "PM">("AM");
  const [isAlerting, setIsAlerting] = useState(false);
  const [pos, setPos] = useState({ x: positionX, y: positionY });
  const [size, setSize] = useState({ w: width, h: height });
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ mouseX: 0, mouseY: 0, w: 0, h: 0 });

  // Check reminder
  useEffect(() => {
    if (!reminderAt) { setIsAlerting(false); return; }
    const check = () => {
      if (new Date().getTime() >= new Date(reminderAt).getTime()) setIsAlerting(true);
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [reminderAt]);

  useEffect(() => {
    if (isAlerting) {
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

  const getTimeRemaining = () => {
    if (!reminderAt || isAlerting) return null;
    const diff = new Date(reminderAt).getTime() - Date.now();
    if (diff <= 0) return null;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ${hrs % 24}h`;
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  };

  const closeAll = () => { setShowQuickTimer(false); setShowDatePicker(false); };

  // Drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "TEXTAREA" || isResizing) return;
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    e.preventDefault();
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    const onMove = (ev: MouseEvent) => { setPos({ x: ev.clientX - dragOffset.current.x, y: ev.clientY - dragOffset.current.y }); };
    const onUp = (ev: MouseEvent) => {
      setIsDragging(false);
      const nx = ev.clientX - dragOffset.current.x, ny = ev.clientY - dragOffset.current.y;
      setPos({ x: nx, y: ny }); onDragEnd(id, nx, ny);
      window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  }, [id, pos.x, pos.y, onDragEnd, isResizing]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).tagName === "TEXTAREA" || isResizing) return;
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragOffset.current = { x: touch.clientX - pos.x, y: touch.clientY - pos.y };
    const onMove = (ev: TouchEvent) => { const t = ev.touches[0]; setPos({ x: t.clientX - dragOffset.current.x, y: t.clientY - dragOffset.current.y }); };
    const onEnd = (ev: TouchEvent) => {
      setIsDragging(false);
      const t = ev.changedTouches[0]; const nx = t.clientX - dragOffset.current.x, ny = t.clientY - dragOffset.current.y;
      setPos({ x: nx, y: ny }); onDragEnd(id, nx, ny);
      window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd);
    };
    window.addEventListener("touchmove", onMove, { passive: false }); window.addEventListener("touchend", onEnd);
  }, [id, pos.x, pos.y, onDragEnd, isResizing]);

  // Resize
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault(); setIsResizing(true);
    resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, w: size.w, h: size.h };
    const onMove = (ev: MouseEvent) => {
      setSize({ w: Math.max(160, resizeStart.current.w + (ev.clientX - resizeStart.current.mouseX)), h: Math.max(120, resizeStart.current.h + (ev.clientY - resizeStart.current.mouseY)) });
    };
    const onUp = () => {
      setIsResizing(false); setSize((s) => { onResizeEnd(id, s.w, s.h); return s; });
      window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  }, [id, size.w, size.h, onResizeEnd]);

  const handleSetTimer = (minutes: number) => {
    onSetReminder(id, new Date(Date.now() + minutes * 60000).toISOString());
    closeAll();
  };

  const handleSetCustomReminder = () => {
    if (!selectedDate) return;
    let hour = parseInt(selectedHour);
    const minute = parseInt(selectedMinute);
    if (selectedAmPm === "PM" && hour !== 12) hour += 12;
    if (selectedAmPm === "AM" && hour === 12) hour = 0;
    const target = new Date(selectedDate);
    target.setHours(hour, minute, 0, 0);
    if (target.getTime() <= Date.now()) return;
    onSetReminder(id, target.toISOString());
    closeAll();
  };

  const timeRemaining = getTimeRemaining();

  return (
    <div
      className={`absolute group select-none ${isAlerting ? "animate-blink-border" : ""}`}
      style={{
        left: pos.x, top: pos.y, width: size.w,
        transform: `rotate(${isHovered && !isDragging ? 0 : rotation}deg) scale(${isDragging ? 1.08 : isHovered ? 1.05 : 1})`,
        zIndex: isDragging || isResizing ? 50 : isAlerting ? 40 : isHovered ? 10 : 1,
        cursor: isDragging ? "grabbing" : "grab",
        transition: isDragging || isResizing ? "transform 0.1s" : "transform 0.3s ease-out",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); closeAll(); }}
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

      {/* Delete button — top right */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(id); }}
        className="absolute -top-2 -right-2 z-20 w-6 h-6 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110"
      >
        <X className="w-3.5 h-3.5 text-destructive-foreground" />
      </button>

      {/* ⏱ Quick Timer button — LEFT side */}
      <button
        data-no-drag
        onClick={(e) => { e.stopPropagation(); setShowDatePicker(false); setShowQuickTimer(!showQuickTimer); }}
        className={cn(
          "absolute -top-2 -left-2 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm",
          reminderAt && !showDatePicker ? "bg-destructive opacity-100" : "bg-card opacity-0 group-hover:opacity-100"
        )}
        title="Quick Timer"
      >
        <Clock className={cn("w-3.5 h-3.5", reminderAt ? "text-destructive-foreground" : "text-card-foreground")} />
      </button>

      {/* 📅 Date Picker button — RIGHT side */}
      <button
        data-no-drag
        onClick={(e) => { e.stopPropagation(); setShowQuickTimer(false); setShowDatePicker(!showDatePicker); }}
        className={cn(
          "absolute -top-2 right-5 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm",
          reminderAt && !showQuickTimer ? "bg-destructive opacity-100" : "bg-card opacity-0 group-hover:opacity-100"
        )}
        title="Date Reminder"
      >
        <CalendarIcon className={cn("w-3.5 h-3.5", reminderAt ? "text-destructive-foreground" : "text-card-foreground")} />
      </button>

      {/* Dismiss alert */}
      {isAlerting && (
        <button data-no-drag onClick={dismissAlert}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-destructive text-destructive-foreground rounded-full text-xs font-medium flex items-center gap-1 shadow-note hover:scale-105 transition-transform"
        >
          <BellOff className="w-3 h-3" /> Dismiss
        </button>
      )}

      {/* ⏱ QUICK TIMER dropdown — left side */}
      {showQuickTimer && (
        <div data-no-drag
          className="absolute -left-2 top-7 z-40 bg-card rounded-xl shadow-note-hover p-2 min-w-[130px]"
          onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}
        >
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 pb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Quick Timer
          </p>
          {[
            { label: "1 min", mins: 1 },
            { label: "5 mins", mins: 5 },
            { label: "15 mins", mins: 15 },
            { label: "30 mins", mins: 30 },
            { label: "1 hour", mins: 60 },
            { label: "2 hours", mins: 120 },
          ].map((opt) => (
            <button key={opt.mins} onClick={() => handleSetTimer(opt.mins)}
              className="w-full text-left px-2 py-1.5 text-sm text-card-foreground hover:bg-accent/50 rounded transition-colors font-handwriting"
            >
              ⏰ {opt.label}
            </button>
          ))}
          {reminderAt && (
            <button onClick={() => { onSetReminder(id, null); closeAll(); }}
              className="w-full text-left px-2 py-1.5 mt-1 text-sm text-destructive hover:bg-destructive/10 rounded transition-colors font-handwriting border-t border-border pt-2"
            >
              ✕ Clear
            </button>
          )}
        </div>
      )}

      {/* 📅 DATE PICKER dropdown — right side */}
      {showDatePicker && (
        <div data-no-drag
          className="absolute -right-2 top-7 z-40 bg-card rounded-xl shadow-note-hover p-3 min-w-[260px]"
          onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}
        >
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1 pb-1 flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" /> Date & Time
          </p>

          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            className={cn("p-1 pointer-events-auto text-xs")}
          />

          <div className="flex items-center gap-1 px-1 mt-1">
            <span className="text-xs text-card-foreground/70 font-medium">Time:</span>
            <select value={selectedHour} onChange={(e) => setSelectedHour(e.target.value)}
              className="bg-muted text-card-foreground text-xs rounded px-1.5 py-1 outline-none cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={String(h)}>{String(h).padStart(2, "0")}</option>
              ))}
            </select>
            <span className="text-card-foreground font-bold">:</span>
            <select value={selectedMinute} onChange={(e) => setSelectedMinute(e.target.value)}
              className="bg-muted text-card-foreground text-xs rounded px-1.5 py-1 outline-none cursor-pointer"
            >
              {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <div className="flex gap-0.5 ml-1">
              {(["AM", "PM"] as const).map((v) => (
                <button key={v} onClick={() => setSelectedAmPm(v)}
                  className={cn("text-xs px-1.5 py-1 rounded font-medium transition-colors",
                    selectedAmPm === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >{v}</button>
              ))}
            </div>
          </div>

          <button onClick={handleSetCustomReminder} disabled={!selectedDate}
            className="w-full py-1.5 mt-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {selectedDate
              ? `Set for ${format(selectedDate, "MMM d")} at ${selectedHour}:${selectedMinute} ${selectedAmPm}`
              : "Pick a date first"}
          </button>

          {reminderAt && (
            <button onClick={() => { onSetReminder(id, null); closeAll(); }}
              className="w-full text-left px-2 py-1.5 mt-1 text-sm text-destructive hover:bg-destructive/10 rounded transition-colors font-handwriting border-t border-border pt-2"
            >
              ✕ Clear
            </button>
          )}
        </div>
      )}

      {/* Time remaining badge */}
      {timeRemaining && !isAlerting && (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 bg-card rounded-full text-xs font-medium text-card-foreground/80 shadow-note flex items-center gap-1">
          <Bell className="w-3 h-3" /> {timeRemaining}
        </div>
      )}

      {/* Note body */}
      <div className={`${colorClasses[color]} shadow-note group-hover:shadow-note-hover p-5 pt-4 transition-shadow duration-300`}
        style={{ minHeight: size.h }}
      >
        {/* Author badge for shared notes */}
        {authorName && !isOwnNote && (
          <div className="flex items-center gap-1 mb-1 text-[10px] font-medium text-card-foreground/50 uppercase tracking-wider">
            <User className="w-3 h-3" />
            {authorName}
          </div>
        )}
        <div className="absolute inset-x-5 top-10 bottom-5 pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, hsl(30 10% 20% / 0.08) 27px, hsl(30 10% 20% / 0.08) 28px)" }}
        />
        <textarea value={text} onChange={(e) => onUpdate(id, e.target.value)} placeholder="Write something..."
          className="w-full bg-transparent resize-none outline-none font-handwriting text-xl leading-7 text-card-foreground placeholder:text-card-foreground/40 cursor-text"
          style={{ lineHeight: "28px", height: size.h - 40 }}
        />
      </div>

      {/* Bottom curl shadow */}
      <div className="absolute bottom-0 left-2 right-2 h-3 rounded-b-sm"
        style={{ background: "linear-gradient(to bottom, transparent, hsl(30 10% 20% / 0.06))" }}
      />

      {/* Resize handle */}
      <div className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-30 opacity-0 group-hover:opacity-60 transition-opacity"
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
