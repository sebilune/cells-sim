import { createRoot } from "react-dom/client";

import { ThemeProvider } from "@/providers/ThemeProvider";
import { SettingsProvider } from "@/providers/SettingsProvider";

import { App } from "./App";

import "./index.css";

createRoot(document.getElementById("app")!).render(
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </ThemeProvider>
);
