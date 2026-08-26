"use client";

import { useState } from "react";
import { useRole } from "@/context/RoleContext";
import { AIYanit } from "@/components/AIYanit";
import { supabase } from "@/lib/supabase";
import { useCeviri } from "@/lib/ceviriler";

// Bilerek çevrilmiyor: bu metinler tıklanınca AYNEN /api/sorgu'ya gönderilen
// gerçek sorgu içeriği oluyor (salt bir arayüz etiketi değil) — çevirmek,
// AI'a giden içeriği (ve VERI_EKSIK gibi backend'in beklediği ham değerleri)
// değiştirip fonksiyonel davranışı etkileyebilir.
const ORNEK_SORULAR = [
  "Hangi girişimlerin AI durumu VERI_EKSIK?",
  "En yüksek cirolu 3 girişim hangileri?",
  "Take Off programındaki girişimler hangileri?",
  "Son 3 aydır güncellenmeyen girişimler hangileri?",
];

export default function SorguSayfasi() {
  const t = useCeviri();
  const { rol } = useRole();

  const [soru, setSoru] = useState("");
  const [gonderilenSoru, setGonderilenSoru] = useState<string | null>(null);
  const [cevap, setCevap] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [sabitleniyor, setSabitleniyor] = useState(false);
  const [sabitlendi, setSabitlendi] = useState(false);
  const [sabitlemeHatasi, setSabitlemeHatasi] = useState<string | null>(null);

  if (rol !== "karar_verici" && rol !== "super_admin") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="rounded-lg bg-[var(--warning-soft)] px-4 py-3 text-sm text-warning">
          {t.ortak.sadeceKararVericiSuperAdmin}
        </p>
      </div>
    );
  }

  async function sor() {
    if (!soru.trim()) return;
    setYukleniyor(true);
    setHata(null);
    setCevap(null);
    setGonderilenSoru(soru.trim());
    setSabitlendi(false);
    setSabitlemeHatasi(null);
    try {
      const res = await fetch("/api/sorgu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soru }),
      });
      const veri = await res.json();
      if (!res.ok) {
        throw new Error(veri.error ?? t.sorgu.soruBasarisiz);
      }
      setCevap(veri.cevap);
    } catch (e) {
      setHata(e instanceof Error ? e.message : t.ortak.bilinmeyenHata);
    } finally {
      setYukleniyor(false);
    }
  }

  // Sadece soru metnini panoya (sabitli_sorgular) kaydeder — cevap kaydedilmez,
  // Yönetici Raporu'ndaki kart her açılışta AI'ı yeniden sorgulayıp güncel
  // cevabı gösterir.
  async function panoyaSabitle() {
    if (!gonderilenSoru || sabitleniyor) return;
    setSabitleniyor(true);
    setSabitlemeHatasi(null);
    try {
      const { error } = await supabase
        .from("sabitli_sorgular")
        .insert({ soru_metni: gonderilenSoru });
      if (error) throw new Error(error.message);
      setSabitlendi(true);
    } catch (e) {
      setSabitlemeHatasi(e instanceof Error ? e.message : t.ortak.bilinmeyenHata);
    } finally {
      setSabitleniyor(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">{t.sorgu.baslik}</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        {t.sorgu.aciklama}
      </p>

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {ORNEK_SORULAR.map((s) => (
            <button
              key={s}
              onClick={() => setSoru(s)}
              className="rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-xs text-foreground-muted transition hover:bg-surface-2 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>

        {gonderilenSoru && (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-accent px-4 py-2.5 text-sm text-white">
              {gonderilenSoru}
            </div>
          </div>
        )}

        {yukleniyor && (
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            {t.ortak.analizEdiliyor}
          </div>
        )}

        {hata && (
          <div className="rounded-2xl rounded-bl-sm bg-[var(--danger-soft)] px-4 py-2.5 text-sm text-danger">
            {hata}
          </div>
        )}

        {cevap && (
          <div className="flex items-start gap-2">
            <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
              AI
            </span>
            <div className="relative max-w-[85%] rounded-2xl rounded-tl-sm border border-border-subtle bg-surface px-4 py-3 pr-10 shadow-sm">
              <button
                onClick={panoyaSabitle}
                disabled={sabitleniyor || sabitlendi}
                title={sabitlendi ? t.sorgu.panoyaEklendi : t.sorgu.panoyaSabitle}
                aria-label={sabitlendi ? t.sorgu.panoyaEklendi : t.sorgu.panoyaSabitle}
                className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full transition disabled:cursor-default ${
                  sabitlendi
                    ? "text-success"
                    : "text-foreground-muted hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                {sabitlendi ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                )}
              </button>

              <AIYanit metin={cevap} />

              {sabitlendi && (
                <p className="mt-2 text-xs text-success">{t.sorgu.panoyaEklendi}</p>
              )}
              {sabitlemeHatasi && (
                <p className="mt-2 text-xs text-danger">
                  {t.sorgu.panoyaSabitlenemedi}: {sabitlemeHatasi}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-end gap-2 rounded-2xl border border-border-subtle bg-surface p-2 shadow-sm">
        <textarea
          value={soru}
          onChange={(e) => setSoru(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sor();
            }
          }}
          rows={1}
          placeholder={t.sorgu.yerTutucu}
          className="max-h-32 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none"
        />
        <button
          onClick={sor}
          disabled={yukleniyor || !soru.trim()}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent text-white transition hover:opacity-90 disabled:opacity-40"
          aria-label={t.sorgu.gonder}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
}
