import { render } from "preact";
import { Simulation } from "./components/Simulation";
import "./index.css";

function App() {
  return (
    <div className="w-screen h-screen">
      <Simulation />
    </div>
  );
}

render(<App />, document.getElementById("app")!);
