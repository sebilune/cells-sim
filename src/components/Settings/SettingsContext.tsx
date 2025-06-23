import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

// Define all settings
export interface SettingsState {
  showOverlay: boolean;
  showRules: boolean;
  showPhysics: boolean;
  mouseRepel: boolean;
  population: number;
}

const DEFAULTS: SettingsState = {
  showOverlay: true,
  showRules: true,
  showPhysics: true,
  mouseRepel: true,
  population: 20000,
};

interface SettingsContextType {
  settings: SettingsState;
  setSetting: <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => void;
  setSettings: (settings: SettingsState) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

const LOCAL_STORAGE_KEY = "cells-sim-settings";

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<SettingsState>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setSetting = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => {
    setSettingsState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const setSettings = (newSettings: SettingsState) => {
    setSettingsState(newSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, setSetting, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}
