"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

const STORAGE_KEY = "t3-vira-oturum";

interface Oturum {
  girisYapildi: boolean;
  ad: string | null;
}

const BOS_OTURUM: Oturum = { girisYapildi: false, ad: null };

const dinleyiciler = new Set<() => void>();

function bildir() {
  dinleyiciler.forEach((dinle) => dinle());
}

function subscribe(dinle: () => void) {
  dinleyiciler.add(dinle);
  return () => dinleyiciler.delete(dinle);
}

let sonHam: string | null = null;
let sonSnapshot: Oturum = BOS_OTURUM;

function getSnapshot(): Oturum {
  const ham = window.localStorage.getItem(STORAGE_KEY);
  if (ham === sonHam) {
    return sonSnapshot;
  }
  sonHam = ham;
  if (!ham) {
    sonSnapshot = BOS_OTURUM;
    return sonSnapshot;
  }
  try {
    const veri = JSON.parse(ham);
    if (veri && typeof veri.girisYapildi === "boolean") {
      sonSnapshot = veri as Oturum;
      return sonSnapshot;
    }
  } catch {}
  sonSnapshot = BOS_OTURUM;
  return sonSnapshot;
}

function getServerSnapshot(): Oturum {
  return BOS_OTURUM;
}

interface OturumContextValue {
  oturum: Oturum;
  girisYap: (ad: string) => void;
  cikisYap: () => void;
}

const OturumContext = createContext<OturumContextValue | null>(null);

export function OturumProvider({ children }: { children: React.ReactNode }) {
  const oturum = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const girisYap = (ad: string) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ girisYapildi: true, ad }));
    bildir();
  };

  const cikisYap = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    bildir();
  };

  return (
    <OturumContext.Provider value={{ oturum, girisYap, cikisYap }}>
      {children}
    </OturumContext.Provider>
  );
}

export function useOturum() {
  const ctx = useContext(OturumContext);
  if (!ctx) throw new Error("useOturum, OturumProvider içinde kullanılmalı");
  return ctx;
}
