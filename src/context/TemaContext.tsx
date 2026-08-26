"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

const STORAGE_KEY = "t3-vira-tema";

export type Tema = "dark" | "light";

function gecerliTemaMi(deger: string | null): deger is Tema {
  return deger === "dark" || deger === "light";
}

function sistemTercihi(): Tema {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Tema tercihini localStorage'da tutuyoruz; RoleContext/OturumContext'teki
// aynı desen — useSyncExternalStore ile harici bir store, "effect içinde
// setState" kuralına takılmadan SSR/hydration ile localStorage'ı güvenle
// karıştırıyor. <html>'e uygulanan gerçek data-theme attribute'unu app/
// layout.tsx'teki inline script (hydration öncesi) ve aşağıdaki uygula()
// (kullanıcı değiştirdiğinde) yönetir.
const dinleyiciler = new Set<() => void>();

function bildir() {
  dinleyiciler.forEach((dinle) => dinle());
}

function subscribe(dinle: () => void) {
  dinleyiciler.add(dinle);
  return () => dinleyiciler.delete(dinle);
}

function getSnapshot(): Tema {
  const kayitli = window.localStorage.getItem(STORAGE_KEY);
  return gecerliTemaMi(kayitli) ? kayitli : sistemTercihi();
}

function getServerSnapshot(): Tema {
  return "dark";
}

function uygula(tema: Tema) {
  document.documentElement.setAttribute("data-theme", tema);
}

interface TemaContextValue {
  tema: Tema;
  temaDegistir: () => void;
}

const TemaContext = createContext<TemaContextValue | null>(null);

export function TemaProvider({ children }: { children: React.ReactNode }) {
  const tema = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const temaDegistir = () => {
    const yeni: Tema = tema === "dark" ? "light" : "dark";
    window.localStorage.setItem(STORAGE_KEY, yeni);
    uygula(yeni);
    bildir();
  };

  return (
    <TemaContext.Provider value={{ tema, temaDegistir }}>
      {children}
    </TemaContext.Provider>
  );
}

export function useTema() {
  const ctx = useContext(TemaContext);
  if (!ctx) throw new Error("useTema, TemaProvider içinde kullanılmalı");
  return ctx;
}
