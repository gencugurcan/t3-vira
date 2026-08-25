"use client";

import { useState } from "react";
import { useRole } from "@/context/RoleContext";

const ORNEK_SORULAR = [
  "Hangi girişimlerin AI durumu VERI_EKSIK?",
  "En yüksek cirolu 3 girişim hangileri?",
  "Take Off programındaki girişimler hangileri?",
  "Son 3 aydır güncellenmeyen girişimler hangileri?",
];

export default function SorguSayfasi() {
  const { rol } = useRole();

  const [soru, setSoru] = useState("");
  const [cevap, setCevap] = useState<string | null>(null);
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

  async function sor() {
    if (!soru.trim()) return;
    setYukleniyor(true);
    setHata(null);
    setCevap(null);
    try {
      const res = await fetch("/api/sorgu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soru }),
      });
      const veri = await res.json();
      if (!res.ok) {
        throw new Error(veri.error ?? "Sorgu başarısız");
      }
      setCevap(veri.cevap);
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">AI Sorgu</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Ekosistemdeki tüm girişim verisine dayanarak serbest metinle soru sor.
      </p>

      <div className="mt-6 rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
        <textarea
          value={soru}
          onChange={(e) => setSoru(e.target.value)}
          rows={3}
          placeholder="Örn: Kuluçka programında son 3 aydır güncellenmeyen kaç girişim var?"
          className="w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {ORNEK_SORULAR.map((s) => (
            <button
              key={s}
              onClick={() => setSoru(s)}
              className="rounded-full border border-border-subtle bg-background px-3 py-1 text-xs text-foreground-muted hover:bg-surface-2"
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={sor}
          disabled={yukleniyor || !soru.trim()}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {yukleniyor ? "Analiz ediliyor..." : "Sor"}
        </button>

        {hata && (
          <p className="mt-4 rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-danger">
            Hata: {hata}
          </p>
        )}

        {cevap && (
          <div className="mt-4 whitespace-pre-line rounded-lg bg-[var(--accent-soft)] px-4 py-3 text-sm text-foreground">
            {cevap}
          </div>
        )}
      </div>
    </div>
  );
}
