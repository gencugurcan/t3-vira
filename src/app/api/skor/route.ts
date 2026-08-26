import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import type { AiDurum } from "@/lib/types";

const SISTEM_MESAJI_TR = `Sen bir girişim ekosistemi karar destek asistanısın. Sana bir girişimin verisi verilecek.
Görevin, bu girişimin veri güncelliğini ve takip durumunu değerlendirip bir DURUM etiketi ve tek cümlelik bir GEREKÇE üretmek.
ÖNEMLİ KURALLAR:
- Sen kesin karar verici DEĞİLSİN. Ürettiğin şey bir ÖN DEĞERLENDİRME ve ÖNERİDİR.
- Asla 'bu girişim başarısız/kötü' gibi kesin, otoriter dil kullanma.
- Gerekçen kısa, somut ve veriye dayalı olmalı.
- Değerlendirmeni girişimin ne kadar güncel ve eksiksiz veri sunduğuna göre yap.
- Bugünün tarihi cevabı etkilemeli; son güncelleme tarihi eskiyse bunu dikkate al.
DURUM sadece şu üç değerden biri olabilir:
- HAZIR: verisi güncel ve yeterince eksiksiz
- IZLEMEDE: bazı veriler eski ya da eksik
- VERI_EKSIK: kritik alanlar boş ya da uzun süredir güncellenmemiş
GEREKCE cümlesini Türkçe yaz. Cevabını SADECE şu formatta ver:
DURUM: <HAZIR / IZLEMEDE / VERI_EKSIK>
GEREKCE: <tek cümle>`;

const SISTEM_MESAJI_EN = `You are a venture ecosystem decision-support assistant. You will be given data for a venture.
Your task is to evaluate this venture's data freshness and follow-up status, then produce a STATUS label and a one-sentence RATIONALE.
IMPORTANT RULES:
- You are NOT the final decision maker. What you produce is a PRELIMINARY ASSESSMENT and SUGGESTION.
- Never use definitive, authoritative language like 'this venture is failing/bad'.
- Your rationale must be short, concrete, and data-driven.
- Base your assessment on how current and complete the venture's data is.
- Today's date should affect your answer; take into account if the last update date is old.
STATUS can only be one of these three values (keep them exactly as written below, do not translate them):
- HAZIR: data is current and reasonably complete
- IZLEMEDE: some data is outdated or missing
- VERI_EKSIK: critical fields are empty or have not been updated for a long time
Write the GEREKCE sentence in English. Respond ONLY in this exact format (keep the labels DURUM/GEREKCE and the HAZIR/IZLEMEDE/VERI_EKSIK values exactly as written, untranslated):
DURUM: <HAZIR / IZLEMEDE / VERI_EKSIK>
GEREKCE: <one sentence>`;

const GECERLI_DURUMLAR: AiDurum[] = ["HAZIR", "IZLEMEDE", "VERI_EKSIK"];

export async function POST(request: NextRequest) {
  let girisim_id: string | undefined;
  let dil: string | undefined;
  try {
    const body = await request.json();
    girisim_id = body.girisim_id;
    dil = body.dil;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }
  const ingilizce = dil === "en";

  if (!girisim_id) {
    return NextResponse.json({ error: "girisim_id gerekli" }, { status: 400 });
  }

  const { data: girisim, error: girisimHata } = await supabase
    .from("girisim")
    .select("ad, sektor, kurulus_yili, ekip_buyuklugu, kisa_aciklama, teknoloji, son_guncelleme")
    .eq("id", girisim_id)
    .single();

  if (girisimHata || !girisim) {
    return NextResponse.json({ error: "Girişim bulunamadı" }, { status: 404 });
  }

  const { data: satisKayitlari } = await supabase
    .from("satis_yatirim_kaydi")
    .select("ciro, ihracat, yatirim_turu, tutar, tarih")
    .eq("girisim_id", girisim_id);

  const bugun = new Date().toISOString().slice(0, 10);

  const kullaniciMesaji = `Bugünün tarihi: ${bugun}

Girişim verisi:
${JSON.stringify(girisim, null, 2)}

Satış / yatırım kayıtları:
${JSON.stringify(satisKayitlari ?? [], null, 2)}`;

  let ai_durum: AiDurum;
  let ai_gerekce: string;

  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: ingilizce ? SISTEM_MESAJI_EN : SISTEM_MESAJI_TR,
      messages: [{ role: "user", content: kullaniciMesaji }],
    });

    const metinBlogu = response.content.find((b) => b.type === "text");
    const metin = metinBlogu && metinBlogu.type === "text" ? metinBlogu.text : "";

    const durumEslesme = metin.match(/DURUM:\s*(HAZIR|IZLEMEDE|VERI_EKSIK)/i);
    const gerekceEslesme = metin.match(/GEREKCE:\s*(.+)/i);

    if (!durumEslesme) {
      return NextResponse.json(
        { error: "AI cevabı beklenen formatta değil" },
        { status: 502 },
      );
    }

    ai_durum = durumEslesme[1].toUpperCase() as AiDurum;
    if (!GECERLI_DURUMLAR.includes(ai_durum)) {
      return NextResponse.json({ error: "Geçersiz AI durumu" }, { status: 502 });
    }
    ai_gerekce = gerekceEslesme ? gerekceEslesme[1].trim() : "";
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : "Bilinmeyen hata";
    return NextResponse.json({ error: `AI çağrısı başarısız: ${mesaj}` }, { status: 502 });
  }

  const { error: guncelleHata } = await supabase
    .from("girisim")
    .update({ ai_durum, ai_gerekce })
    .eq("id", girisim_id);

  if (guncelleHata) {
    return NextResponse.json({ error: guncelleHata.message }, { status: 500 });
  }

  return NextResponse.json({ ai_durum, ai_gerekce });
}
