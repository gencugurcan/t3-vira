"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { AiDurumRozeti, DurumRozeti, GIRISIM_DURUM_BILGISI } from "@/components/Rozet";
import type { Girisim, GirisimDurum, Program } from "@/lib/types";

const MotionLink = motion.create(Link);

type SiralamaAlani = "ad" | "yil";
type SiralamaYonu = "artan" | "azalan";

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function IconTag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3H4a1 1 0 0 0-1 1v5.59a2 2 0 0 0 .59 1.41l9.58 9.59a2 2 0 0 0 2.83 0l4.59-4.59a2 2 0 0 0 0-2.83Z" />
      <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconLayers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}
function IconArrowDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}
function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function AnaSayfa() {
  const azaltilmisHareket = useReducedMotion();

  const baslikVariants = {
    hidden: azaltilmisHareket ? { opacity: 1 } : { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: azaltilmisHareket ? 0 : 0.4 },
    },
  };

  const filtreVariants = {
    hidden: azaltilmisHareket ? { opacity: 1 } : { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: azaltilmisHareket ? 0 : 0.4, delay: azaltilmisHareket ? 0 : 0.1 },
    },
  };

  const gridVariants = {
    hidden: {},
    visible: {
      transition: azaltilmisHareket
        ? {}
        : { staggerChildren: 0.08, delayChildren: 0.2 },
    },
  };

  const kartVariants = {
    hidden: azaltilmisHareket ? { opacity: 1 } : { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: azaltilmisHareket ? 0 : 0.4 },
    },
    exit: {
      opacity: azaltilmisHareket ? 1 : 0,
      scale: azaltilmisHareket ? 1 : 0.95,
      transition: { duration: azaltilmisHareket ? 0 : 0.3 },
    },
  };

  const [girisimler, setGirisimler] = useState<Girisim[]>([]);
  const [programlar, setProgramlar] = useState<Program[]>([]);
  const [girisimProgramMap, setGirisimProgramMap] = useState<
    Record<string, string[]>
  >({});
  const [arama, setArama] = useState("");
  const [sektorFiltre, setSektorFiltre] = useState<string>("");
  const [programFiltre, setProgramFiltre] = useState<string>("");
  const [durumFiltre, setDurumFiltre] = useState<GirisimDurum | "">("");
  const [siralamaAlani, setSiralamaAlani] = useState<SiralamaAlani>("ad");
  const [siralamaYonu, setSiralamaYonu] = useState<SiralamaYonu>("artan");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    async function veriyiGetir() {
      setYukleniyor(true);
      const [girisimRes, programRes, gecmisRes] = await Promise.all([
        supabase.from("girisim").select("*").order("ad"),
        supabase.from("program").select("*").order("ad"),
        supabase.from("girisim_program_gecmisi").select("girisim_id, program_id"),
      ]);

      if (girisimRes.error) {
        setHata(girisimRes.error.message);
      } else {
        setGirisimler(girisimRes.data as Girisim[]);
      }

      if (!programRes.error) {
        setProgramlar(programRes.data as Program[]);
      }

      if (!gecmisRes.error) {
        const harita: Record<string, string[]> = {};
        for (const kayit of gecmisRes.data ?? []) {
          const gid = kayit.girisim_id as string;
          const pid = kayit.program_id as string;
          if (!harita[gid]) harita[gid] = [];
          harita[gid].push(pid);
        }
        setGirisimProgramMap(harita);
      }

      setYukleniyor(false);
    }
    veriyiGetir();
  }, []);

  const sektorler = useMemo(
    () =>
      Array.from(new Set(girisimler.map((g) => g.sektor).filter(Boolean))) as string[],
    [girisimler],
  );

  const filtrelenmis = useMemo(() => {
    const aramaTerimi = arama.trim().toLocaleLowerCase("tr");
    return girisimler.filter((g) => {
      const aramaUyum =
        !aramaTerimi ||
        g.ad.toLocaleLowerCase("tr").includes(aramaTerimi) ||
        (g.kisa_aciklama ?? "").toLocaleLowerCase("tr").includes(aramaTerimi);
      const sektorUyum = !sektorFiltre || g.sektor === sektorFiltre;
      const programUyum =
        !programFiltre ||
        (girisimProgramMap[g.id]?.includes(programFiltre) ?? false);
      const durumUyum = !durumFiltre || g.durum === durumFiltre;
      return aramaUyum && sektorUyum && programUyum && durumUyum;
    });
  }, [girisimler, arama, sektorFiltre, programFiltre, durumFiltre, girisimProgramMap]);

  const gosterilecekler = useMemo(() => {
    const kopya = [...filtrelenmis];
    kopya.sort((a, b) => {
      const fark =
        siralamaAlani === "ad"
          ? a.ad.localeCompare(b.ad, "tr")
          : (a.kurulus_yili ?? 0) - (b.kurulus_yili ?? 0);
      return siralamaYonu === "artan" ? fark : -fark;
    });
    return kopya;
  }, [filtrelenmis, siralamaAlani, siralamaYonu]);

  const toplamGirisim = girisimler.length;
  const onayliSayisi = girisimler.filter((g) => g.durum === "onayli").length;
  const bekleyenSayisi = girisimler.filter((g) => g.durum === "onay_bekliyor").length;

  function durumKutusunaTikla(hedef: GirisimDurum | "") {
    setDurumFiltre((mevcut) => (mevcut === hedef ? "" : hedef));
  }

  const programAdi = (id: string) => programlar.find((p) => p.id === id)?.ad ?? "";

  const aktifFiltreler: { anahtar: string; etiket: string; kaldir: () => void }[] = [];
  if (arama.trim()) {
    aktifFiltreler.push({
      anahtar: "arama",
      etiket: `Arama: "${arama.trim()}"`,
      kaldir: () => setArama(""),
    });
  }
  if (sektorFiltre) {
    aktifFiltreler.push({
      anahtar: "sektor",
      etiket: `Sektör: ${sektorFiltre}`,
      kaldir: () => setSektorFiltre(""),
    });
  }
  if (programFiltre) {
    aktifFiltreler.push({
      anahtar: "program",
      etiket: `Program: ${programAdi(programFiltre)}`,
      kaldir: () => setProgramFiltre(""),
    });
  }
  if (durumFiltre) {
    aktifFiltreler.push({
      anahtar: "durum",
      etiket: `Durum: ${GIRISIM_DURUM_BILGISI[durumFiltre].etiket}`,
      kaldir: () => setDurumFiltre(""),
    });
  }

  function tumunuTemizle() {
    setArama("");
    setSektorFiltre("");
    setProgramFiltre("");
    setDurumFiltre("");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <motion.div
        variants={baslikVariants}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden rounded-3xl border border-border-subtle bg-surface p-8"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-accent-2/10 blur-3xl" />
        <div className="relative">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Girişimler
          </h1>
          <p className="mt-2 max-w-xl text-sm text-foreground-muted">
            Ekosistemdeki tüm girişimleri görüntüle ve filtrele.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setDurumFiltre("")}
              className={`rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                durumFiltre === ""
                  ? "border-accent/60 bg-accent-soft ring-1 ring-accent/40"
                  : "border-border-subtle bg-surface-2 hover:border-accent/30"
              }`}
            >
              <p className="text-2xl font-semibold text-foreground">{toplamGirisim}</p>
              <p className="text-xs text-foreground-muted">Toplam Girişim</p>
            </button>
            <button
              type="button"
              onClick={() => durumKutusunaTikla("onayli")}
              className={`rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                durumFiltre === "onayli"
                  ? "border-success/60 bg-[var(--success-soft)] ring-1 ring-success/40"
                  : "border-border-subtle bg-surface-2 hover:border-success/30"
              }`}
            >
              <p className="text-2xl font-semibold text-success">{onayliSayisi}</p>
              <p className="text-xs text-foreground-muted">Onaylı</p>
            </button>
            <button
              type="button"
              onClick={() => durumKutusunaTikla("onay_bekliyor")}
              className={`rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                durumFiltre === "onay_bekliyor"
                  ? "border-warning/60 bg-[var(--warning-soft)] ring-1 ring-warning/40"
                  : "border-border-subtle bg-surface-2 hover:border-warning/30"
              }`}
            >
              <p className="text-2xl font-semibold text-warning">{bekleyenSayisi}</p>
              <p className="text-xs text-foreground-muted">Onay Bekliyor</p>
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div variants={filtreVariants} initial="hidden" animate="visible" className="mt-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Girişim adı veya açıklamada ara..."
              className="w-full rounded-xl border border-border-subtle bg-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="relative">
            <IconTag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
            <select
              value={sektorFiltre}
              onChange={(e) => setSektorFiltre(e.target.value)}
              className={`appearance-none rounded-xl border py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-accent ${
                sektorFiltre
                  ? "border-accent/50 bg-accent-soft text-foreground"
                  : "border-border-subtle bg-surface text-foreground"
              }`}
            >
              <option value="">Tüm sektörler</option>
              {sektorler.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <IconLayers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
            <select
              value={programFiltre}
              onChange={(e) => setProgramFiltre(e.target.value)}
              className={`appearance-none rounded-xl border py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-accent ${
                programFiltre
                  ? "border-accent/50 bg-accent-soft text-foreground"
                  : "border-border-subtle bg-surface text-foreground"
              }`}
            >
              <option value="">Tüm programlar</option>
              {programlar.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.ad}
                </option>
              ))}
            </select>
          </div>

          <div className="flex overflow-hidden rounded-xl border border-border-subtle bg-surface">
            <select
              value={siralamaAlani}
              onChange={(e) => setSiralamaAlani(e.target.value as SiralamaAlani)}
              className="appearance-none bg-transparent py-2 pl-3 pr-7 text-sm text-foreground focus:outline-none"
              aria-label="Sıralama alanı"
            >
              <option value="ad">Ada göre</option>
              <option value="yil">Yıla göre</option>
            </select>
            <button
              type="button"
              onClick={() =>
                setSiralamaYonu((y) => (y === "artan" ? "azalan" : "artan"))
              }
              title={siralamaYonu === "artan" ? "Artan sıralama" : "Azalan sıralama"}
              aria-label={siralamaYonu === "artan" ? "Artan sıralama" : "Azalan sıralama"}
              className="flex items-center justify-center border-l border-border-subtle px-2.5 text-foreground-muted transition hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <IconArrowDown
                className={`h-4 w-4 transition-transform ${siralamaYonu === "artan" ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        {aktifFiltreler.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {aktifFiltreler.map((f) => (
              <button
                key={f.anahtar}
                type="button"
                onClick={f.kaldir}
                className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-2 py-1 pl-3 pr-2 text-xs text-foreground-muted transition hover:border-accent/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {f.etiket}
                <IconX className="h-3 w-3" />
              </button>
            ))}
            <button
              type="button"
              onClick={tumunuTemizle}
              className="text-xs font-medium text-accent hover:underline"
            >
              Tümünü temizle
            </button>
          </div>
        )}
      </motion.div>

      {yukleniyor && (
        <p className="mt-6 text-sm text-foreground-muted">Yükleniyor...</p>
      )}

      {hata && (
        <p className="mt-6 text-sm text-danger">
          Veri alınamadı: {hata}
        </p>
      )}

      {!yukleniyor && !hata && gosterilecekler.length === 0 && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border-subtle bg-surface px-6 py-14 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-foreground-muted">
            <IconSearch className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium text-foreground">
            Bu filtreye uygun girişim bulunamadı.
          </p>
          {aktifFiltreler.length > 0 && (
            <button
              type="button"
              onClick={tumunuTemizle}
              className="text-sm font-medium text-accent hover:underline"
            >
              Filtreleri temizle
            </button>
          )}
        </div>
      )}

      <motion.div
        variants={gridVariants}
        initial="hidden"
        animate="visible"
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence>
          {gosterilecekler.map((g, index) => {
            const oneCikanMi = index === 0 && gosterilecekler.length >= 3;
            return (
              <MotionLink
                key={g.id}
                href={`/girisim/${g.id}`}
                variants={kartVariants}
                initial="hidden"
                exit="exit"
                whileHover={
                  azaltilmisHareket
                    ? undefined
                    : {
                        y: -4,
                        boxShadow: "0 20px 45px -20px rgba(15, 23, 42, 0.45)",
                        transition: { duration: 0.2 },
                      }
                }
                whileTap={azaltilmisHareket ? undefined : { scale: 0.98, transition: { duration: 0.2 } }}
                onMouseMove={
                  azaltilmisHareket
                    ? undefined
                    : (e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
                        e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
                      }
                }
                className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-border-subtle bg-surface p-5 transition-colors duration-200 hover:border-accent/40 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {oneCikanMi && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1 rounded-l-3xl bg-success"
                  />
                )}

                {!azaltilmisHareket && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background:
                        "radial-gradient(220px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), color-mix(in srgb, var(--accent) 28%, transparent) 0%, transparent 70%)",
                    }}
                  />
                )}

                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold text-foreground">{g.ad}</h2>
                  <DurumRozeti durum={g.durum} className="shrink-0" />
                </div>

                <p className="mt-1.5 text-sm text-foreground-muted">
                  {g.sektor ?? "Sektör belirtilmemiş"}
                  {g.kurulus_yili ? ` · ${g.kurulus_yili}` : ""}
                </p>

                {g.kisa_aciklama && (
                  <p className="mt-3 line-clamp-2 text-sm text-foreground-muted">
                    {g.kisa_aciklama}
                  </p>
                )}

                <div className="mt-auto pt-3">
                  <AiDurumRozeti aiDurum={g.ai_durum} />
                </div>
              </MotionLink>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
