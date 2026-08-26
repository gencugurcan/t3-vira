import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import type { AiDurum, Girisim } from "@/lib/types";

const SISTEM_MESAJI_TR = `Sen bir girişim ekosistemi analiz asistanısın. Sana iki girişimin özet verisi verilecek. Bu iki girişimi KISA (2-4 cümle), gerekçeli bir paragrafla karşılaştır.
KURALLAR:
- Sadece verilen veriye dayan, uydurma.
- Karşılaştırmanı hangi verilere dayandırdığını belirt (ör. ciro, AI durumu, program geçmişi).
- Dilini KESİNLİKLE öneri/gözlem seviyesinde tut — "X daha başarılı/daha iyi" gibi NİHAİ bir hüküm cümlesi KURMA. Bunun yerine "X, ciro açısından öne çıkıyor ancak son karar size ait" gibi ölçülü, gözlemsel ifadeler kullan.
- Kesin/otoriter karar dili kullanma; sen analiz ve ön değerlendirme sunuyorsun, nihai kararı karar verici verir.
- Türkçe, net ve kısa yanıtla.`;

const SISTEM_MESAJI_EN = `You are a venture ecosystem analysis assistant. You will be given summary data for two ventures. Compare these two ventures in a SHORT (2-4 sentence), reasoned paragraph.
RULES:
- Rely only on the given data, do not make things up.
- State which data your comparison is based on (e.g. revenue, AI status, program history).
- Keep your language STRICTLY at the suggestion/observation level — do NOT make a FINAL judgment sentence like "X is more successful/better". Instead use measured, observational phrasing like "X stands out in terms of revenue, but the final decision is yours".
- Do NOT use definitive/authoritative decision language; you provide analysis and a preliminary assessment, the final decision belongs to the decision maker.
- Respond in English, clearly and concisely.`;

export interface KarsilastirmaGirisim {
  id: string;
  ad: string;
  sektor: string | null;
  sektor_en: string | null;
  kurulus_yili: number | null;
  kisa_aciklama: string | null;
  kisa_aciklama_en: string | null;
  ai_durum: AiDurum;
  son_guncelleme: string | null;
  toplam_ciro: number;
  programlar: string[];
}

export interface KarsilastirmaSonucu {
  girisim1: KarsilastirmaGirisim;
  girisim2: KarsilastirmaGirisim;
  yorum: string;
}

function toplamCiroHesapla(kayitlar: { ciro: number | null }[]) {
  return kayitlar.reduce((toplam, k) => toplam + (k.ciro ?? 0), 0);
}

async function girisimOzetiGetir(girisimId: string): Promise<KarsilastirmaGirisim | null> {
  const [girisimRes, gecmisRes, satisRes] = await Promise.all([
    supabase.from("girisim").select("*").eq("id", girisimId).single(),
    supabase
      .from("girisim_program_gecmisi")
      .select("*, program:program_id(id, ad)")
      .eq("girisim_id", girisimId),
    // Ciro, /api/sorgu'nun dayandığı AYNI kaynaktan (satis_yatirim_kaydi) toplanıyor
    // ki bu ekran ile AI Sorgu farklı bir sayı göstermesin.
    supabase.from("satis_yatirim_kaydi").select("ciro").eq("girisim_id", girisimId),
  ]);

  if (girisimRes.error || !girisimRes.data) {
    return null;
  }

  const girisim = girisimRes.data as Girisim;
  const programlar = ((gecmisRes.data ?? []) as { program?: { ad: string } | null }[])
    .map((k) => k.program?.ad)
    .filter((ad): ad is string => Boolean(ad));

  return {
    id: girisim.id,
    ad: girisim.ad,
    sektor: girisim.sektor,
    sektor_en: girisim.sektor_en,
    kurulus_yili: girisim.kurulus_yili,
    kisa_aciklama: girisim.kisa_aciklama,
    kisa_aciklama_en: girisim.kisa_aciklama_en,
    ai_durum: girisim.ai_durum,
    son_guncelleme: girisim.son_guncelleme,
    toplam_ciro: toplamCiroHesapla((satisRes.data ?? []) as { ciro: number | null }[]),
    programlar,
  };
}

export async function POST(request: NextRequest) {
  let girisim1Id: string | undefined;
  let girisim2Id: string | undefined;
  let dil: string | undefined;
  try {
    const body = await request.json();
    girisim1Id = body.girisim1Id;
    girisim2Id = body.girisim2Id;
    dil = body.dil;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }
  const ingilizce = dil === "en";

  if (!girisim1Id || !girisim2Id) {
    return NextResponse.json({ error: "İki girişim de seçilmeli" }, { status: 400 });
  }
  if (girisim1Id === girisim2Id) {
    return NextResponse.json({ error: "Aynı girişim iki kez seçilemez" }, { status: 400 });
  }

  const [girisim1, girisim2] = await Promise.all([
    girisimOzetiGetir(girisim1Id),
    girisimOzetiGetir(girisim2Id),
  ]);

  if (!girisim1 || !girisim2) {
    return NextResponse.json({ error: "Girişim bulunamadı" }, { status: 404 });
  }

  const kullaniciMesaji = `Girişim 1:
${JSON.stringify(girisim1, null, 2)}

Girişim 2:
${JSON.stringify(girisim2, null, 2)}

Bu iki girişimi karşılaştır.`;

  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: ingilizce ? SISTEM_MESAJI_EN : SISTEM_MESAJI_TR,
      messages: [{ role: "user", content: kullaniciMesaji }],
    });

    const metinBlogu = response.content.find((b) => b.type === "text");
    const yorum = metinBlogu && metinBlogu.type === "text" ? metinBlogu.text : "";

    const sonuc: KarsilastirmaSonucu = { girisim1, girisim2, yorum };
    return NextResponse.json(sonuc);
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : "Bilinmeyen hata";
    return NextResponse.json({ error: `AI çağrısı başarısız: ${mesaj}` }, { status: 502 });
  }
}
