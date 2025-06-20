import { render } from "preact";
import { Simulation } from "./components/Simulation";

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0, padding: 0 }}>
      <Simulation />
    </div>
  );
}

render(<App />, document.getElementById("app")!);
