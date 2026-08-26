"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRole } from "@/context/RoleContext";
import { supabase } from "@/lib/supabase";
import { useCeviri, ceviriler } from "@/lib/ceviriler";
import { useDil } from "@/context/DilContext";
import { useDokulmeVariants } from "@/lib/dokulme";
import type { Girisim, GirisimBekleyenVeri } from "@/lib/types";

type CeviriSozlugu = typeof ceviriler.tr;

function alanEtiketleri(t: CeviriSozlugu): Record<keyof GirisimBekleyenVeri, string> {
  return {
    ad: t.onay.ad,
    sektor: t.onay.sektor,
    kisa_aciklama: t.onay.kisaAciklama,
    ekip_buyuklugu: t.onay.ekipBuyuklugu,
    teknoloji: t.onay.teknoloji,
  };
}

function alanGoster(deger: unknown, bosMetni: string): string {
  if (deger === null || deger === undefined || deger === "") return bosMetni;
  if (Array.isArray(deger)) return deger.length ? deger.join(", ") : bosMetni;
  return String(deger);
}

interface AlanFarki {
  alan: string;
  eski: string;
  yeni: string;
}

// Canlı (onaylı) alanlarla startup'ın gönderdiği taslağı karşılaştırıp
// sadece gerçekten değişen alanları döndürür — admin ekranında "ne değişti"
// sorusuna doğrudan cevap vermek için.
function degisenAlanlar(g: Girisim, t: CeviriSozlugu): AlanFarki[] {
  const taslak = g.bekleyen_veri;
  if (!taslak) return [];
  const etiketler = alanEtiketleri(t);
  const sonuc: AlanFarki[] = [];
  (Object.keys(etiketler) as (keyof GirisimBekleyenVeri)[]).forEach((anahtar) => {
    if (!(anahtar in taslak)) return;
    const eski = alanGoster(g[anahtar as keyof Girisim], t.onay.bos);
    const yeni = alanGoster(taslak[anahtar], t.onay.bos);
    if (eski !== yeni) {
      sonuc.push({ alan: etiketler[anahtar], eski, yeni });
    }
  });
  return sonuc;
}

