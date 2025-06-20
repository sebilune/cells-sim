import { createRoot } from "react-dom/client";
import { Simulation } from "./components/Simulation";
import "./index.css";

function App() {
  return (
    <div className="w-screen h-screen">
      <Simulation />
    </div>
  );
}

createRoot(document.getElementById("app")!).render(<App />);
