import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { KullaniciRol } from "@/lib/types";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const GECERLI_ROLLER: KullaniciRol[] = [
  "super_admin",
  "program_yoneticisi",
  "startup",
  "karar_verici",
  "basvuran",
];

export async function POST(request: NextRequest) {
  let callerEposta: string | undefined;
  let hedefId: string | undefined;
  let yeniRol: string | undefined;
  try {
    const body = await request.json();
    callerEposta = body.callerEposta;
    hedefId = body.hedefId;
    yeniRol = body.yeniRol;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  if (!callerEposta || !hedefId || !yeniRol || !GECERLI_ROLLER.includes(yeniRol as KullaniciRol)) {
    return NextResponse.json({ error: "Eksik veya geçersiz istek" }, { status: 400 });
  }

  const { data: caller, error: callerHata } = await supabaseAdmin
    .from("kullanici")
    .select("rol")
    .eq("eposta", callerEposta.trim().toLowerCase())
    .maybeSingle();

  if (callerHata || !caller || caller.rol !== "super_admin") {
    return NextResponse.json(
      { error: "Bu işlem için Süper Admin yetkisi gerekli" },
      { status: 403 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("kullanici")
    .update({ rol: yeniRol })
    .eq("id", hedefId)
    .select("id, ad, eposta, rol")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: "Kullanıcı bulunamadı veya güncellenemedi" },
      { status: 404 },
    );
  }

  return NextResponse.json({ kullanici: data });
}
