import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { GirisimDetayIcerik } from "@/components/GirisimDetayIcerik";
import type { Dokuman, Girisim, GirisimProgramGecmisi, SatisYatirimKaydi } from "@/lib/types";

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

// Veri çekme (Supabase, sunucuda) burada kalıyor; sunum + dil çevirisi
// GirisimDetayIcerik.tsx'e devrediliyor (useCeviri() bir hook olduğu için
// sunucu bileşeninde çağrılamaz — bkz. o dosyadaki not).
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
    <GirisimDetayIcerik
      girisim={girisim}
      programGecmisi={programGecmisi}
      satisKayitlari={satisKayitlari}
      dokumanlar={dokumanlar}
    />
  );
}
