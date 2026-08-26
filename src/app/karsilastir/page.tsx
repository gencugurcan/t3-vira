"use client";

import { useEffect, useState } from "react";
import { useRole } from "@/context/RoleContext";
import { supabase } from "@/lib/supabase";
import { AIYanit } from "@/components/AIYanit";
import type { Girisim } from "@/lib/types";
import type { KarsilastirmaGirisim, KarsilastirmaSonucu } from "@/app/api/karsilastir/route";

const AI_DURUM_RENK: Record<string, string> = {
  HAZIR: "bg-[var(--success-soft)] text-success",
  IZLEMEDE: "bg-[var(--warning-soft)] text-warning",
  VERI_EKSIK: "bg-[var(--danger-soft)] text-danger",
};

function paraFormatla(deger: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(deger);
}

function GirisimKarti({ girisim }: { girisim: KarsilastirmaGirisim }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-foreground">{girisim.ad}</h3>
        {girisim.ai_durum && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              AI_DURUM_RENK[girisim.ai_durum] ?? "bg-surface-2 text-foreground-muted"
            }`}
          >
            AI: {girisim.ai_durum}
          </span>
        )}
      </div>

      <p className="mt-1 text-sm text-foreground-muted">
        {girisim.sektor ?? "Sektör belirtilmemiş"}
        {girisim.kurulus_yili ? ` · ${girisim.kurulus_yili}` : ""}
      </p>

      {girisim.kisa_aciklama && (
        <p className="mt-2 text-sm text-foreground-muted">{girisim.kisa_aciklama}</p>
      )}

      <dl className="mt-4 space-y-2 border-t border-border-subtle pt-4 text-sm">
        <div className="flex items-start justify-between gap-3">
          <dt className="text-foreground-muted">Program(lar)</dt>
          <dd className="text-right text-foreground">
            {girisim.programlar.length > 0 ? girisim.programlar.join(", ") : "-"}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-foreground-muted">Toplam Ciro</dt>
          <dd className="font-medium text-foreground">{paraFormatla(girisim.toplam_ciro)}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-foreground-muted">Son Güncelleme</dt>
          <dd className="text-foreground">{girisim.son_guncelleme ?? "-"}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function KarsilastirSayfasi() {
  const { rol } = useRole();

  const [girisimler, setGirisimler] = useState<Girisim[]>([]);
  const [girisim1Id, setGirisim1Id] = useState("");
  const [girisim2Id, setGirisim2Id] = useState("");
  const [sonuc, setSonuc] = useState<KarsilastirmaSonucu | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    async function girisimleriGetir() {
      const { data, error } = await supabase.from("girisim").select("*").order("ad");
      if (!error) {
        setGirisimler((data ?? []) as Girisim[]);
      }
    }
    girisimleriGetir();
  }, []);

  if (rol !== "karar_verici" && rol !== "super_admin") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="rounded-lg bg-[var(--warning-soft)] px-4 py-3 text-sm text-warning">
          Bu sayfa sadece Karar Verici ve Süper Admin rolleri içindir.
        </p>
      </div>
    );
  }

  async function karsilastir() {
    if (!girisim1Id || !girisim2Id) return;
    setYukleniyor(true);
    setHata(null);
    setSonuc(null);
    try {
      const res = await fetch("/api/karsilastir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ girisim1Id, girisim2Id }),
      });
      const veri = await res.json();
      if (!res.ok) {
        throw new Error(veri.error ?? "Karşılaştırma başarısız");
      }
      setSonuc(veri as KarsilastirmaSonucu);
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally {
      setYukleniyor(false);
    }
  }

  // Seçilen girişim diğer dropdown'da görünmesin — aynı girişim kendisiyle
  // karşılaştırılamaz.
  const girisim1Secenekleri = girisimler.filter((g) => g.id !== girisim2Id);
  const girisim2Secenekleri = girisimler.filter((g) => g.id !== girisim1Id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">Karşılaştır</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        İki girişimi seçip AI destekli, gerekçeli bir karşılaştırma alın.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground-muted">
            1. Girişim
          </label>
          <select
            value={girisim1Id}
            onChange={(e) => setGirisim1Id(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
          >
            <option value="">Seçin...</option>
            {girisim1Secenekleri.map((g) => (
              <option key={g.id} value={g.id}>
                {g.ad}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-muted">
            2. Girişim
          </label>
          <select
            value={girisim2Id}
            onChange={(e) => setGirisim2Id(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
          >
            <option value="">Seçin...</option>
            {girisim2Secenekleri.map((g) => (
              <option key={g.id} value={g.id}>
                {g.ad}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={karsilastir}
          disabled={!girisim1Id || !girisim2Id || yukleniyor}
          className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 sm:col-span-2"
        >
          {yukleniyor ? "Karşılaştırılıyor..." : "Karşılaştır"}
        </button>
      </div>

      {hata && (
        <p className="mt-4 rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-danger">
          Hata: {hata}
        </p>
      )}

      {sonuc && (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GirisimKarti girisim={sonuc.girisim1} />
            <GirisimKarti girisim={sonuc.girisim2} />
          </div>

          <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
              AI Değerlendirmesi
            </h2>
            <div className="mt-3">
              <AIYanit metin={sonuc.yorum} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
