"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { Girisim, Program } from "@/lib/types";

const MotionLink = motion.create(Link);

const AI_DURUM_RENK: Record<string, string> = {
  HAZIR: "bg-[var(--success-soft)] text-success",
  IZLEMEDE: "bg-[var(--warning-soft)] text-warning",
  VERI_EKSIK: "bg-[var(--danger-soft)] text-danger",
};

const DURUM_RENK: Record<string, string> = {
  onayli: "bg-[var(--accent-soft)] text-accent",
  onay_bekliyor: "bg-surface-2 text-foreground-muted",
};

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
  const [sektorFiltre, setSektorFiltre] = useState<string>("");
  const [programFiltre, setProgramFiltre] = useState<string>("");
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
    return girisimler.filter((g) => {
      const sektorUyum = !sektorFiltre || g.sektor === sektorFiltre;
      const programUyum =
        !programFiltre ||
        (girisimProgramMap[g.id]?.includes(programFiltre) ?? false);
      return sektorUyum && programUyum;
    });
  }, [girisimler, sektorFiltre, programFiltre, girisimProgramMap]);

  const toplamGirisim = girisimler.length;
  const onayliSayisi = girisimler.filter((g) => g.durum === "onayli").length;
  const bekleyenSayisi = girisimler.filter((g) => g.durum === "onay_bekliyor").length;

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
            <div className="rounded-2xl border border-border-subtle bg-surface-2 px-4 py-3">
              <p className="text-2xl font-semibold text-foreground">{toplamGirisim}</p>
              <p className="text-xs text-foreground-muted">Toplam Girişim</p>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-surface-2 px-4 py-3">
              <p className="text-2xl font-semibold text-accent">{onayliSayisi}</p>
              <p className="text-xs text-foreground-muted">Onaylı</p>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-surface-2 px-4 py-3">
              <p className="text-2xl font-semibold text-warning">{bekleyenSayisi}</p>
              <p className="text-xs text-foreground-muted">Onay Bekliyor</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={filtreVariants}
        initial="hidden"
        animate="visible"
        className="mt-6 flex flex-wrap gap-3"
      >
        <select
          value={sektorFiltre}
          onChange={(e) => setSektorFiltre(e.target.value)}
          className="rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Tüm sektörler</option>
          {sektorler.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={programFiltre}
          onChange={(e) => setProgramFiltre(e.target.value)}
          className="rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Tüm programlar</option>
          {programlar.map((p) => (
            <option key={p.id} value={p.id}>
              {p.ad}
            </option>
          ))}
        </select>
      </motion.div>

      {yukleniyor && (
        <p className="mt-8 text-sm text-foreground-muted">Yükleniyor...</p>
      )}

      {hata && (
        <p className="mt-8 text-sm text-danger">
          Veri alınamadı: {hata}
        </p>
      )}

      {!yukleniyor && !hata && filtrelenmis.length === 0 && (
        <p className="mt-8 text-sm text-foreground-muted">Kayıt bulunamadı.</p>
      )}

      <motion.div
        variants={gridVariants}
        initial="hidden"
        animate="visible"
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence>
          {filtrelenmis.map((g, index) => (
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
                      scale: 1.03,
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
              className={`group relative overflow-hidden block rounded-3xl border border-border-subtle bg-surface p-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-2 ${
                index === 0 && filtrelenmis.length >= 3 ? "sm:col-span-2" : ""
              }`}
            >
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
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    DURUM_RENK[g.durum] ?? "bg-surface-2 text-foreground-muted"
                  }`}
                >
                  {g.durum === "onayli" ? "Onaylı" : "Onay Bekliyor"}
                </span>
              </div>

              <p className="mt-1 text-sm text-foreground-muted">
                {g.sektor ?? "Sektör belirtilmemiş"}
                {g.kurulus_yili ? ` · ${g.kurulus_yili}` : ""}
              </p>

              {g.kisa_aciklama && (
                <p className="mt-2 line-clamp-2 text-sm text-foreground-muted">
                  {g.kisa_aciklama}
                </p>
              )}

              {g.ai_durum && (
                <span
                  className={`mt-3 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    AI_DURUM_RENK[g.ai_durum] ?? "bg-surface-2 text-foreground-muted"
                  }`}
                >
                  AI: {g.ai_durum}
                </span>
              )}
            </MotionLink>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
