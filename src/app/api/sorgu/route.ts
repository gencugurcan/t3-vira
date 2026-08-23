import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

const SISTEM_MESAJI_ON_EKI = `Sen bir girişim ekosistemi analiz asistanısın. Sana ekosistemdeki TÜM girişimlerin güncel verisi verilecek. Karar vericinin sorusunu, SADECE bu veriye dayanarak yanıtla.
KURALLAR:
- Sadece verilen veriye dayan. Veride olmayan bir şey uydurma. Bilgi yoksa 'bu konuda veri bulunmuyor' de.
- Cevabını hangi girişimlere dayandırdığını belirt (girişim adlarını yaz).
- Sayısal sorularda net sayı ver ve o girişimleri listele.
- Kesin/otoriter karar dili kullanma; sen analiz ve ön değerlendirme sunuyorsun, nihai kararı karar verici verir.
- Türkçe, net ve kısa yanıtla.`;

export async function POST(request: NextRequest) {
  let soru: string | undefined;
  try {
    const body = await request.json();
    soru = body.soru;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  if (!soru || !soru.trim()) {
    return NextResponse.json({ error: "soru gerekli" }, { status: 400 });
  }

  const [girisimRes, programRes, gecmisRes, satisRes] = await Promise.all([
    supabase.from("girisim").select("*"),
    supabase.from("program").select("*"),
    supabase.from("girisim_program_gecmisi").select("*, program:program_id(id, ad)"),
    supabase.from("satis_yatirim_kaydi").select("*"),
  ]);

  const bugun = new Date().toISOString().slice(0, 10);

  const sistemMesaji = `${SISTEM_MESAJI_ON_EKI}
- Bugünün tarihi: ${bugun} — tarih bazlı sorularda bunu kullan.`;

  const kullaniciMesaji = `Girişimler:
${JSON.stringify(girisimRes.data ?? [], null, 2)}

Programlar:
${JSON.stringify(programRes.data ?? [], null, 2)}

Girişim - program geçmişi:
${JSON.stringify(gecmisRes.data ?? [], null, 2)}

Satış / yatırım kayıtları:
${JSON.stringify(satisRes.data ?? [], null, 2)}

Soru: ${soru}`;

  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: sistemMesaji,
      messages: [{ role: "user", content: kullaniciMesaji }],
    });

    const metinBlogu = response.content.find((b) => b.type === "text");
    const cevap = metinBlogu && metinBlogu.type === "text" ? metinBlogu.text : "";

    return NextResponse.json({ cevap });
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : "Bilinmeyen hata";
    return NextResponse.json({ error: `AI çağrısı başarısız: ${mesaj}` }, { status: 502 });
  }
}
