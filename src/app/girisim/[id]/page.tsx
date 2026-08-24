import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AiDegerlendirme } from "@/components/AiDegerlendirme";
import type {
  Dokuman,
  Girisim,
  GirisimProgramGecmisi,
  SatisYatirimKaydi,
} from "@/lib/types";

const DURUM_RENK: Record<string, string> = {
  onayli: "bg-blue-100 text-blue-800",
  onay_bekliyor: "bg-gray-100 text-gray-700",
};

function paraFormatla(deger: number | null) {
  if (deger === null || deger === undefined) return "-";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(deger);
}

// "donem" serbest metin (örn. "2024 Güz") olarak tutuluyor, ayrı bir tarih/sıra
// kolonu yok. Program geçmişini kronolojik göstermek için yıl + mevsimden
// (takvimsel çeyrek: Kış < Bahar < Yaz < Güz) sıralanabilir bir değer türetiyoruz.
const MEVSIM_SIRA: Record<string, number> = {
  kış: 0,
  bahar: 1,
  yaz: 2,
  güz: 3,
};

function donemSiraDegeri(donem: string | null): number {
  if (!donem) return Number.MAX_SAFE_INTEGER;
  const yilEslesme = donem.match(/\d{4}/);
  const yil = yilEslesme ? Number(yilEslesme[0]) : 0;
  const mevsim = donem
    .toLowerCase()
    .split(/\s+/)
    .find((kelime) => kelime in MEVSIM_SIRA);
  return yil * 4 + (mevsim ? MEVSIM_SIRA[mevsim] : 0);
}

export default async function GirisimDetaySayfasi(
  props: PageProps<"/girisim/[id]">,
) {
  const { id } = await props.params;

  const [girisimRes, gecmisRes, satisRes, dokumanRes] = await Promise.all([
    supabase.from("girisim").select("*").eq("id", id).single(),
    supabase
      .from("girisim_program_gecmisi")
      .select("*, program:program_id(id, ad)")
      .eq("girisim_id", id),
    supabase
      .from("satis_yatirim_kaydi")
      .select("*")
      .eq("girisim_id", id)
      .order("tarih", { ascending: true }),
    supabase
      .from("dokuman")
      .select("*")
      .eq("girisim_id", id)
      .order("yukleme_tarihi", { ascending: false }),
  ]);

  if (girisimRes.error || !girisimRes.data) {
    notFound();
  }

  const girisim = girisimRes.data as Girisim;
  const programGecmisi = ((gecmisRes.data ?? []) as GirisimProgramGecmisi[]).sort(
    (a, b) => donemSiraDegeri(a.donem) - donemSiraDegeri(b.donem),
  );
  const satisKayitlari = (satisRes.data ?? []) as SatisYatirimKaydi[];
  const dokumanlar = (dokumanRes.data ?? []) as Dokuman[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← Girişimlere dön
      </Link>

      {/* Genel bilgi */}
      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{girisim.ad}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {girisim.sektor ?? "Sektör belirtilmemiş"}
              {girisim.kurulus_yili ? ` · Kuruluş: ${girisim.kurulus_yili}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                DURUM_RENK[girisim.durum] ?? "bg-gray-100 text-gray-700"
              }`}
            >
              {girisim.durum === "onayli" ? "Onaylı" : "Onay Bekliyor"}
            </span>
          </div>
        </div>

        {girisim.kisa_aciklama && (
          <p className="mt-4 text-sm text-gray-700">{girisim.kisa_aciklama}</p>
        )}

        <AiDegerlendirme
          girisimId={girisim.id}
          initialAiDurum={girisim.ai_durum}
          initialAiGerekce={girisim.ai_gerekce}
        />

        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-gray-500">Ekip Büyüklüğü</dt>
            <dd className="text-sm font-medium text-gray-900">
              {girisim.ekip_buyuklugu ?? "-"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Son Güncelleme</dt>
            <dd className="text-sm font-medium text-gray-900">
              {girisim.son_guncelleme ?? "-"}
            </dd>
          </div>
        </dl>

        {girisim.teknoloji && girisim.teknoloji.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase text-gray-500">
              Teknoloji
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {girisim.teknoloji.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Program geçmişi - timeline */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Program Geçmişi</h2>
        {programGecmisi.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Kayıt yok.</p>
        ) : (
          <ol className="mt-4 space-y-4 border-l border-gray-200 pl-4">
            {programGecmisi.map((kayit) => (
              <li key={kayit.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                <p className="text-sm font-medium text-gray-900">
                  {kayit.program?.ad ?? "Program"}{" "}
                  {kayit.donem && (
                    <span className="font-normal text-gray-500">
                      · {kayit.donem}
                    </span>
                  )}
                </p>
                {kayit.durum && (
                  <p className="text-xs text-gray-500">Durum: {kayit.durum}</p>
                )}
                {kayit.onemli_adimlar && (
                  <p className="mt-1 text-sm text-gray-600">
                    {kayit.onemli_adimlar}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Satış / yatırım kayıtları */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Satış / Yatırım Kayıtları
        </h2>
        {satisKayitlari.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Kayıt yok.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="py-2 pr-4">Tarih</th>
                  <th className="py-2 pr-4">Ciro</th>
                  <th className="py-2 pr-4">İhracat</th>
                  <th className="py-2 pr-4">Yatırım Türü</th>
                  <th className="py-2 pr-4">Tutar</th>
                  <th className="py-2 pr-4">Hibe/Ödül</th>
                </tr>
              </thead>
              <tbody>
                {satisKayitlari.map((k) => (
                  <tr key={k.id} className="border-b border-gray-100">
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
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Dokümanlar</h2>
        {dokumanlar.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Kayıt yok.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {dokumanlar.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-900">{d.dosya ?? "İsimsiz dosya"}</span>
                <span className="text-gray-500">
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
