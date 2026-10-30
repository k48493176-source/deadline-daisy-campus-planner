import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const ThemeContext = createContext({ dark: false, toggle: () => {} });
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      let preference: string | null = null;
      try { preference = localStorage.getItem("campus-planner-theme"); } catch { /* Storage may be blocked. */ }
      const next = preference === "dark" || (preference !== "light" && media.matches);
      document.documentElement.classList.toggle("dark", next);
      setDark(next);
    };
    sync();
    media.addEventListener("change", sync);
    window.addEventListener("storage", sync);
    return () => { media.removeEventListener("change", sync); window.removeEventListener("storage", sync); };
  }, []);
  function toggle() {
    const next = !dark;
    try { localStorage.setItem("campus-planner-theme", next ? "dark" : "light"); } catch { /* Keep this session usable. */ }
    document.documentElement.classList.toggle("dark", next);
    setDark(next);
  }
  return <ThemeContext.Provider value={{ dark, toggle }}>{children}</ThemeContext.Provider>;
}

export function ThemeToggle() {
  const { dark, toggle } = useContext(ThemeContext);
  const label = dark ? "Switch to light mode" : "Switch to dark mode";
  return <Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label={label} title={label} onClick={toggle}>
    {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
  </Button>;
}