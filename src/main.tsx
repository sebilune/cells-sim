import { createRoot } from "react-dom/client";
import { useRef } from "react";
import { Simulation } from "@/components/Simulation";
import { Settings } from "@/components/Settings";
import { Button } from "@/components/ui/button";
import "./index.css";

function App() {
  const randomizeRef = useRef<(() => void) | null>(null);
  const resetRef = useRef<(() => void) | null>(null);

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
          variant="outline"
          onClick={handleRandomize}
          title="Randomize simulation (R)"
        >
          Randomize
        </Button>
        <Settings />
      </div>
    </div>
  );
}

createRoot(document.getElementById("app")!).render(<App />);
