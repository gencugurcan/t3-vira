import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  let eposta: string | undefined;
  let sifre: string | undefined;
  try {
    const body = await request.json();
    eposta = body.eposta;
    sifre = body.sifre;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }
  if (!eposta || !sifre) {
    return NextResponse.json({ error: "E-posta ve şifre gerekli" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("kullanici")
    .select("ad, rol, sifre_hash")
    .eq("eposta", eposta.trim().toLowerCase())
    .maybeSingle();
  if (error || !data || !data.sifre_hash) {
    return NextResponse.json({ error: "E-posta veya şifre hatalı" }, { status: 401 });
  }
  const dogruMu = await bcrypt.compare(sifre, data.sifre_hash);
  if (!dogruMu) {
    return NextResponse.json({ error: "E-posta veya şifre hatalı" }, { status: 401 });
  }
  return NextResponse.json({ ad: data.ad, rol: data.rol });
}
