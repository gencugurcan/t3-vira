import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

const SISTEM_MESAJI_TR = `Sen bir girişim ekosistemi onay asistanısın. Bir admin, bir girişimin güncellenmiş verisini onaylamak üzere. Görevin, admin'in onay öncesi dikkat etmesi gereken noktaları kısa maddeler halinde özetlemek.
Sana girişimin ŞU AN ONAYLI (canlı) verisi ile startup'ın gönderdiği BEKLEYEN TASLAK verisi ayrı ayrı verilecek. Öncelikle bu ikisi arasındaki farkları (değişen alanları) tespit edip vurgula.
KURALLAR:
- Sen onaylama kararını VERMİYORSUN, sadece dikkat çekilecek noktaları sıralıyorsun. Karar admin'e ait.
- Kesin/otoriter dil kullanma; 'dikkat edilebilir', 'kontrol edilmesi önerilir' gibi öneri dili kullan.
- En fazla 3-4 kısa madde. Önce ONAYLI ile TASLAK arasındaki somut değişiklikleri (hangi alan, eskiden ne, şimdi ne) belirt; sonra eksik alanları, eski tarihleri veya başka dikkat çeken noktaları ekle.
- Bekleyen taslak yoksa (girişim ilk kez inceleniyorsa) bunu belirtip genel veri kalitesini değerlendir.
- Veri gayet iyiyse bunu da olumlu bir cümleyle belirt.
- Türkçe, net ve kısa yanıtla.`;

const SISTEM_MESAJI_EN = `You are a venture ecosystem approval assistant. An admin is about to approve an updated data submission for a venture. Your task is to summarize, in short bullet points, what the admin should pay attention to before approving.
You will be given the venture's CURRENTLY APPROVED (live) data and the PENDING DRAFT data submitted by the startup separately. First identify and highlight the differences (changed fields) between the two.
RULES:
- You are NOT making the approval decision, you are only listing points to pay attention to. The decision belongs to the admin.
- Do not use definitive/authoritative language; use suggestion language like 'may need review', 'recommended to check'.
- At most 3-4 short bullet points. First state the concrete changes between APPROVED and DRAFT (which field, what it was, what it is now); then add missing fields, outdated dates, or other noteworthy points.
- If there is no pending draft (the venture is being reviewed for the first time), state this and evaluate the overall data quality.
- If the data is quite good, state this too with a positive sentence.
- Respond in English, clearly and concisely.`;

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

  const [girisimRes, satisRes, gecmisRes] = await Promise.all([
    supabase.from("girisim").select("*").eq("id", girisim_id).single(),
    supabase.from("satis_yatirim_kaydi").select("*").eq("girisim_id", girisim_id),
    supabase
      .from("girisim_program_gecmisi")
      .select("*, program:program_id(id, ad)")
      .eq("girisim_id", girisim_id),
  ]);

  if (girisimRes.error || !girisimRes.data) {
    return NextResponse.json({ error: "Girişim bulunamadı" }, { status: 404 });
  }

  const bugun = new Date().toISOString().slice(0, 10);
  const { bekleyen_veri, ...onayliVeri } = girisimRes.data;

  const kullaniciMesaji = `Bugünün tarihi: ${bugun}

Girişimin ŞU AN ONAYLI (canlı) verisi:
${JSON.stringify(onayliVeri, null, 2)}

Startup'ın gönderdiği BEKLEYEN TASLAK (henüz onaylanmadı):
${bekleyen_veri ? JSON.stringify(bekleyen_veri, null, 2) : "(Bekleyen bir taslak yok — bu girişim ilk kez inceleniyor olabilir.)"}

Satış / yatırım kayıtları:
${JSON.stringify(satisRes.data ?? [], null, 2)}

Program geçmişi:
${JSON.stringify(gecmisRes.data ?? [], null, 2)}`;

  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: ingilizce ? SISTEM_MESAJI_EN : SISTEM_MESAJI_TR,
      messages: [{ role: "user", content: kullaniciMesaji }],
    });

    const metinBlogu = response.content.find((b) => b.type === "text");
    const ozet = metinBlogu && metinBlogu.type === "text" ? metinBlogu.text : "";

    return NextResponse.json({ ozet });
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : "Bilinmeyen hata";
    return NextResponse.json({ error: `AI çağrısı başarısız: ${mesaj}` }, { status: 502 });
  }
}
