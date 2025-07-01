import { cn } from "@/lib/utils";
import { Slider as ShadcnSlider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";

interface SliderProps {
  name: string;
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  float?: boolean;
}

export function Slider({
  name,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  float = false,
}: SliderProps) {
  // Calculate decimals from step
  const decimals =
    float && step < 1 ? (step.toString().split(".")[1] || "").length : 0;

  // Helper to round to correct decimals
  const round = (v: number) =>
    float ? parseFloat(v.toFixed(decimals)) : Math.round(v);

  const [internalValue, setInternalValue] = useState(round(value));
  const isDragging = useRef(false);

  // Keep internalValue in sync with value prop
  if (round(internalValue) !== round(value) && !isDragging.current) {
    setInternalValue(round(value));
  }

  // Allow floats or ints in input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v: number;
    if (float) {
      v = parseFloat(e.target.value.replace(/[^0-9.\-]/g, ""));
      if (isNaN(v)) v = min;
      v = Math.max(min, Math.min(max, v));
      v = round(v);
    } else {
      v = parseInt(e.target.value.replace(/[^0-9\-]/g, ""), 10);
      if (isNaN(v)) v = min;
      v = Math.max(min, Math.min(max, v));
      v = round(v);
    }
    setInternalValue(v);
    onChange(v);
  };

  const handleSliderChange = ([v]: number[]) => {
    setInternalValue(round(v));
  };

  // Format value for display
  const displayValue = float
    ? round(internalValue).toFixed(decimals)
    : round(internalValue).toString();

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={`${name}-input`}
          className="block mb-3 text-xs font-medium"
        >
          {label}
        </label>
      )}
      <div className="flex flex-row items-center w-full gap-4">
        <Input
          id={`${name}-input`}
          type="number"
          min={min}
          max={max}
          step={step}
          value={displayValue}
          onChange={handleInputChange}
          className="w-20 px-2 py-1 font-mono text-xs h-9"
        />
        <ShadcnSlider
          id={`${name}-slider`}
          value={[internalValue]}
          min={min}
          max={max}
          step={step}
          onValueChange={handleSliderChange}
          onPointerDown={() => {
            isDragging.current = true;
          }}
          onPointerUp={() => {
            isDragging.current = false;
            onChange(round(internalValue));
          }}
          className={cn("w-[60%] cursor-pointer")}
        />
      </div>
    </div>
  );
}
