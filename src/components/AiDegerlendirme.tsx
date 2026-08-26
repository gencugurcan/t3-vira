"use client";

import { useState } from "react";
import { AiDurumRozeti } from "@/components/Rozet";
import { useCeviri } from "@/lib/ceviriler";
import { useDil } from "@/context/DilContext";
import type { AiDurum } from "@/lib/types";

interface Props {
  girisimId: string;
  initialAiDurum: AiDurum;
  initialAiGerekce: string | null;
}

export function AiDegerlendirme({ girisimId, initialAiDurum, initialAiGerekce }: Props) {
  const t = useCeviri();
  const { dil } = useDil();
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
        body: JSON.stringify({ girisim_id: girisimId, dil }),
      });
      const veri = await res.json();
      if (!res.ok) {
        throw new Error(veri.error ?? t.girisimDetay.degerlendirmeBasarisiz);
      }
      setAiDurum(veri.ai_durum);
      setAiGerekce(veri.ai_gerekce);
    } catch (e) {
      setHata(e instanceof Error ? e.message : t.girisimDetay.degerlendirmeBasarisiz);
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className="mt-4 border-t border-border-subtle pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <AiDurumRozeti aiDurum={aiDurum} />
        <button
          onClick={degerlendir}
          disabled={yukleniyor}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {yukleniyor ? t.girisimDetay.degerlendiriliyor : t.girisimDetay.aiDegerlendirmesiYap}
        </button>
      </div>

      {aiGerekce && (
        <p className="mt-2 text-xs text-foreground-muted">
          {t.girisimDetay.aiGerekcesi}: {aiGerekce}
        </p>
      )}
      {hata && (
        <p className="mt-2 text-xs text-danger">
          {t.girisimDetay.hata}: {hata}
        </p>
      )}
    </div>
  );
}
