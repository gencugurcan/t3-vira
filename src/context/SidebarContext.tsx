"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

const STORAGE_KEY = "t3-vira-sidebar";

// Kenar çubuğu açık/kapalı tercihini localStorage'da tutuyoruz; TemaContext
// ile BİREBİR AYNI desen — useSyncExternalStore ile harici bir store,
// "effect içinde setState" kuralına takılmadan SSR/hydration ile
// localStorage'ı güvenle karıştırıyor.
const dinleyiciler = new Set<() => void>();

function bildir() {
  dinleyiciler.forEach((dinle) => dinle());
}

function subscribe(dinle: () => void) {
  dinleyiciler.add(dinle);
  return () => dinleyiciler.delete(dinle);
}

function getSnapshot(): boolean {
  const kayitli = window.localStorage.getItem(STORAGE_KEY);
  // Kayıt yoksa varsayılan: açık.
  return kayitli === null ? true : kayitli === "acik";
}

function getServerSnapshot(): boolean {
  return true;
}

interface SidebarContextValue {
  acik: boolean;
  sidebarDegistir: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const acik = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const sidebarDegistir = () => {
    const yeni = !acik;
    window.localStorage.setItem(STORAGE_KEY, yeni ? "acik" : "kapali");
    bildir();
  };

  return (
    <SidebarContext.Provider value={{ acik, sidebarDegistir }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar, SidebarProvider içinde kullanılmalı");
  return ctx;
}
