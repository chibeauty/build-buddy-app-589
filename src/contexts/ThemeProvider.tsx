import { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

type AdaptiveTheme = "light" | "dark" | "morning" | "afternoon" | "evening" | "night" | "focus" | "creative" | "calm" | "auto";

interface AdaptiveThemeContextType {
  adaptiveTheme: AdaptiveTheme;
  setAdaptiveTheme: (theme: AdaptiveTheme) => void;
  autoTheme: boolean;
  setAutoTheme: (auto: boolean) => void;
}

const AdaptiveThemeContext = createContext<AdaptiveThemeContextType | undefined>(undefined);

export function useAdaptiveTheme() {
  const context = useContext(AdaptiveThemeContext);
  if (!context) throw new Error("useAdaptiveTheme must be used within ThemeProvider");
  return context;
}

export function getTimeBasedTheme(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 9) return "morning";
  if (hour >= 9 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function getContextualTheme(pathname: string): string {
  if (pathname.includes("quiz")) return "focus";
  if (pathname.includes("flashcard") || pathname.includes("study")) return "focus";
  if (pathname.includes("community")) return "creative";
  if (pathname.includes("profile") || pathname.includes("achievements")) return "calm";
  return getTimeBasedTheme();
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [adaptiveTheme, setAdaptiveTheme] = useState<AdaptiveTheme>(() => {
    return (localStorage.getItem("adaptive-theme") as AdaptiveTheme) || "auto";
  });
  const [autoTheme, setAutoTheme] = useState(() => {
    return localStorage.getItem("auto-theme") !== "false";
  });

  useEffect(() => {
    localStorage.setItem("adaptive-theme", adaptiveTheme);
  }, [adaptiveTheme]);

  useEffect(() => {
    localStorage.setItem("auto-theme", String(autoTheme));
  }, [autoTheme]);

  // Apply theme when manually changed (not auto)
  useEffect(() => {
    if (adaptiveTheme !== "auto" && !autoTheme) {
      document.documentElement.className = adaptiveTheme;
    }
  }, [adaptiveTheme, autoTheme]);

  return (
    <AdaptiveThemeContext.Provider value={{ adaptiveTheme, setAdaptiveTheme, autoTheme, setAutoTheme }}>
      <NextThemesProvider {...props}>{children}</NextThemesProvider>
    </AdaptiveThemeContext.Provider>
  );
}
