import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const Ctx = createContext(null);
const SIDEBAR_KEY = "tollgate.console.sidebar";
const ENV_KEY = "tollgate.console.env";

export const ConsoleProvider = ({ children }) => {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    return saved ? saved === "collapsed" : window.innerWidth < 1024;
  });
  const [env, setEnv] = useState(() => localStorage.getItem(ENV_KEY) || "live");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [keysVersion, setKeysVersion] = useState(0);
  const [strictDefault, setStrictDefault] = useState(true);

  useEffect(() => { localStorage.setItem(SIDEBAR_KEY, collapsed ? "collapsed" : "expanded"); }, [collapsed]);
  useEffect(() => { localStorage.setItem(ENV_KEY, env); }, [env]);

  const toggleSidebar = useCallback(() => setCollapsed((c) => !c), []);
  const bumpKeys = useCallback(() => setKeysVersion((v) => v + 1), []);

  const value = useMemo(() => ({
    collapsed, toggleSidebar, env, setEnv, paletteOpen, setPaletteOpen,
    createOpen, setCreateOpen, profileOpen, setProfileOpen, keysVersion, bumpKeys, strictDefault, setStrictDefault,
  }), [collapsed, toggleSidebar, env, paletteOpen, createOpen, profileOpen, keysVersion, bumpKeys, strictDefault]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useConsole = () => useContext(Ctx);
