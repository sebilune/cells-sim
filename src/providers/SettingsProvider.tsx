import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import type { Settings } from "@/types/simulation";
import type { Physics } from "@/types/simulation";

import { DEFAULTS } from "@/config/defaults";

interface SettingsContextType {
  resetSettings: () => void;
  setPhysicsSetting: <K extends keyof Physics>(
    key: K,
    value: Physics[K]
  ) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setSettings: (settings: Settings) => void;
  settings: Settings;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

const LOCAL_STORAGE_KEY = "cells-sim-settings";

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettingsState((prev: Settings) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Setter for physics subfields
  const setPhysicsSetting = <K extends keyof Physics>(
    key: K,
    value: Physics[K]
  ) => {
    setSettingsState((prev: Settings) => ({
      ...prev,
      physics: {
        ...prev.physics,
        [key]: value,
      },
    }));
  };

  const setSettings = (newSettings: Settings) => {
    setSettingsState(newSettings);
  };

  // Reset settings to defaults
  const resetSettings = () => {
    setSettingsState(DEFAULTS);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setSetting,
        setSettings,
        setPhysicsSetting,
        resetSettings,
      }}
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
