export type GirisimDurum = "onayli" | "onay_bekliyor";
export type AiDurum = "HAZIR" | "IZLEMEDE" | "VERI_EKSIK" | null;
export type KullaniciRol =
  | "super_admin"
  | "program_yoneticisi"
  | "startup"
  | "karar_verici";

export interface Girisim {
  id: string;
  ad: string;
  sektor: string | null;
  kurulus_yili: number | null;
  logo: string | null;
  kisa_aciklama: string | null;
  teknoloji: string[] | null;
  ekip_buyuklugu: number | null;
  durum: GirisimDurum;
  ai_durum: AiDurum;
  ai_gerekce: string | null;
  son_guncelleme: string | null;
}

export interface Program {
  id: string;
  ad: string;
}

export interface GirisimProgramGecmisi {
  id: string;
  girisim_id: string;
  program_id: string;
  donem: string | null;
  durum: string | null;
  onemli_adimlar: string | null;
  program?: Program;
}

export interface Kullanici {
  id: string;
  ad: string;
  eposta: string;
  rol: KullaniciRol;
}

export interface SatisYatirimKaydi {
  id: string;
  girisim_id: string;
  ciro: number | null;
  ihracat: number | null;
  yatirim_turu: string | null;
  tutar: number | null;
  hibe_odul: string | null;
  tarih: string | null;
}

export interface Dokuman {
  id: string;
  girisim_id: string;
  dosya: string | null;
  tur: string | null;
  yukleme_tarihi: string | null;
}
