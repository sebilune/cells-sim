import { createRoot } from "react-dom/client";
import { useRef, useState } from "react";

import { Simulation } from "@/components/Simulation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Settings } from "@/components/Settings";

import { ThemeProvider } from "@/lib/theme-provider";
import { Button } from "@/components/ui/button";
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
  const [attractionRules, setAttractionRules] = useState(
    defaultAttractionRules
  );
  const [showOverlay, setShowOverlay] = useState(true);
  const [showRules, setShowRules] = useState(true);
  const [showPhysics, setShowPhysics] = useState(true);

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
        {showOverlay && (
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
          </>
        )}
        <Settings
          showOverlay={showOverlay}
          setShowOverlay={setShowOverlay}
          showRules={showRules}
          setShowRules={setShowRules}
          showPhysics={showPhysics}
          setShowPhysics={setShowPhysics}
        />
        <ThemeToggle />
      </div>
      <div className="absolute bottom-4 right-4 z-10 flex flex-row gap-4 items-end p-0 m-0 bg-transparent shadow-none border-none">
        {showRules && (
          <div className="overflow-x-auto bg-transparent p-0 m-0">
            <div className="inline-block align-bottom bg-transparent p-0 m-0">
              <RulesTable rules={attractionRules} />
            </div>
          </div>
        )}
        {showPhysics && (
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
