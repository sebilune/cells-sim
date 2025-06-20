import { Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SettingsProps {
  showOverlay: boolean;
  setShowOverlay: (v: boolean) => void;
  showRules: boolean;
  setShowRules: (v: boolean) => void;
  showPhysics: boolean;
  setShowPhysics: (v: boolean) => void;
}

export function Settings({
  showOverlay,
  setShowOverlay,
  showRules,
  setShowRules,
  showPhysics,
  setShowPhysics,
}: SettingsProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">
          <SettingsIcon className="w-5 h-5" aria-label="Settings" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="leading-none font-medium">Settings</h4>
          </div>
          <div className="pt-2 border-t border-border">
            <h5 className="text-xs font-semibold mb-2 text-muted-foreground">
              General
            </h5>
            <div className="flex items-center gap-3">
              <Checkbox
                id="showOverlay"
                checked={showOverlay}
                onCheckedChange={setShowOverlay}
              />
              <Label htmlFor="showOverlay">Show Overlay</Label>
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <h5 className="text-xs font-semibold mb-2 text-muted-foreground">
              Analytics
            </h5>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="showRules"
                  checked={showRules}
                  onCheckedChange={setShowRules}
                />
                <Label htmlFor="showRules">Rules</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="showPhysics"
                  checked={showPhysics}
                  onCheckedChange={setShowPhysics}
                />
                <Label htmlFor="showPhysics">Physics</Label>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
