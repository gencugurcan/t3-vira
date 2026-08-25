"use client";

import { useState } from "react";
import { useRole } from "@/context/RoleContext";

function RaporGoster({ metin }: { metin: string }) {
  const satirlar = metin.split("\n");

  return (
    <div className="space-y-2">
      {satirlar.map((satir, i) => {
        const temiz = satir.trim();

        if (temiz.startsWith("### ")) {
          return (
            <h3 key={i} className="mt-4 text-base font-semibold text-foreground">
              {temiz.slice(4)}
            </h3>
          );
        }
        if (temiz.startsWith("## ") || /^\d+\.\s/.test(temiz)) {
          return (
            <h2 key={i} className="mt-5 text-lg font-bold text-foreground">
              {temiz.replace(/^##\s/, "").replace(/^\d+\.\s/, "")}
            </h2>
          );
        }
        if (temiz.startsWith("- ") || temiz.startsWith("* ")) {
          return (
            <li key={i} className="ml-4 list-disc text-sm text-foreground-muted">
              {temiz.slice(2).replace(/\*\*/g, "")}
            </li>
          );
        }
        if (temiz === "") {
          return <div key={i} className="h-1" />;
        }
        return (
          <p key={i} className="text-sm text-foreground-muted">
            {temiz.replace(/\*\*/g, "")}
          </p>
        );
      })}
    </div>
  );
}

export default function RaporSayfasi() {
  const { rol } = useRole();

  const [rapor, setRapor] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  if (rol !== "karar_verici" && rol !== "super_admin") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="rounded-lg bg-[var(--warning-soft)] px-4 py-3 text-sm text-warning">
          Bu sayfa sadece Karar Verici ve Süper Admin rolleri içindir.
        </p>
      </div>
    );
  }

  async function raporOlustur() {
    setYukleniyor(true);
    setHata(null);
    setRapor(null);
    try {
      const res = await fetch("/api/rapor", { method: "POST" });
      const veri = await res.json();
      if (!res.ok) {
        throw new Error(veri.error ?? "Rapor oluşturulamadı");
      }
      setRapor(veri.rapor);
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">Yönetici Raporu</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Ekosistemin güncel durumunu özetleyen AI destekli rapor.
      </p>

      <div className="mt-6 rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
        <button
          onClick={raporOlustur}
          disabled={yukleniyor}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {yukleniyor ? "Rapor hazırlanıyor..." : "Rapor Oluştur"}
        </button>

        {hata && (
          <p className="mt-4 rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-danger">
            Hata: {hata}
          </p>
        )}

        {rapor && (
          <div className="mt-6 rounded-lg bg-background px-4 py-4">
            <RaporGoster metin={rapor} />
          </div>
        )}
      </div>
    </div>
  );
}
