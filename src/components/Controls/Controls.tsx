import { SiGithub as Github } from "react-icons/si";
import { Button } from "@/lib/ui/button";
import { SeedBtn } from "./components/SeedBtn";
import { SettingsBtn } from "./components/SettingsBtn";
import { ThemeBtn } from "./components/ThemeBtn";
import type { Settings, Config, Rules } from "@/types/simulation";

interface ControlsProps {
  settings: Settings;
  fps: number | null;
  config: Config;
  handleReset: () => void;
  handleRandomize: () => void;
  rules: Rules;
  setRules: (rules: Rules) => void;
  matrixToSeed: (rules: Rules) => string;
  seedToMatrix: (seed: string) => Rules;
}

export default function Controls({
  settings,
  fps,
  config,
  handleReset,
  handleRandomize,
  rules,
  setRules,
  matrixToSeed,
  seedToMatrix,
}: ControlsProps) {
  return (
    <>
      <div className="flex flex-col w-full md:flex-row">
        <div className="flex flex-col w-full md:flex-row md:items-center md:justify-start md:w-auto">
          {settings.showOverlay && (
            <Button
              asChild
              variant="outline"
              className="dark:bg-zinc-950 dark:hover:bg-zinc-800"
              title="View source code"
            >
              <a
                href="https://github.com/sebilune/cells-sim"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-4 h-4 mr-2" /> Sebi's Cellular Automata: A
                "Clusters" Variation
              </a>
            </Button>
          )}
        </div>
        <div className="flex flex-row items-center justify-center flex-1 gap-2 mt-2 md:justify-end md:mt-0">
          {settings.showOverlay && (
            <>
              <Button
                variant="default"
                onClick={handleReset}
                title="Reset simulation"
                className="flex-grow text-white bg-red-500 border-red-400 dark:bg-red-500/90 border-1 hover:bg-red-500/90 dark:hover:bg-red-500/70 md:flex-none"
              >
                Reset
              </Button>
              <Button
                variant="outline"
                onClick={handleRandomize}
                title="Randomize simulation (R)"
                className="flex-grow dark:bg-zinc-950 dark:hover:bg-zinc-800 md:flex-none"
              >
                Randomize
              </Button>
              <SeedBtn
                seed={matrixToSeed(rules)}
                onImport={(seed) => {
                  try {
                    setRules(seedToMatrix(seed));
                  } catch (e) {
                    alert("Invalid seed");
                  }
                }}
                className="flex-grow dark:bg-zinc-950 dark:hover:bg-zinc-800 md:flex-none"
                title="Import/Export rules seed"
                variant="outline"
              />
            </>
          )}
          <SettingsBtn
            className="dark:bg-zinc-950 dark:hover:bg-zinc-800"
            variant="outline"
            title="Settings"
          />
          <ThemeBtn
            className="dark:bg-zinc-950 dark:hover:bg-zinc-800"
            variant="outline"
          />
        </div>
      </div>
      {settings.showOverlay && (
        <div className="flex flex-row gap-2 mt-2">
          {fps !== null && (
            <div
              className="self-start px-3 py-1 font-mono text-xs text-center border-2 rounded-full shadow select-none bg-green-400/60 border-green-400/90 text-zinc-50"
              title="FPS (V-synced)"
            >
              FPS: {fps}
            </div>
          )}
          <div
            className="self-start px-3 py-1 font-mono text-xs text-center border-2 rounded-full shadow select-none bg-green-400/60 border-green-400/90 text-zinc-50"
            title="Particle Count"
          >
            Particles: {config.population.toLocaleString()}
          </div>
        </div>
      )}
    </>
  );
}
