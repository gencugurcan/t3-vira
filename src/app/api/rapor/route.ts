import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

const SISTEM_MESAJI_ON_EKI = `Sen bir girişim ekosistemi yönetici raporu asistanısın. Sana ekosistemdeki TÜM girişimlerin güncel verisi verilecek. Yöneticiye yönelik, bu ayki ekosistem durumunu özetleyen kısa ve profesyonel bir rapor üret.
RAPOR ŞU BÖLÜMLERİ İÇERSİN:
1. Genel Durum: toplam girişim sayısı, AI durumu dağılımı (kaç HAZIR/IZLEMEDE/VERI_EKSIK), onay bekleyen sayısı
2. Öne Çıkanlar: verisi güçlü, güncel, dikkat çeken girişimler (adlarıyla)
3. Dikkat Gerektirenler: verisi eksik ya da uzun süredir güncellenmemiş girişimler (adlarıyla, kısa sebeple)
4. Genel Değerlendirme: ekosistemin genel sağlığına dair 2-3 cümlelik özet
KURALLAR:
- Sadece verilen veriye dayan, uydurma.
- Kesin/otoriter karar dili kullanma; bu bir ön değerlendirme raporudur, nihai kararları yönetici verir.
- Türkçe, net, profesyonel. Bölüm başlıklarını kullan.`;

export async function POST() {
  const [girisimRes, gecmisRes, satisRes] = await Promise.all([
    supabase.from("girisim").select("*"),
    supabase.from("girisim_program_gecmisi").select("*, program:program_id(id, ad)"),
    supabase.from("satis_yatirim_kaydi").select("*"),
  ]);

  const bugun = new Date().toISOString().slice(0, 10);

  const sistemMesaji = `${SISTEM_MESAJI_ON_EKI}
- Bugünün tarihi: ${bugun}.`;

  const kullaniciMesaji = `Bugünün tarihi: ${bugun}

Girişimler:
${JSON.stringify(girisimRes.data ?? [], null, 2)}

Girişim - program geçmişi:
${JSON.stringify(gecmisRes.data ?? [], null, 2)}

Satış / yatırım kayıtları:
${JSON.stringify(satisRes.data ?? [], null, 2)}`;

  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: sistemMesaji,
      messages: [{ role: "user", content: kullaniciMesaji }],
    });

    const metinBlogu = response.content.find((b) => b.type === "text");
    const rapor = metinBlogu && metinBlogu.type === "text" ? metinBlogu.text : "";

    return NextResponse.json({ rapor });
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : "Bilinmeyen hata";
    return NextResponse.json({ error: `AI çağrısı başarısız: ${mesaj}` }, { status: 502 });
  }
}
