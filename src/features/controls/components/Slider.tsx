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
  const [internalValue, setInternalValue] = useState(
    float ? parseFloat(Number(value).toFixed(1)) : Math.round(value)
  );
  const isDragging = useRef(false);

  // Keep internalValue in sync with value prop
  if (
    (float
      ? parseFloat(Number(internalValue).toFixed(1)) !==
        parseFloat(Number(value).toFixed(1))
      : internalValue !== value) &&
    !isDragging.current
  ) {
    setInternalValue(
      float ? parseFloat(Number(value).toFixed(1)) : Math.round(value)
    );
  }

  // Allow floats or ints in input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v: number;
    if (float) {
      v = parseFloat(e.target.value.replace(/[^0-9.\-]/g, ""));
      if (isNaN(v)) v = min;
      v = Math.max(min, Math.min(max, v));
      v = parseFloat(v.toFixed(1));
    } else {
      v = parseInt(e.target.value.replace(/[^0-9\-]/g, ""), 10);
      if (isNaN(v)) v = min;
      v = Math.max(min, Math.min(max, v));
      v = Math.round(v);
    }
    setInternalValue(v);

    // Always pass float
    onChange(float ? parseFloat(v.toFixed(1)) : Math.round(v));
  };

  const handleSliderChange = ([v]: number[]) => {
    let newValue = v;
    if (float) {
      // Step for float precision
      const decimals =
        step && step < 1 ? step.toString().split(".")[1]?.length || 1 : 1;
      newValue = parseFloat(newValue.toFixed(decimals));
    } else {
      newValue = Math.round(newValue);
    }
    setInternalValue(newValue);
  };

  // Format value for display
  const displayValue = float
    ? (() => {
        const decimals =
          step && step < 1 ? step.toString().split(".")[1]?.length || 1 : 1;
        return parseFloat(Number(internalValue).toFixed(decimals)).toFixed(
          decimals
        );
      })()
    : Math.round(internalValue).toString();

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
            // Always pass float
            onChange(
              float
                ? parseFloat(internalValue.toFixed(1))
                : Math.round(internalValue)
            );
          }}
          className={cn("w-[60%] cursor-pointer")}
        />
      </div>
    </div>
  );
}
