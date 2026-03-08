import { Grid3X3, Cloud, CloudRain, Sparkles, CircleDot, Waves } from "lucide-react";

export type BgStyle = "dots" | "grid" | "clouds" | "rain" | "stars" | "waves";

interface BgOption {
  value: BgStyle;
  label: string;
  icon: React.ReactNode;
}

const options: BgOption[] = [
  { value: "dots", label: "Dots", icon: <CircleDot className="w-4 h-4" /> },
  { value: "grid", label: "Grid", icon: <Grid3X3 className="w-4 h-4" /> },
  { value: "clouds", label: "Clouds", icon: <Cloud className="w-4 h-4" /> },
  { value: "rain", label: "Rain", icon: <CloudRain className="w-4 h-4" /> },
  { value: "stars", label: "Stars", icon: <Sparkles className="w-4 h-4" /> },
  { value: "waves", label: "Waves", icon: <Waves className="w-4 h-4" /> },
];

interface BackgroundPickerProps {
  selected: BgStyle;
  onSelect: (bg: BgStyle) => void;
}

export default function BackgroundPicker({ selected, onSelect }: BackgroundPickerProps) {
  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          title={opt.label}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 ${
            selected === opt.value
              ? "bg-primary text-primary-foreground shadow-sm scale-110"
              : "bg-muted/60 text-muted-foreground hover:bg-muted"
          }`}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}
