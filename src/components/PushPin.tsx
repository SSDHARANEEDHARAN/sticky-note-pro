interface PushPinProps {
  color?: string;
}

export default function PushPin({ color = "#d4443b" }: PushPinProps) {
  return (
    <svg width="20" height="26" viewBox="0 0 20 26" fill="none" xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-md"
      style={{ filter: "drop-shadow(1px 2px 2px hsl(30 10% 20% / 0.3))" }}
    >
      {/* Pin needle */}
      <line x1="10" y1="18" x2="10" y2="25" stroke="#888" strokeWidth="1.2" strokeLinecap="round" />
      {/* Pin body (dome) */}
      <ellipse cx="10" cy="10" rx="8" ry="8" fill={color} />
      {/* Highlight */}
      <ellipse cx="7.5" cy="7" rx="3" ry="2.5" fill="white" opacity="0.35" />
      {/* Rim shadow */}
      <ellipse cx="10" cy="10" rx="8" ry="8" fill="none" stroke="hsl(30 10% 20% / 0.15)" strokeWidth="0.8" />
    </svg>
  );
}
