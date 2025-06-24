import { useRef, useState, useEffect } from "react";
import { SiGithub as Github } from "react-icons/si";

import {
  seedToMatrix,
  matrixToSeed,
  randomAttractionRules,
} from "@/utils/seedMatrix";
import { worlds } from "@/config/worlds";

import { Button } from "@/components/ui/button";
import { useSettings } from "@/providers/SettingsProvider";
import { SettingsBtn } from "@/components/SettingsBtn";

import { Simulation } from "@/components/Simulation";
import { ThemeBtn } from "@/components/ThemeBtn";
import { SeedBtn } from "@/components/SeedBtn";
import { Analytics } from "@/components/Analytics/Analytics";

export function App() {
  const { settings } = useSettings();
  const randomizeRef = useRef<(() => void) | null>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const [fps, setFps] = useState<number | null>(null);

  const [rules, setRules] = useState(() => {
    try {
      // Attempt to load rules from localStorage
      const stored = localStorage.getItem("cells-sim-rules");
      if (stored) return JSON.parse(stored);

      // If no rules are found, pick a random seed from the worlds array
      const randomSeed = worlds[Math.floor(Math.random() * worlds.length)];
      const matrix = seedToMatrix(randomSeed);
      localStorage.setItem("cells-sim-rules", JSON.stringify(matrix));
      return matrix;
    } catch {
      // If parsing fails, fallback to random rules
      const randomRules = randomAttractionRules();
      localStorage.setItem("cells-sim-rules", JSON.stringify(randomRules));
      return randomRules;
    }
  });

  // Save rules to localStorage when changed
  useEffect(() => {
    localStorage.setItem("cells-sim-rules", JSON.stringify(rules));
  }, [rules]);

  const config = {
    population: settings.population,
    physics: settings.physics,
    rules,
  };

  const handleRandomize = () => {
    if (randomizeRef.current) {
      randomizeRef.current();
    }
  };

  const handleReset = () => {
    if (resetRef.current) {
      resetRef.current();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const active = document.activeElement;
      const isTextInput =
        active &&
        ((active.tagName === "INPUT" &&
          (active as HTMLInputElement).type === "text") ||
          active.tagName === "TEXTAREA" ||
          (active as HTMLElement).isContentEditable);
      if (!isTextInput && (event.key === "r" || event.key === "R")) {
        handleRandomize();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [randomizeRef]);

  return (
    <div className="w-screen h-screen relative">
      <Simulation
        onRandomizeRef={(randomizeFn) => {
          randomizeRef.current = randomizeFn;
        }}
        onResetRef={(resetFn) => {
          resetRef.current = resetFn;
        }}
        config={config}
        setConfig={(newConfig) => {
          if (newConfig.rules) setRules(newConfig.rules);
        }}
        onFpsUpdate={setFps}
      />

      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col">
        <div className="flex flex-col md:flex-row w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-start w-full md:w-auto">
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
                  <Github className="w-4 h-4 mr-2" /> Sebi's Cellular Automata:
                  A "Clusters" Variation
                </a>
              </Button>
            )}
          </div>
          <div className="flex flex-row flex-1 justify-center md:justify-end items-center gap-2 mt-2 md:mt-0">
            {settings.showOverlay && (
              <>
                <Button
                  variant="default"
                  onClick={handleReset}
                  title="Reset simulation"
                  className="bg-foreground flex-grow md:flex-none"
                >
                  Reset
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRandomize}
                  title="Randomize simulation (R)"
                  className="dark:bg-zinc-950 dark:hover:bg-zinc-800 flex-grow md:flex-none"
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
                  className="dark:bg-zinc-950 dark:hover:bg-zinc-800 flex-grow md:flex-none"
                  title="Import/Export rules seed"
                  variant="outline"
                />
              </>
            )}
            <SettingsBtn
              className="dark:bg-zinc-950 dark:hover:bg-zinc-80"
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
                className="rounded-full bg-green-400/60 border-2 border-green-400/90 text-zinc-50 text-xs font-mono px-3 py-1 shadow text-center select-none self-start"
                title="FPS (V-synced)"
              >
                FPS: {fps}
              </div>
            )}
            <div
              className="rounded-full bg-green-400/60 border-2 border-green-400/90 text-zinc-50 text-xs font-mono px-3 py-1 shadow text-center select-none self-start"
              title="Particle Count"
            >
              Particles: {config.population.toLocaleString()}
            </div>
          </div>
        )}
      </div>
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-4 items-start p-0 m-0 bg-transparent shadow-none border-none">
        <Analytics
          config={config}
          showRules={settings.showRules}
          showPhysics={settings.showPhysics}
        />
      </div>
    </div>
  );
}