export default function OnaySayfasi() {
  const t = useCeviri();
  const { dil } = useDil();
  const { rol } = useRole();
  const { baslik, liste, oge } = useDokulmeVariants();

  const [girisimler, setGirisimler] = useState<Girisim[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [islemdeId, setIslemdeId] = useState<string | null>(null);

  const [ozetler, setOzetler] = useState<Record<string, string>>({});
  const [ozetYukleniyor, setOzetYukleniyor] = useState<Record<string, boolean>>({});
  const [ozetHata, setOzetHata] = useState<Record<string, string>>({});

  useEffect(() => {
    if (rol !== "super_admin") return;
    kuyruguGetir();
  }, [rol]);

  async function kuyruguGetir() {
    setYukleniyor(true);
    const { data, error } = await supabase
      .from("girisim")
      .select("*")
      .eq("durum", "onay_bekliyor")
      .order("son_guncelleme", { ascending: false });

    if (error) {
      setHata(error.message);
    } else {
      setGirisimler(data as Girisim[]);
    }
    setYukleniyor(false);
  }

  // Onayla: bekleyen_veri'deki taslak alanları canlı kolonlara uygular,
  // taslağı temizler ve durumu onaylıya çeker.
  async function onayla(g: Girisim) {
    setIslemdeId(g.id);
    setHata(null);

    const taslak = g.bekleyen_veri;
    const guncelleme: Record<string, unknown> = {
      durum: "onayli",
      bekleyen_veri: null,
    };
    if (taslak) {
      (Object.keys(taslak) as (keyof GirisimBekleyenVeri)[]).forEach((anahtar) => {
        guncelleme[anahtar] = taslak[anahtar];
      });
      guncelleme.son_guncelleme = new Date().toISOString().slice(0, 10);
    }

    const { error } = await supabase.from("girisim").update(guncelleme).eq("id", g.id);

    if (error) {
      setHata(error.message);
    } else {
      setGirisimler((prev) => prev.filter((x) => x.id !== g.id));
    }
    setIslemdeId(null);
  }

  // Reddet: taslağı ATMADAN önce canlıya hiç yansıtmaz, sadece bekleyen_veri'yi
  // temizleyip girişimi son onaylı haline döndürür. (Not: şema sadece
  // onayli/onay_bekliyor durumlarını destekliyor; taslaksız - ör. ilk kayıttan
  // beri onay bekleyen - bir girişimi reddetmek de onu "onaylı" durumuna
  // çeker, çünkü geri dönülecek ayrı bir "reddedildi" durumu yok. Bu MVP için
  // bilinçli bir sadeleştirme.)
  async function reddet(g: Girisim) {
    setIslemdeId(g.id);
    setHata(null);

    const { error } = await supabase
      .from("girisim")
      .update({ durum: "onayli", bekleyen_veri: null })
      .eq("id", g.id);

    if (error) {
      setHata(error.message);
    } else {
      setGirisimler((prev) => prev.filter((x) => x.id !== g.id));
    }
    setIslemdeId(null);
  }

  async function ozetGetir(id: string) {
    setOzetYukleniyor((prev) => ({ ...prev, [id]: true }));
    setOzetHata((prev) => {
      const yeni = { ...prev };
      delete yeni[id];
      return yeni;
    });

    try {
      const res = await fetch("/api/onay-ozeti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ girisim_id: id, dil }),
      });
      const veri = await res.json();
      if (!res.ok) {
        throw new Error(veri.error ?? t.onay.ozetAlinamadi);
      }
      setOzetler((prev) => ({ ...prev, [id]: veri.ozet }));
    } catch (e) {
      setOzetHata((prev) => ({
        ...prev,
        [id]: e instanceof Error ? e.message : t.ortak.bilinmeyenHata,
      }));
    } finally {
      setOzetYukleniyor((prev) => ({ ...prev, [id]: false }));
    }
  }

  if (rol !== "super_admin") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="rounded-lg bg-[var(--warning-soft)] px-4 py-3 text-sm text-warning">
          {t.ortak.sadeceSuperAdmin}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <motion.div variants={baslik} initial="hidden" animate="visible">
        <h1 className="text-2xl font-bold text-foreground">{t.onay.baslik}</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {t.onay.aciklama}
        </p>
      </motion.div>

      {yukleniyor && <p className="mt-6 text-sm text-foreground-muted">{t.ortak.yukleniyor}</p>}

      {hata && (
        <p className="mt-6 rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-danger">
          {t.ortak.hata}: {hata}
        </p>
      )}

      {!yukleniyor && girisimler.length === 0 && !hata && (
        <p className="mt-6 text-sm text-foreground-muted">{t.onay.bosDurum}</p>
      )}

      <motion.div variants={liste} initial="hidden" animate="visible" className="mt-6 space-y-3">
        <AnimatePresence>
          {girisimler.map((g) => (
            <motion.div
              key={g.id}
              variants={oge}
              initial="hidden"
              exit="exit"
              className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm"
            >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground">{g.ad}</p>
                <p className="text-sm text-foreground-muted">
                  {(dil === "en" ? (g.sektor_en ?? g.sektor) : g.sektor) ?? t.onay.sektorBelirtilmemis}
                  {g.son_guncelleme ? ` · ${t.onay.guncelleme}: ${g.son_guncelleme}` : ""}
                </p>
                {(dil === "en" ? (g.kisa_aciklama_en ?? g.kisa_aciklama) : g.kisa_aciklama) && (
                  <p className="mt-1 text-sm text-foreground-muted">
                    {dil === "en" ? (g.kisa_aciklama_en ?? g.kisa_aciklama) : g.kisa_aciklama}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => ozetGetir(g.id)}
                  disabled={ozetYukleniyor[g.id]}
                  className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {ozetYukleniyor[g.id] ? t.ortak.analizEdiliyor : t.onay.aiOnayOzeti}
                </button>
                <button
                  onClick={() => onayla(g)}
                  disabled={islemdeId === g.id}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {t.onay.onayla}
                </button>
                <button
                  onClick={() => reddet(g)}
                  disabled={islemdeId === g.id}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {t.onay.reddet}
                </button>
              </div>
            </div>

            {degisenAlanlar(g, t).length > 0 && (
              <div className="mt-3 rounded-lg border border-border-subtle bg-[var(--warning-soft)] px-3 py-2">
                <p className="text-xs font-semibold uppercase text-warning">
                  {t.onay.onerilenDegisiklikler}
                </p>
                <ul className="mt-1 space-y-1">
                  {degisenAlanlar(g, t).map((fark) => (
                    <li key={fark.alan} className="text-sm text-foreground">
                      <span className="font-medium">{fark.alan}:</span>{" "}
                      <span className="line-through opacity-60">{fark.eski}</span>{" "}
                      → <span className="font-medium">{fark.yeni}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {ozetler[g.id] && (
              <div className="mt-3 whitespace-pre-line rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-sm text-foreground">
                {ozetler[g.id]}
              </div>
            )}
            {ozetHata[g.id] && (
              <p className="mt-2 text-xs text-danger">
                {t.ortak.hata}: {ozetHata[g.id]}
              </p>
            )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
