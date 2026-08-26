"use client";

import Link from "next/link";
import { AiDegerlendirme } from "@/components/AiDegerlendirme";
import { DurumRozeti } from "@/components/Rozet";
import { useCeviri } from "@/lib/ceviriler";
import type { Dokuman, Girisim, GirisimProgramGecmisi, SatisYatirimKaydi } from "@/lib/types";

function paraFormatla(deger: number | null) {
  if (deger === null || deger === undefined) return "-";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(deger);
}

interface Props {
  girisim: Girisim;
  programGecmisi: GirisimProgramGecmisi[];
  satisKayitlari: SatisYatirimKaydi[];
  dokumanlar: Dokuman[];
}

// Sunum katmanı — veri çekme (Supabase sorguları + sıralama) sunucu
// bileşeni olan girisim/[id]/page.tsx'te kalıyor; bu bileşen sadece
// hazır veriyi, dil tercihine göre çevrilmiş etiketlerle render ediyor
// (useCeviri() bir hook olduğu için sunucu bileşeninde çağrılamaz).
export function GirisimDetayIcerik({
  girisim,
  programGecmisi,
  satisKayitlari,
  dokumanlar,
}: Props) {
  const t = useCeviri();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/" className="text-sm text-accent hover:underline">
        {t.girisimDetay.geriDon}
      </Link>

      {/* Genel bilgi */}
      <div className="mt-4 rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{girisim.ad}</h1>
            <p className="mt-1 text-sm text-foreground-muted">
              {girisim.sektor ?? t.girisimDetay.sektorBelirtilmemis}
              {girisim.kurulus_yili ? ` · ${t.girisimDetay.kurulus}: ${girisim.kurulus_yili}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <DurumRozeti durum={girisim.durum} />
          </div>
        </div>

        {girisim.kisa_aciklama && (
          <p className="mt-4 text-sm text-foreground-muted">{girisim.kisa_aciklama}</p>
        )}

        <AiDegerlendirme
          girisimId={girisim.id}
          initialAiDurum={girisim.ai_durum}
          initialAiGerekce={girisim.ai_gerekce}
        />

        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-foreground-muted">{t.girisimDetay.ekipBuyuklugu}</dt>
            <dd className="text-sm font-medium text-foreground">
              {girisim.ekip_buyuklugu ?? "-"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-foreground-muted">{t.girisimDetay.sonGuncelleme}</dt>
            <dd className="text-sm font-medium text-foreground">
              {girisim.son_guncelleme ?? "-"}
            </dd>
          </div>
        </dl>

        {girisim.teknoloji && girisim.teknoloji.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase text-foreground-muted">
              {t.girisimDetay.teknoloji}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {girisim.teknoloji.map((tek) => (
                <span
                  key={tek}
                  className="rounded-lg bg-surface-2 px-2 py-1 text-xs text-foreground-muted"
                >
                  {tek}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Program geçmişi - timeline */}
      <div className="mt-6 rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">{t.girisimDetay.programGecmisi}</h2>
        {programGecmisi.length === 0 ? (
          <p className="mt-2 text-sm text-foreground-muted">{t.girisimDetay.kayitYok}</p>
        ) : (
          <ol className="mt-4 space-y-4 border-l border-border-subtle pl-4">
            {programGecmisi.map((kayit) => (
              <li key={kayit.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-accent" />
                <p className="text-sm font-medium text-foreground">
                  {kayit.program?.ad ?? t.girisimDetay.program}{" "}
                  {kayit.donem && (
                    <span className="font-normal text-foreground-muted">
                      · {kayit.donem}
                    </span>
                  )}
                </p>
                {kayit.durum && (
                  <p className="text-xs text-foreground-muted">
                    {t.girisimDetay.durumEtiketi}: {kayit.durum}
                  </p>
                )}
                {kayit.onemli_adimlar && (
                  <p className="mt-1 text-sm text-foreground-muted">
                    {kayit.onemli_adimlar}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Satış / yatırım kayıtları */}
      <div className="mt-6 rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">
          {t.girisimDetay.satisYatirimKayitlari}
        </h2>
        {satisKayitlari.length === 0 ? (
          <p className="mt-2 text-sm text-foreground-muted">{t.girisimDetay.kayitYok}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-xs uppercase text-foreground-muted">
                  <th className="py-2 pr-4">{t.girisimDetay.tarih}</th>
                  <th className="py-2 pr-4">{t.girisimDetay.ciro}</th>
                  <th className="py-2 pr-4">{t.girisimDetay.ihracat}</th>
                  <th className="py-2 pr-4">{t.girisimDetay.yatirimTuru}</th>
                  <th className="py-2 pr-4">{t.girisimDetay.tutar}</th>
                  <th className="py-2 pr-4">{t.girisimDetay.hibeOdul}</th>
                </tr>
              </thead>
              <tbody>
                {satisKayitlari.map((k) => (
                  <tr key={k.id} className="border-b border-border-subtle">
                    <td className="py-2 pr-4">{k.tarih ?? "-"}</td>
                    <td className="py-2 pr-4">{paraFormatla(k.ciro)}</td>
                    <td className="py-2 pr-4">{paraFormatla(k.ihracat)}</td>
                    <td className="py-2 pr-4">{k.yatirim_turu ?? "-"}</td>
                    <td className="py-2 pr-4">{paraFormatla(k.tutar)}</td>
                    <td className="py-2 pr-4">{k.hibe_odul ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dokümanlar */}
      <div className="mt-6 rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">{t.girisimDetay.dokumanlar}</h2>
        {dokumanlar.length === 0 ? (
          <p className="mt-2 text-sm text-foreground-muted">{t.girisimDetay.kayitYok}</p>
        ) : (
          <ul className="mt-4 divide-y divide-border-subtle">
            {dokumanlar.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-foreground">{d.dosya ?? t.girisimDetay.isimsizDosya}</span>
                <span className="text-foreground-muted">
                  {d.tur ?? "-"} · {d.yukleme_tarihi ?? "-"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
