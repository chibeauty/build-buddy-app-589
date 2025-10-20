import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAdaptiveTheme, getContextualTheme, getTimeBasedTheme } from "@/contexts/ThemeProvider";

export function AdaptiveThemeWatcher() {
  const location = useLocation();
  const { adaptiveTheme, autoTheme } = useAdaptiveTheme();

  useEffect(() => {
    if (adaptiveTheme === "auto" || autoTheme) {
      const theme = getContextualTheme(location.pathname);
      document.documentElement.className = theme;
    }
  }, [location.pathname, adaptiveTheme, autoTheme]);

  // Also check time every minute for auto theme updates
  useEffect(() => {
    if (adaptiveTheme === "auto" || autoTheme) {
      const interval = setInterval(() => {
        const theme = getContextualTheme(location.pathname);
        document.documentElement.className = theme;
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [location.pathname, adaptiveTheme, autoTheme]);

  return null;
}
