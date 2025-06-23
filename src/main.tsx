import { createRoot } from "react-dom/client";
import { useRef, useState, useEffect } from "react";

import {
  seedToMatrix,
  matrixToSeed,
  randomAttractionRules,
} from "@/utils/seedMatrix";

import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/lib/theme-provider";

import { Simulation } from "@/components/Simulation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Settings } from "@/components/Settings";
import { SeedControls } from "@/components/SeedControls";
import { Analytics } from "@/components/Analytics/Analytics";

import "./index.css";

function App() {
  const randomizeRef = useRef<(() => void) | null>(null);
  const resetRef = useRef<(() => void) | null>(null);

  // Default config and rules
  const defaultConfig = {
    population: 10000,
    physics: {
      maxDistance: 0.25,
      damping: 0.2,
      timeScale: 10.0,
      wallRepel: 0.125,
      wallForce: 0.01,
      particleSize: 6.0,
      useProportionalScaling: true,
      refPopulation: 1000,
      scalingRatio: 0.5,
      mouseRepel: true,
    },
    rules: (() => {
      try {
        // Attempt to load rules from localStorage
        const stored = localStorage.getItem("cells-sim-rules");
        if (stored) return JSON.parse(stored);

        // If not found, generate random rules and store them
        const randomRules = randomAttractionRules();
        localStorage.setItem("cells-sim-rules", JSON.stringify(randomRules));

        return randomRules;
      } catch {
        // If parsing fails, generate random rules
        const randomRules = randomAttractionRules();
        localStorage.setItem("cells-sim-rules", JSON.stringify(randomRules));

        return randomRules;
      }
    })(),
  };

  const [config, setConfig] = useState(defaultConfig);

  // Settings state persisted in localStorage
  const defaultSettings = {
    showOverlay: true,
    showRules: true,
    showPhysics: true,
  };

  type SettingsState = typeof defaultSettings;
  const [settings, setSettings] = useState<SettingsState>(() => {
    try {
      const stored = localStorage.getItem("cells-sim-settings");
      return stored ? JSON.parse(stored) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // Persist settings and rules to localStorage
  useEffect(() => {
    localStorage.setItem("cells-sim-settings", JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem("cells-sim-rules", JSON.stringify(config.rules));
  }, [config.rules]);

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

  const handleMouseRepel = (v: boolean) => {
    setConfig((c) => ({
      ...c,
      physics: { ...c.physics, mouseRepel: !!v },
    }));
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
        setConfig={setConfig}
      />
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {settings.showOverlay && (
          <>
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
            <SeedControls
              seed={matrixToSeed(config.rules)}
              onImport={(seed) => {
                try {
                  setConfig((c) => ({ ...c, rules: seedToMatrix(seed) }));
                } catch (e) {
                  alert("Invalid seed");
                }
              }}
            />
          </>
        )}
        <Settings
          showOverlay={settings.showOverlay}
          setShowOverlay={(v) =>
            setSettings((s: SettingsState) => ({ ...s, showOverlay: v }))
          }
          showRules={settings.showRules}
          setShowRules={(v) =>
            setSettings((s: SettingsState) => ({ ...s, showRules: v }))
          }
          showPhysics={settings.showPhysics}
          setShowPhysics={(v) =>
            setSettings((s: SettingsState) => ({ ...s, showPhysics: v }))
          }
          mouseRepel={config.physics.mouseRepel}
          setMouseRepel={handleMouseRepel}
          population={config.population}
          setPopulation={(v) => setConfig((c) => ({ ...c, population: v }))}
        />
        <ThemeToggle />
      </div>
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-4 items-start p-0 m-0 bg-transparent shadow-none border-none">
        <Analytics
          config={config}
          showPhysics={settings.showPhysics}
          showRules={settings.showRules}
        />
      </div>
    </div>
  );
}

createRoot(document.getElementById("app")!).render(
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <App />
  </ThemeProvider>
);
