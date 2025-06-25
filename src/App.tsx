import { useRef, useState, useEffect } from "react";

import {
  seedToMatrix,
  matrixToSeed,
  randomAttractionRules,
} from "@/utils/seedMatrix";
import { worlds } from "@/config/worlds";

import { useSettings } from "@/providers/SettingsProvider";

import { Simulation } from "@/components/Simulation";
import { Analytics } from "@/components/Analytics";
import { Controls } from "@/components/Controls";

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
    <div className="relative w-screen h-screen">
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

      <div className="absolute z-10 flex flex-col top-4 left-4 right-4">
        <Controls
          settings={settings}
          fps={fps}
          config={config}
          handleReset={handleReset}
          handleRandomize={handleRandomize}
          rules={rules}
          setRules={setRules}
          matrixToSeed={matrixToSeed}
          seedToMatrix={seedToMatrix}
        />
      </div>
      <div className="absolute z-10 flex flex-col items-start gap-4 p-0 m-0 bg-transparent border-none shadow-none bottom-4 left-4">
        <Analytics
          config={config}
          showRules={settings.showRules}
          showPhysics={settings.showPhysics}
        />
      </div>
    </div>
  );
}
