"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Girisim, Program } from "@/lib/types";

const AI_DURUM_RENK: Record<string, string> = {
  HAZIR: "bg-green-100 text-green-800",
  IZLEMEDE: "bg-yellow-100 text-yellow-800",
  VERI_EKSIK: "bg-red-100 text-red-800",
};

const DURUM_RENK: Record<string, string> = {
  onayli: "bg-blue-100 text-blue-800",
  onay_bekliyor: "bg-gray-100 text-gray-700",
};

export default function AnaSayfa() {
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Girişimler</h1>
      <p className="mt-1 text-sm text-gray-500">
        Ekosistemdeki tüm girişimleri görüntüle ve filtrele.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={sektorFiltre}
          onChange={(e) => setSektorFiltre(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800"
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
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800"
        >
          <option value="">Tüm programlar</option>
          {programlar.map((p) => (
            <option key={p.id} value={p.id}>
              {p.ad}
            </option>
          ))}
        </select>
      </div>

      {yukleniyor && (
        <p className="mt-8 text-sm text-gray-500">Yükleniyor...</p>
      )}

      {hata && (
        <p className="mt-8 text-sm text-red-600">
          Veri alınamadı: {hata}
        </p>
      )}

      {!yukleniyor && !hata && filtrelenmis.length === 0 && (
        <p className="mt-8 text-sm text-gray-500">Kayıt bulunamadı.</p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtrelenmis.map((g) => (
          <Link
            key={g.id}
            href={`/girisim/${g.id}`}
            className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-semibold text-gray-900">{g.ad}</h2>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  DURUM_RENK[g.durum] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {g.durum === "onayli" ? "Onaylı" : "Onay Bekliyor"}
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              {g.sektor ?? "Sektör belirtilmemiş"}
              {g.kurulus_yili ? ` · ${g.kurulus_yili}` : ""}
            </p>

            {g.kisa_aciklama && (
              <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                {g.kisa_aciklama}
              </p>
            )}

            {g.ai_durum && (
              <span
                className={`mt-3 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  AI_DURUM_RENK[g.ai_durum] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                AI: {g.ai_durum}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
