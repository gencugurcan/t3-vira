"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

const STORAGE_KEY = "t3-vira-dil";

export type Dil = "tr" | "en";

function gecerliDilMi(deger: string | null): deger is Dil {
  return deger === "tr" || deger === "en";
}

// TemaContext ile BİREBİR AYNI desen — useSyncExternalStore ile harici bir
// store, localStorage'ı SSR/hydration ile güvenle karıştırıyor.
const dinleyiciler = new Set<() => void>();

function bildir() {
  dinleyiciler.forEach((dinle) => dinle());
}

function subscribe(dinle: () => void) {
  dinleyiciler.add(dinle);
  return () => dinleyiciler.delete(dinle);
}

function getSnapshot(): Dil {
  const kayitli = window.localStorage.getItem(STORAGE_KEY);
  return gecerliDilMi(kayitli) ? kayitli : "tr";
}

function getServerSnapshot(): Dil {
  return "tr";
}

interface DilContextValue {
  dil: Dil;
  dilDegistir: () => void;
}

const DilContext = createContext<DilContextValue | null>(null);

export function DilProvider({ children }: { children: React.ReactNode }) {
  const dil = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const dilDegistir = () => {
    const yeni: Dil = dil === "tr" ? "en" : "tr";
    window.localStorage.setItem(STORAGE_KEY, yeni);
    bildir();
  };

  return (
    <DilContext.Provider value={{ dil, dilDegistir }}>
      {children}
    </DilContext.Provider>
  );
}

export function useDil() {
  const ctx = useContext(DilContext);
  if (!ctx) throw new Error("useDil, DilProvider içinde kullanılmalı");
  return ctx;
}
