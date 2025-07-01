import { useState } from "react";
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
}

export const RuleEditorBtn: React.FC<RuleEditorBtnProps> = ({
  rules,
  setRules,
  colorOptions,
}) => {
  const [fromColor, setFromColor] = useState(colorOptions[0]);
  const [toColor, setToColor] = useState(colorOptions[0]);
  const [ruleValue, setRuleValue] = useState(0.5);
  const [open, setOpen] = useState(false);

  const handleSetRule = () => {
    const fromIdx = colorOptions.indexOf(fromColor);
    const toIdx = colorOptions.indexOf(toColor);
    if (fromIdx !== -1 && toIdx !== -1) {
      const newRules = rules.map((row, i) =>
        row.map((val, j) => (i === fromIdx && j === toIdx ? ruleValue : val))
      );
      setRules(newRules);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" title="Edit Custom Rules">
          Rules
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-[22rem] max-w-[28rem] p-0 dark:bg-zinc-950">
        <div className="grid gap-4 p-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Rules</h4>
          </div>
          <div className="pt-2 border-t border-border">
            <h5 className="mb-2 text-xs font-semibold text-muted-foreground">
              Set Rules
            </h5>
            <div className="flex items-center gap-2 flex-nowrap">
              <Select value={fromColor} onValueChange={setFromColor}>
                <SelectTrigger className="w-20 h-8 px-2 py-1 ">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color} value={color} className="h-8 ">
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <MoveRight className="w-5 h-5" />
              <Select value={toColor} onValueChange={setToColor}>
                <SelectTrigger className="w-20 h-8 px-2 py-1 ">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color} value={color} className="h-8 ">
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
              <Button className="px-4 h-9 nowrap" onClick={handleSetRule}>
                Set Rule
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
