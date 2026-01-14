import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import type { EffectiveTheme, ThemePreference } from "./theme";
import { THEME_KEY } from "./theme";

type ThemeContextValue = {
  preference: ThemePreference;
  effectiveTheme: EffectiveTheme; // gerçek uygulanan tema
  setPreference: (pref: ThemePreference) => Promise<void>;
  loading: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme(); // "light" | "dark" | null
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === "system" || saved === "light" || saved === "dark") {
          setPreferenceState(saved);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const effectiveTheme: EffectiveTheme = useMemo(() => {
    if (preference === "system") return systemScheme === "dark" ? "dark" : "light";
    return preference;
  }, [preference, systemScheme]);

  const setPreference = async (pref: ThemePreference) => {
    setPreferenceState(pref);
    await AsyncStorage.setItem(THEME_KEY, pref);
  };

  const value = useMemo(
    () => ({ preference, effectiveTheme, setPreference, loading }),
    [preference, effectiveTheme, loading]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used inside ThemeProvider");
  return ctx;
}
