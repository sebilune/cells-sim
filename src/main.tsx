import { createRoot } from "react-dom/client";
import { useRef, useState, useEffect } from "react";

import { seedToMatrix, matrixToSeed } from "@/utils/seedMatrix";

import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/lib/theme-provider";

import { Simulation } from "@/components/Simulation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Settings } from "@/components/Settings";
import { SeedControls } from "@/components/SeedControls";
import { RulesTable } from "@/components/RulesTable";
import { PhysicsTable } from "@/components/PhysicsTable";

import "./index.css";

function App() {
  const randomizeRef = useRef<(() => void) | null>(null);
  const resetRef = useRef<(() => void) | null>(null);

  // Default config and rules
  const defaultConfig = {
    maxDistance: 0.25,
    damping: 0.2,
    timeScale: 10.0,
    wallRepel: 0.125,
    wallForce: 0.01,
    particleSize: 12.0,
    useProportionalScaling: true,
    refPopulation: 1200,
    scalingRatio: 0.5,
  };
  const defaultAttractionRules = [
    [-0.32, -0.17, 0.34, 0.15, -0.1, 0.2],
    [-0.34, -0.1, -0.2, 0.15, 0.25, -0.15],
    [0.15, -0.2, 0.34, -0.17, 0.1, -0.25],
    [-0.17, 0.15, -0.32, -0.1, -0.2, 0.3],
    [-0.1, 0.25, 0.1, -0.2, 0.15, -0.3],
    [0.2, -0.15, -0.25, 0.3, -0.3, 0.1],
  ];
  const [config, setConfig] = useState(defaultConfig);
  const [attractionRules, setAttractionRules] = useState(() => {
    try {
      const stored = localStorage.getItem("cells-sim-rules");
      return stored ? JSON.parse(stored) : defaultAttractionRules;
    } catch {
      return defaultAttractionRules;
    }
  });
  // Settings state persisted in localStorage
  const defaultSettings = {
    showOverlay: true,
    showRules: false,
    showPhysics: false,
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
  useEffect(() => {
    localStorage.setItem("cells-sim-settings", JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem("cells-sim-rules", JSON.stringify(attractionRules));
  }, [attractionRules]);

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
        attractionRules={attractionRules}
        setAttractionRules={setAttractionRules}
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
              seed={matrixToSeed(attractionRules)}
              onImport={(seed) => {
                try {
                  setAttractionRules(seedToMatrix(seed));
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
        />
        <ThemeToggle />
      </div>
      <div className="absolute bottom-4 right-4 z-10 flex flex-row gap-4 items-end p-0 m-0 bg-transparent shadow-none border-none">
        {settings.showRules && (
          <div className="overflow-x-auto bg-transparent p-0 m-0">
            <div className="inline-block align-bottom bg-transparent p-0 m-0">
              <RulesTable rules={attractionRules} />
            </div>
          </div>
        )}
        {settings.showPhysics && (
          <div className="overflow-x-auto bg-transparent p-0 m-0">
            <div className="inline-block align-bottom bg-transparent p-0 m-0">
              <PhysicsTable config={config} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById("app")!).render(
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <App />
  </ThemeProvider>
);
