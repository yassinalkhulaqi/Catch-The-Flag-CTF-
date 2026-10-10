"use client";

export function Slider({
  label,
  min = 0,
  max = 100,
  step = 1,
  value,
  onValueChange,
  id,
}: {
  label: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onValueChange: (value: number) => void;
  id?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        <span className="font-mono text-xs text-muted">{value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onChange={(event) => onValueChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer accent-[var(--accent)]"
      />
    </div>
  );
}
