"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { KullaniciRol } from "@/lib/types";

const ROLES: { value: KullaniciRol; label: string }[] = [
  { value: "super_admin", label: "Süper Admin" },
  { value: "program_yoneticisi", label: "Program Yöneticisi" },
  { value: "startup", label: "Startup" },
  { value: "karar_verici", label: "Karar Verici" },
];

const STORAGE_KEY = "t3-pusula-rol";
const DEFAULT_ROLE: KullaniciRol = "super_admin";

interface RoleContextValue {
  rol: KullaniciRol;
  setRol: (rol: KullaniciRol) => void;
  roller: typeof ROLES;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [rol, setRolState] = useState<KullaniciRol>(DEFAULT_ROLE);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as KullaniciRol | null;
    if (saved) setRolState(saved);
  }, []);

  const setRol = (yeniRol: KullaniciRol) => {
    setRolState(yeniRol);
    localStorage.setItem(STORAGE_KEY, yeniRol);
  };

  return (
    <RoleContext.Provider value={{ rol, setRol, roller: ROLES }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole, RoleProvider içinde kullanılmalı");
  return ctx;
}
