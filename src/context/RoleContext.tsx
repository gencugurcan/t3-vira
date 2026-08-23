"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import type { KullaniciRol } from "@/lib/types";

const ROLES: { value: KullaniciRol; label: string }[] = [
  { value: "super_admin", label: "Süper Admin" },
  { value: "program_yoneticisi", label: "Program Yöneticisi" },
  { value: "startup", label: "Startup" },
  { value: "karar_verici", label: "Karar Verici" },
];

const STORAGE_KEY = "t3-vira-rol";
const DEFAULT_ROLE: KullaniciRol = "super_admin";
const GECERLI_ROLLER = new Set(ROLES.map((r) => r.value));

function gecerliRolMu(deger: string | null): deger is KullaniciRol {
  return !!deger && GECERLI_ROLLER.has(deger as KullaniciRol);
}

// Rol seçimini localStorage'da tutuyoruz ama React'in "effect içinde
// setState çağırma" kuralına takılmamak (ve SSR/hydration ile localStorage'ı
// karıştırmamak) için useSyncExternalStore ile küçük bir harici store olarak
// modelliyoruz; aynı sekme içindeki değişiklikleri de bu store bildiriyor.
const dinleyiciler = new Set<() => void>();

function bildir() {
  dinleyiciler.forEach((dinle) => dinle());
}

function subscribe(dinle: () => void) {
  dinleyiciler.add(dinle);
  return () => dinleyiciler.delete(dinle);
}

function getSnapshot(): KullaniciRol {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return gecerliRolMu(saved) ? saved : DEFAULT_ROLE;
}

function getServerSnapshot(): KullaniciRol {
  return DEFAULT_ROLE;
}

interface RoleContextValue {
  rol: KullaniciRol;
  setRol: (rol: KullaniciRol) => void;
  roller: typeof ROLES;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const rol = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setRol = (yeniRol: KullaniciRol) => {
    window.localStorage.setItem(STORAGE_KEY, yeniRol);
    bildir();
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
