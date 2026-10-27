import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { DICTIONARY } from "@/i18n/dictionary";

const Ctx = createContext(null);
const LANG_KEY = "tollgate.lang";
const THEME_KEY = "tollgate.theme";

const resolve = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

const initialLang = () => {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === "id" || saved === "en") return saved;
  return navigator.language?.toLowerCase().startsWith("id") ? "id" : "en";
};

export const PreferencesProvider = ({ children }) => {
  const [lang, setLang] = useState(initialLang);
  const [theme, setThemeState] = useState(() => (localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark"));

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => { localStorage.setItem(THEME_KEY, theme); }, [theme]);

  const setTheme = useCallback((next) => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    setThemeState(next);
    window.setTimeout(() => root.classList.remove("theme-transition"), 260);
  }, []);

  const t = useCallback((key, vars) => {
    const value = resolve(DICTIONARY[lang], key) ?? resolve(DICTIONARY.en, key) ?? key;
    if (!vars || typeof value !== "string") return value;
    return value.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, theme, setTheme, t }), [lang, theme, setTheme, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const usePrefs = () => useContext(Ctx);

// Theme preference applies to the console only. Marketing and auth routes stay dark.
export const useEffectiveTheme = () => {
  const { pathname } = useLocation();
  const { theme } = usePrefs();
  return pathname.startsWith("/console") ? theme : "dark";
};

export const ThemeSync = () => {
  const effective = useEffectiveTheme();
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", effective === "dark");
    root.style.colorScheme = effective;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", effective === "dark" ? "#09090b" : "#fafafa");
  }, [effective]);
  return null;
};
