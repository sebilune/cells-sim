import { Settings as SettingsIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Slider } from "./Slider";

import { useSettings } from "@/providers/SettingsProvider";

interface SettingsBtnProps {
  className?: string;
  variant?: "default" | "outline" | "secondary" | "custom";
  title?: string;
  onResetAll?: () => void;
}

export function SettingsBtn({
  className,
  variant = "custom",
  title,
  onResetAll,
}: SettingsBtnProps) {
  const { settings, setSetting, setPhysicsSetting } = useSettings();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={variant} title={title} className={className}>
          <SettingsIcon className="w-5 h-5" aria-label="Settings" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-[70vh] p-0">
        <ScrollArea className="h-[70vh] w-full">
          <div className="grid gap-4 p-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Settings</h4>
            </div>
            <div className="pt-2 border-t border-border">
              <h5 className="mb-2 text-xs font-semibold text-muted-foreground">
                General
              </h5>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="showOverlay"
                  checked={settings.showOverlay}
                  onCheckedChange={(v) => setSetting("showOverlay", !!v)}
                  className="cursor-pointer"
                />
                <Label htmlFor="showOverlay">Overlay</Label>
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              <h5 className="mb-2 text-xs font-semibold text-muted-foreground">
                Analytics
              </h5>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="showRules"
                    checked={settings.showRules}
                    onCheckedChange={(v) => setSetting("showRules", !!v)}
                    className="cursor-pointer"
                  />
                  <Label htmlFor="showRules">Rules</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="showPhysics"
                    checked={settings.showPhysics}
                    onCheckedChange={(v) => setSetting("showPhysics", !!v)}
                    className="cursor-pointer"
                  />
                  <Label htmlFor="showPhysics">Physics</Label>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              <h5 className="mb-2 text-xs font-semibold text-muted-foreground">
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
                  step={0.01}
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
            <div className="pt-2 border-t border-border">
              <h5 className="mb-2 text-xs font-semibold text-muted-foreground">
                Physics
              </h5>
              <div className="flex flex-col gap-3">
                <Slider
                  name="maxDistance"
                  label="Max Distance"
                  value={settings.physics.maxDistance}
                  onChange={(v) => setPhysicsSetting("maxDistance", v)}
                  min={0.01}
                  max={1.0}
                  step={0.01}
                  float={true}
                />
                <Slider
                  name="damping"
                  label="Damping"
                  value={settings.physics.damping}
                  onChange={(v) => setPhysicsSetting("damping", v)}
                  min={0.0}
                  max={1.0}
                  step={0.01}
                  float={true}
                />
                <Slider
                  name="timeScale"
                  label="Time Scale"
                  value={settings.physics.timeScale}
                  onChange={(v) => setPhysicsSetting("timeScale", v)}
                  min={0.1}
                  max={50.0}
                  step={0.1}
                  float={true}
                />
                <Slider
                  name="wallRepel"
                  label="Wall Repel"
                  value={settings.physics.wallRepel}
                  onChange={(v) => setPhysicsSetting("wallRepel", v)}
                  min={0.0}
                  max={1.0}
                  step={0.01}
                  float={true}
                />
                <Slider
                  name="wallForce"
                  label="Wall Force"
                  value={settings.physics.wallForce}
                  onChange={(v) => setPhysicsSetting("wallForce", v)}
                  min={0.0}
                  max={0.1}
                  step={0.001}
                  float={true}
                />
                <Slider
                  name="particleSize"
                  label="Particle Size"
                  value={settings.physics.particleSize}
                  onChange={(v) => setPhysicsSetting("particleSize", v)}
                  min={1.0}
                  max={20.0}
                  step={0.1}
                  float={true}
                />
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <Button
                type="button"
                className="w-full text-white bg-red-500 border-red-400 dark:bg-red-500/90 border-1 hover:bg-red-500/90 dark:hover:bg-red-500/70"
                title="Reset all settings (Careful!)"
                onClick={() => {
                  if (onResetAll) {
                    onResetAll();
                  }
                }}
              >
                Reset All Settings
              </Button>
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
