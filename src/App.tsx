import { useRef, useState, useEffect } from "react";

import {
  seedToMatrix,
  matrixToSeed,
  randomAttractionRules,
} from "@/utils/seedMatrix";

import { Button } from "@/components/ui/button";
import { useSettings } from "@/providers/SettingsProvider";
import { Settings } from "@/components/Settings";

import { Simulation } from "@/components/Simulation";
import { ThemeBtn } from "@/components/ThemeBtn";
import { SeedBtn } from "@/components/SeedBtn";
import { Analytics } from "@/components/Analytics/Analytics";

import "./index.css";

export function App() {
  const { settings } = useSettings();
  const randomizeRef = useRef<(() => void) | null>(null);
  const resetRef = useRef<(() => void) | null>(null);

  const [rules, setRules] = useState(() => {
    try {
      // Attempt to load rules from localStorage
      const stored = localStorage.getItem("cells-sim-rules");
      if (stored) return JSON.parse(stored);

      // If no rules are found, generate random rules
      const randomRules = randomAttractionRules();
      localStorage.setItem("cells-sim-rules", JSON.stringify(randomRules));
      return randomRules;
    } catch {
      // If parsing fails gen random rules
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
    ...settings,
    rules,
    physics: settings.physics,
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
      />
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="destructive"
          onClick={handleReset}
          title="Reset simulation"
        >
          Reset
        </Button>
        <Button
          variant="secondary"
          onClick={handleRandomize}
          title="Randomize simulation (R)"
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
        />
        <Settings />
        <ThemeBtn />
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
