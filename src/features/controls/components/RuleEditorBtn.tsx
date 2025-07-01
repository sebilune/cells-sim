import { useState, useEffect } from "react";

import { MoveRight, Tally4 } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface RuleEditorBtnProps {
  rules: number[][];
  setRules: (rules: number[][]) => void;
  colorOptions: string[];
  variant?: "default" | "outline" | "secondary" | "custom";
}

export const RuleEditorBtn = ({
  rules,
  setRules,
  colorOptions,
  variant = "custom",
}: RuleEditorBtnProps) => {
  const [fromColor, setFromColor] = useState(colorOptions[0]);
  const [toColor, setToColor] = useState(colorOptions[0]);
  const [ruleValue, setRuleValue] = useState(0.5);
  const [open, setOpen] = useState(false);
  const [customRules, setCustomRules] = useState<{ [key: string]: number }>({});

  // Load custom rules from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("cells-sim-custom-rules");
    if (stored) {
      setCustomRules(JSON.parse(stored));
    }
  }, []);

  // Save custom rules to localStorage when changed
  useEffect(() => {
    localStorage.setItem("cells-sim-custom-rules", JSON.stringify(customRules));
  }, [customRules]);

  // Apply custom rules on top of rules matrix
  useEffect(() => {
    if (Object.keys(customRules).length > 0) {
      const newRules = rules.map((row, i) =>
        row.map((val, j) => {
          const key = `${i},${j}`;
          return customRules[key] !== undefined ? customRules[key] : val;
        })
      );
      setRules(newRules);
    }
  }, [Object.keys(customRules).join("")]);

  const handleSetRule = () => {
    const fromIdx = colorOptions.indexOf(fromColor);
    const toIdx = colorOptions.indexOf(toColor);
    if (fromIdx !== -1 && toIdx !== -1) {
      const key = `${fromIdx},${toIdx}`;
      setCustomRules((prev) => ({ ...prev, [key]: ruleValue }));
      const newRules = rules.map((row, i) =>
        row.map((val, j) => (i === fromIdx && j === toIdx ? ruleValue : val))
      );
      setRules(newRules);
    }
  };

  const handleClearAll = () => {
    setCustomRules({});
    const zeroed = rules.map((row) => row.map(() => 0));
    setRules(zeroed);
  };

  const handleRandomizeRemaining = () => {
    const newRules = rules.map((row, i) =>
      row.map((val, j) => {
        const key = `${i},${j}`;
        if (customRules[key] !== undefined) return val;
        // Random value between -1 and 1, rounded to 2 decimals
        return Math.round((Math.random() * 2 - 1) * 100) / 100;
      })
    );
    setRules(newRules);
  };

  // Helper to display custom rules
  const customRuleList = Object.entries(customRules).map(([key, value]) => {
    const [fromIdx, toIdx] = key.split(",").map(Number);
    return (
      <div
        key={key}
        className="flex items-center justify-between gap-2 px-4 py-2 font-mono text-sm border rounded-md"
      >
        <div className="flex items-center gap-2">
          <span>{colorOptions[fromIdx]}</span>
          <span className="mx-1">-&gt;</span>
          <span>{colorOptions[toIdx]}</span>
          <span className="mx-1">:</span>
          <span>{value}</span>
        </div>
        <button
          className="px-2 ml-4 text-lg cursor-pointer text-muted-foreground"
          title="Remove custom rule"
          onClick={() => {
            setCustomRules((prev) => {
              const next = { ...prev };
              delete next[key];
              return next;
            });
          }}
        >
          X
        </button>
      </div>
    );
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={variant} title="Edit Custom Rules">
          Rules
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-[32rem] max-w-[28rem] p-0 ">
        <div className="grid gap-4 p-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Rules</h4>
          </div>
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              className="flex-grow"
              title="Set All to Zero (Sets all rules to zero)"
              onClick={handleClearAll}
            >
              Set All Rules to Zero
            </Button>
            <Button
              type="button"
              className="flex-grow"
              title="Randomize remaining rules (Not custom)"
              onClick={handleRandomizeRemaining}
            >
              Randomize Remaining Rules
            </Button>
          </div>
          <div className="pt-2 border-t border-border">
            <h5 className="mb-2 text-xs font-semibold text-muted-foreground">
              Set Rules
            </h5>
            <div className="flex items-center gap-2 flex-nowrap">
              <Select value={fromColor} onValueChange={setFromColor}>
                <SelectTrigger className="h-8 px-2 py-1 cursor-pointer w-26">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color} value={color} className="h-8">
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <MoveRight className="w-5 h-5" />
              <Select value={toColor} onValueChange={setToColor}>
                <SelectTrigger className="h-8 px-2 py-1 cursor-pointer w-26">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color} value={color} className="h-8">
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tally4 />
              <Input
                type="number"
                min={-1}
                max={1}
                step={0.01}
                value={ruleValue}
                onChange={(e) => setRuleValue(Number(e.target.value))}
                className="w-20 px-2 py-1 h-9 "
              />
              <Button
                className="flex-grow px-4 h-9 nowrap"
                onClick={handleSetRule}
              >
                Set Rule
              </Button>
            </div>
          </div>
          {customRuleList.length > 0 && (
            <div className="pt-2 border-t border-border">
              <h5 className="mb-2 text-xs font-semibold text-muted-foreground">
                Custom Rules
              </h5>
              <div className="flex flex-col gap-1">{customRuleList}</div>
            </div>
          )}
          {customRuleList.length > 0 && (
            <div className="pt-4 border-t border-border">
              <Button
                type="button"
                className="w-full text-white bg-red-500 border-red-400 dark:bg-red-500/90 border-1 hover:bg-red-500/90 dark:hover:bg-red-500/70"
                title="Clear all custom rules"
                onClick={() => setCustomRules({})}
              >
                Clear Custom Rules
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
