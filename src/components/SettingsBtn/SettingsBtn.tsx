import { Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "./components/Slider";
import { useSettings } from "@/providers/SettingsProvider";

interface SettingsBtnProps {
  className?: string;
  variant?: "default" | "outline";
  title?: string;
}

export function SettingsBtn({ className, variant, title }: SettingsBtnProps) {
  const { settings, setSetting, setPhysicsSetting } = useSettings();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={variant} title={title} className={className}>
          <SettingsIcon className="w-5 h-5" aria-label="Settings" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 dark:bg-zinc-950">
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
                checked={settings.showOverlay}
                onCheckedChange={(v) => setSetting("showOverlay", !!v)}
              />
              <Label htmlFor="showOverlay">Overlay</Label>
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
                  checked={settings.showRules}
                  onCheckedChange={(v) => setSetting("showRules", !!v)}
                />
                <Label htmlFor="showRules">Rules</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="showPhysics"
                  checked={settings.showPhysics}
                  onCheckedChange={(v) => setSetting("showPhysics", !!v)}
                />
                <Label htmlFor="showPhysics">Physics</Label>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <h5 className="text-xs font-semibold mb-2 text-muted-foreground">
              Simulation
            </h5>
            <div className="flex flex-col gap-3">
              <Slider
                name="mouseRepel"
                label="Mouse Repulsion"
                value={settings.physics.mouseRepel}
                onChange={(v) => setPhysicsSetting("mouseRepel", v)}
                min={0.0}
                max={5.0}
                step={0.5}
                float={true}
              />
              <Slider
                name="population"
                label="Population"
                value={settings.population}
                onChange={(v) => setSetting("population", v)}
                min={0}
                max={100000}
                step={2000}
              />
            </div>
          </div>
          <div className="pt-4 border-t border-border">
            <Button
              type="button"
              className="w-full bg-red-500/90 hover:bg-red-500/70 text-white"
              title="Reset all settings (Careful!)"
              onClick={() => {
                localStorage.removeItem("cells-sim-settings");
                localStorage.removeItem("cells-sim-rules");
                window.location.reload();
              }}
            >
              Reset All Settings
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
