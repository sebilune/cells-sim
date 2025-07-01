import type { Settings, Config, Rules } from "@/types/simulation";

import { SiGithub as Github } from "react-icons/si";

import { Button } from "@/components/ui/button";

import { SeedBtn } from "./components/SeedBtn";
import { SettingsBtn } from "./components/SettingsBtn";
import { ThemeBtn } from "./components/ThemeBtn";
import { RuleEditorBtn } from "./components/RuleEditorBtn";

interface ControlsProps {
  config: Config;
  fps: number | null;
  handleRandomize: () => void;
  handleReset: () => void;
  handleResetAll?: () => void;
  matrixToSeed: (rules: Rules) => string;
  rules: Rules;
  seedToMatrix: (seed: string) => Rules;
  setRules: (rules: Rules) => void;
  settings: Settings;
}

export default function Controls({
  config,
  fps,
  handleRandomize,
  handleReset,
  handleResetAll,
  matrixToSeed,
  rules,
  seedToMatrix,
  setRules,
  settings,
}: ControlsProps) {
  return (
    <>
      <div className="flex flex-col w-full md:flex-row">
        <div className="flex flex-col w-full md:flex-row md:items-center md:justify-start md:w-auto">
          {settings.showOverlay && (
            <Button asChild variant="custom" title="View source code">
              <a
                href="https://github.com/sebilune/cells-sim"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Github className="w-4 h-4" />
                Sebi's Cellular Automata: A "Clusters" Variation
              </a>
            </Button>
          )}
        </div>
        <div className="flex flex-row items-center justify-center flex-1 gap-2 mt-2 md:justify-end md:mt-0">
          {settings.showOverlay && (
            <>
              <Button
                onClick={handleReset}
                title="Reset simulation"
                variant="default"
                className="flex-grow text-white bg-red-500 border-red-400 dark:bg-red-500/90 border-1 hover:bg-red-500/90 dark:hover:bg-red-500/70 md:flex-none"
              >
                Reset
              </Button>
              <Button
                onClick={() => {
                  handleRandomize();
                  handleReset();
                }}
                title="Randomize simulation (R)"
                className="flex-grow md:flex-none"
                variant="custom"
              >
                Randomize
              </Button>
              <SeedBtn
                className="flex-grow md:flex-none"
                seed={matrixToSeed(rules)}
                onImport={(seed) => {
                  try {
                    setRules(seedToMatrix(seed));
                  } catch (e) {
                    alert("Invalid seed");
                  }
                }}
                title="Import/Export rules seed"
                variant="custom"
              />
            </>
          )}
          <RuleEditorBtn
            colorOptions={["Red", "Green", "Blue", "Yellow", "Cyan", "Magenta"]}
            rules={rules}
            setRules={setRules}
            variant="custom"
          />
          <SettingsBtn
            onResetAll={handleResetAll}
            handleReset={handleReset}
            title="Settings"
            variant="custom"
          />
          <ThemeBtn variant="custom" />
        </div>
      </div>
      {settings.showOverlay && (
        <div className="flex flex-row gap-2 mt-2">
          {fps !== null && (
            <div
              className="self-start px-3 py-1 font-mono text-xs text-center border-2 rounded-full shadow select-none bg-green-700/90 border-green-400/90 text-zinc-50"
              title="FPS (V-synced)"
            >
              FPS: {fps}
            </div>
          )}
          <div
            className="self-start px-3 py-1 font-mono text-xs text-center border-2 rounded-full shadow select-none bg-green-700/90 border-green-400/90 text-zinc-50"
            title="Particle Count"
          >
            Particles: {config.population.toLocaleString()}
          </div>
        </div>
      )}
    </>
  );
}
