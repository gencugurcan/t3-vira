import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  let ad: string | undefined;
  let eposta: string | undefined;
  let sifre: string | undefined;
  try {
    const body = await request.json();
    ad = body.ad;
    eposta = body.eposta;
    sifre = body.sifre;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  if (!ad || ad.trim().length < 2) {
    return NextResponse.json({ error: "Ad Soyad gerekli" }, { status: 400 });
  }
  if (!eposta) {
    return NextResponse.json({ error: "E-posta gerekli" }, { status: 400 });
  }
  if (!sifre || sifre.length < 6) {
    return NextResponse.json({ error: "Şifre en az 6 karakter olmalı" }, { status: 400 });
  }

  const adTemiz = ad.trim();
  const epostaTemiz = eposta.trim().toLowerCase();
  const sifreHash = await bcrypt.hash(sifre, 10);

  // NOT: insert sonrası .select() ZİNCİRLENMİYOR — kullanici tablosunda
  // anon SELECT policy'si yok (bkz. supabase_schema.sql), .select() eklenirse
  // Supabase insert edilen satırı geri okumaya çalışıp RLS'e takılır ve
  // insert aslında başarılı olsa bile hata döner.
  const { error } = await supabase.from("kullanici").insert({
    ad: adTemiz,
    eposta: epostaTemiz,
    sifre_hash: sifreHash,
    rol: "basvuran",
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı" }, { status: 409 });
    }
    console.error("Kayıt hatası:", error);
    return NextResponse.json(
      { error: "Kayıt oluşturulamadı, lütfen tekrar deneyin" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ad: adTemiz, rol: "basvuran" }, { status: 201 });
}
