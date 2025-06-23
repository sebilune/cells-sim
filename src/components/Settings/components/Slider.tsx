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
}

export function Slider({
  name,
  label,
  value,
  onChange,
  min,
  max,
}: SliderProps) {
  const [internalValue, setInternalValue] = useState(value);
  const isDragging = useRef(false);

  // Keep internalValue in sync with value prop
  if (internalValue !== value && !isDragging.current) {
    setInternalValue(value);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
    if (isNaN(v)) v = min;
    v = Math.max(min, Math.min(max, v));
    setInternalValue(v);
    onChange(v);
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={`${name}-input`}
          className="text-xs font-medium block mb-2"
        >
          {label}
        </label>
      )}
      <div className="flex flex-row items-center gap-4 w-full">
        <Input
          id={`${name}-input`}
          type="number"
          min={min}
          max={max}
          value={internalValue}
          onChange={handleInputChange}
          className="font-mono text-xs w-20 h-7 py-1 px-2"
        />
        <ShadcnSlider
          id={`${name}-slider`}
          value={[internalValue]}
          min={min}
          max={max}
          step={100}
          onValueChange={([v]) => {
            setInternalValue(v);
          }}
          onPointerDown={() => {
            isDragging.current = true;
          }}
          onPointerUp={() => {
            isDragging.current = false;
            onChange(internalValue);
          }}
          className={cn("w-[60%]")}
        />
      </div>
    </div>
  );
}
