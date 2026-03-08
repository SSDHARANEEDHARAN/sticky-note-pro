type NoteColor = "yellow" | "pink" | "blue" | "green" | "orange";

const colors: { value: NoteColor; className: string }[] = [
  { value: "yellow", className: "bg-note-yellow" },
  { value: "pink", className: "bg-note-pink" },
  { value: "blue", className: "bg-note-blue" },
  { value: "green", className: "bg-note-green" },
  { value: "orange", className: "bg-note-orange" },
];

interface ColorPickerProps {
  selected: NoteColor;
  onSelect: (color: NoteColor) => void;
}

export default function ColorPicker({ selected, onSelect }: ColorPickerProps) {
  return (
    <div className="flex gap-2">
      {colors.map((c) => (
        <button
          key={c.value}
          onClick={() => onSelect(c.value)}
          className={`w-8 h-8 rounded-full ${c.className} transition-all duration-200 hover:scale-110 ${
            selected === c.value ? "ring-2 ring-foreground/30 ring-offset-2 ring-offset-background scale-110" : ""
          }`}
        />
      ))}
    </div>
  );
}
