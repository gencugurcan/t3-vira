"use client";

import { useEffect, useState } from "react";
import { useRole } from "@/context/RoleContext";
import { AIYanit } from "@/components/AIYanit";
import { supabase } from "@/lib/supabase";
import { useCeviri } from "@/lib/ceviriler";
import { useDil } from "@/context/DilContext";
import type { SabitliSorgu } from "@/lib/types";

// Sabitlenmiş bir sorunun kartı: kendi sorusunu AI Sorgu'nun kullandığı
// AYNI /api/sorgu endpoint'iyle her açılışta yeniden sorgular (cevap
// sabitli_sorgular'da SAKLANMAZ, sadece soru metni saklanır).
function SabitliSoruKarti({
  soru,
  onKaldir,
}: {
  soru: SabitliSorgu;
  onKaldir: (id: string) => void;
}) {
  const [cevap, setCevap] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [kaldiriliyor, setKaldiriliyor] = useState(false);
  // "Yenile" butonu bunu artırarak aşağıdaki effect'i (dependency'si
  // değiştiği için) tekrar tetikler — sayfa çevresinde kullanılan
  // "mount'ta veri çek" desenini bozmadan yeniden sorgulama sağlar.
  const [tetikleyici, setTetikleyici] = useState(0);
  const t = useCeviri();
  const { dil } = useDil();

  useEffect(() => {
    async function cevabiGetir() {
      try {
        const res = await fetch("/api/sorgu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ soru: soru.soru_metni, dil }),
        });
        const veri = await res.json();
        if (!res.ok) throw new Error(veri.error ?? t.sorgu.soruBasarisiz);
        setCevap(veri.cevap);
      } catch (e) {
        setHata(e instanceof Error ? e.message : t.ortak.bilinmeyenHata);
      } finally {
        setYukleniyor(false);
      }
    }
    cevabiGetir();
  }, [soru.soru_metni, tetikleyici, dil]);

  function yenile() {
    setYukleniyor(true);
    setHata(null);
    setCevap(null);
    setTetikleyici((n) => n + 1);
  }

  async function kaldir() {
    setKaldiriliyor(true);
    try {
      const { error } = await supabase
        .from("sabitli_sorgular")
        .delete()
        .eq("id", soru.id);
      if (error) throw new Error(error.message);
      onKaldir(soru.id);
    } catch (e) {
      setKaldiriliyor(false);
      setHata(e instanceof Error ? e.message : t.rapor.kaldirilamadi);
    }
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{soru.soru_metni}</p>

        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            onClick={yenile}
            disabled={yukleniyor}
            title={t.rapor.yenile}
            aria-label={t.rapor.yenile}
            className="flex h-7 w-7 items-center justify-center rounded-full text-foreground-muted transition hover:bg-surface-2 hover:text-foreground disabled:opacity-40"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={yukleniyor ? "animate-spin" : ""}
            >
              <path d="M4 12a8 8 0 0 1 8-8 8 8 0 0 1 6.93 4" />
              <polyline points="19 4 19 8 15 8" />
              <path d="M20 12a8 8 0 0 1-8 8 8 8 0 0 1-6.93-4" />
              <polyline points="5 20 5 16 9 16" />
            </svg>
          </button>

          <button
            onClick={kaldir}
            disabled={kaldiriliyor}
            title={t.rapor.kaldir}
            aria-label={t.rapor.kaldir}
            className="flex h-7 w-7 items-center justify-center rounded-full text-foreground-muted transition hover:bg-[var(--danger-soft)] hover:text-danger disabled:opacity-40"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-3 border-t border-border-subtle pt-3">
        {yukleniyor && (
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            {t.ortak.analizEdiliyor}
          </div>
        )}

        {hata && !yukleniyor && (
          <p className="text-sm text-danger">
            {t.ortak.hata}: {hata}
          </p>
        )}

        {!yukleniyor && !hata && cevap && <AIYanit metin={cevap} />}
      </div>
    </div>
  );
}

export default function RaporSayfasi() {
  const t = useCeviri();
  const { rol } = useRole();
  const { dil } = useDil();

  const [rapor, setRapor] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const [sabitliSorular, setSabitliSorular] = useState<SabitliSorgu[]>([]);
  const [sabitliYukleniyor, setSabitliYukleniyor] = useState(true);
  const [sabitliHata, setSabitliHata] = useState<string | null>(null);

  useEffect(() => {
    // NOT: setSabitliYukleniyor(true) burada YOK — bu effect sadece mount'ta
    // bir kez çalışıyor ve başlangıç değeri zaten true (bkz. useState(true)),
    // effect içinde ilk await'ten önce senkron setState çağrısı olmamalı.
    async function sabitliSorulariGetir() {
      const { data, error } = await supabase
        .from("sabitli_sorgular")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        setSabitliHata(error.message);
      } else {
        setSabitliSorular((data ?? []) as SabitliSorgu[]);
      }
      setSabitliYukleniyor(false);
    }
    sabitliSorulariGetir();
  }, []);

  function sabitliSoruKaldirildi(id: string) {
    setSabitliSorular((onceki) => onceki.filter((s) => s.id !== id));
  }

  if (rol !== "karar_verici" && rol !== "super_admin") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="rounded-lg bg-[var(--warning-soft)] px-4 py-3 text-sm text-warning">
          {t.ortak.sadeceKararVericiSuperAdmin}
        </p>
      </div>
    );
  }

  async function raporOlustur() {
    setYukleniyor(true);
    setHata(null);
    setRapor(null);
    try {
      const res = await fetch("/api/rapor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dil }),
      });
      const veri = await res.json();
      if (!res.ok) {
        throw new Error(veri.error ?? t.rapor.raporOlusturulamadi);
      }
      setRapor(veri.rapor);
    } catch (e) {
      setHata(e instanceof Error ? e.message : t.ortak.bilinmeyenHata);
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">{t.rapor.baslik}</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        {t.rapor.aciklama}
      </p>

      <div className="mt-6 rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
        <button
          onClick={raporOlustur}
          disabled={yukleniyor}
          className="w-full rounded-lg bg-accent px-4 py-3 text-base font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {yukleniyor ? t.rapor.raporHazirlaniyor : t.rapor.raporOlusturButonu}
        </button>

        {hata && (
          <p className="mt-4 rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-danger">
            {t.ortak.hata}: {hata}
          </p>
        )}

        {rapor && (
          <div className="mt-6 rounded-lg bg-background px-4 py-4">
            <AIYanit metin={rapor} />
          </div>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-bold text-foreground">{t.rapor.sabitlenmisSorularBaslik}</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          {t.rapor.sabitlenmisSorularAciklama}
        </p>

        <div className="mt-4 space-y-4">
          {sabitliYukleniyor && (
            <p className="text-sm text-foreground-muted">{t.ortak.yukleniyor}</p>
          )}

          {sabitliHata && !sabitliYukleniyor && (
            <p className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-danger">
              {t.rapor.sabitliSorularAlinamadi}: {sabitliHata}
            </p>
          )}

          {!sabitliYukleniyor && !sabitliHata && sabitliSorular.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border-subtle bg-surface px-4 py-6 text-center text-sm text-foreground-muted">
              {t.rapor.bosDurum}
            </p>
          )}

          {sabitliSorular.map((s) => (
            <SabitliSoruKarti key={s.id} soru={s} onKaldir={sabitliSoruKaldirildi} />
          ))}
        </div>
      </div>
    </div>
  );
}
