import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Physics } from "@/types/simulation";

export interface SettingsState {
  showOverlay: boolean;
  showRules: boolean;
  showPhysics: boolean;

  population: number;
  physics: Physics;
}

const DEFAULTS: SettingsState = {
  showOverlay: true,
  showRules: true,
  showPhysics: true,
  population: 20000,
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
};

interface SettingsContextType {
  settings: SettingsState;
  setSetting: <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => void;
  setSettings: (settings: SettingsState) => void;
  setPhysicsSetting: <K extends keyof Physics>(
    key: K,
    value: Physics[K]
  ) => void;
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

  // Setter for physics subfields
  const setPhysicsSetting = <K extends keyof Physics>(
    key: K,
    value: Physics[K]
  ) => {
    setSettingsState((prev) => ({
      ...prev,
      physics: {
        ...prev.physics,
        [key]: value,
      },
    }));
  };

  const setSettings = (newSettings: SettingsState) => {
    setSettingsState(newSettings);
  };

  return (
    <SettingsContext.Provider
      value={{ settings, setSetting, setSettings, setPhysicsSetting }}
    >
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
