"use client";

import { useState } from "react";
import type { AiDurum } from "@/lib/types";

const AI_DURUM_RENK: Record<string, string> = {
  HAZIR: "bg-green-100 text-green-800",
  IZLEMEDE: "bg-yellow-100 text-yellow-800",
  VERI_EKSIK: "bg-red-100 text-red-800",
};

interface Props {
  girisimId: string;
  initialAiDurum: AiDurum;
  initialAiGerekce: string | null;
}

export function AiDegerlendirme({ girisimId, initialAiDurum, initialAiGerekce }: Props) {
  const [aiDurum, setAiDurum] = useState<AiDurum>(initialAiDurum);
  const [aiGerekce, setAiGerekce] = useState<string | null>(initialAiGerekce);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function degerlendir() {
    setYukleniyor(true);
    setHata(null);
    try {
      const res = await fetch("/api/skor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ girisim_id: girisimId }),
      });
      const veri = await res.json();
      if (!res.ok) {
        throw new Error(veri.error ?? "Değerlendirme başarısız");
      }
      setAiDurum(veri.ai_durum);
      setAiGerekce(veri.ai_gerekce);
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        {aiDurum && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              AI_DURUM_RENK[aiDurum] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            AI: {aiDurum}
          </span>
        )}
        <button
          onClick={degerlendir}
          disabled={yukleniyor}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {yukleniyor ? "Değerlendiriliyor..." : "AI Değerlendirmesi Yap"}
        </button>
      </div>

      {aiGerekce && (
        <p className="mt-2 text-xs text-gray-500">AI gerekçesi: {aiGerekce}</p>
      )}
      {hata && (
        <p className="mt-2 text-xs text-red-600">Hata: {hata}</p>
      )}
    </div>
  );
}
