"use client";
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext<{ dark: boolean; toggle: () => void }>({ dark: true, toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) setDark(saved === "dark");
  }, []);

  function toggle() {
    setDark(prev => {
      localStorage.setItem("theme", !prev ? "dark" : "light");
      return !prev;
    });
  }

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      <div data-theme={dark ? "dark" : "light"}>{children}</div>
    </ThemeContext.Provider>
  );
}
