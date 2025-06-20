import { createRoot } from "react-dom/client";
import { Simulation } from "@/components/Simulation";
import { Settings } from "@/components/Settings";
import "./index.css";

function App() {
  return (
    <div className="w-screen h-screen relative">
      <Simulation />
      <div className="absolute top-4 right-4 z-10">
        <Settings />
      </div>
    </div>
  );
}

createRoot(document.getElementById("app")!).render(<App />);
