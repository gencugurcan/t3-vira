"use client";

import { useEffect, useState } from "react";
import { useRole } from "@/context/RoleContext";
import { useCeviri } from "@/lib/ceviriler";
import { supabase } from "@/lib/supabase";
import type { Girisim, Program } from "@/lib/types";

interface Form {
  ad: string;
  sektor: string;
  kisa_aciklama: string;
  ekip_buyuklugu: string;
  teknoloji: string;
}

const BOS_FORM: Form = {
  ad: "",
  sektor: "",
  kisa_aciklama: "",
  ekip_buyuklugu: "",
  teknoloji: "",
};

interface YeniGirisimForm {
  ad: string;
  sektor: string;
  kurulus_yili: string;
  kisa_aciklama: string;
  ekip_buyuklugu: string;
  teknoloji: string;
}

const BOS_YENI_GIRISIM_FORM: YeniGirisimForm = {
  ad: "",
  sektor: "",
  kurulus_yili: "",
  kisa_aciklama: "",
  ekip_buyuklugu: "",
  teknoloji: "",
};

interface NotForm {
  programId: string;
  donem: string;
  durum: string;
  onemliAdimlar: string;
}

const BOS_NOT_FORM: NotForm = {
  programId: "",
  donem: "",
  durum: "",
  onemliAdimlar: "",
};

interface BelgeForm {
  dosya: string;
  tur: string;
}

const BOS_BELGE_FORM: BelgeForm = { dosya: "", tur: "" };

// Bekleyen (onay bekleyen) bir taslak varsa formu ondan doldur, yoksa
// en son onaylanmış (canlı) veriden doldur. Böylece startup, daha önce
// gönderdiği ama henüz onaylanmamış taslağı kaybetmeden düzenlemeye devam eder.
function girisimdenFormaCevir(g: Girisim): Form {
  const taslak = g.bekleyen_veri;
  return {
    ad: taslak?.ad ?? g.ad ?? "",
    sektor: (taslak?.sektor ?? g.sektor) ?? "",
    kisa_aciklama: (taslak?.kisa_aciklama ?? g.kisa_aciklama) ?? "",
    ekip_buyuklugu: (taslak?.ekip_buyuklugu ?? g.ekip_buyuklugu)?.toString() ?? "",
    teknoloji: (taslak?.teknoloji ?? g.teknoloji ?? []).join(", "),
  };
}

export default function PortalSayfasi() {
  const { rol } = useRole();
  const t = useCeviri();

  const [girisimler, setGirisimler] = useState<Girisim[]>([]);
  const [seciliId, setSeciliId] = useState<string>("");
  const [form, setForm] = useState<Form>(BOS_FORM);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  const [yeniGirisimAcik, setYeniGirisimAcik] = useState(false);
  const [yeniGirisimForm, setYeniGirisimForm] = useState<YeniGirisimForm>(BOS_YENI_GIRISIM_FORM);
  const [yeniGirisimKaydediliyor, setYeniGirisimKaydediliyor] = useState(false);
  const [yeniGirisimMesaj, setYeniGirisimMesaj] = useState<string | null>(null);
  const [yeniGirisimHata, setYeniGirisimHata] = useState<string | null>(null);

  const [programlar, setProgramlar] = useState<Program[]>([]);
  const [notForm, setNotForm] = useState<NotForm>(BOS_NOT_FORM);
  const [notKaydediliyor, setNotKaydediliyor] = useState(false);
  const [notMesaj, setNotMesaj] = useState<string | null>(null);
  const [notHata, setNotHata] = useState<string | null>(null);

  const [belgeForm, setBelgeForm] = useState<BelgeForm>(BOS_BELGE_FORM);
  const [belgeKaydediliyor, setBelgeKaydediliyor] = useState(false);
  const [belgeMesaj, setBelgeMesaj] = useState<string | null>(null);
  const [belgeHata, setBelgeHata] = useState<string | null>(null);

  useEffect(() => {
    if (rol !== "startup" && rol !== "program_yoneticisi") return;
    async function girisimleriGetir() {
      setYukleniyor(true);
      const { data, error } = await supabase
        .from("girisim")
        .select("*")
        .order("ad");
      if (error) {
        setHata(error.message);
      } else {
        setGirisimler(data as Girisim[]);
        if (data && data.length > 0) {
          setSeciliId(data[0].id);
          setForm(girisimdenFormaCevir(data[0] as Girisim));
        }
      }
      setYukleniyor(false);
    }
    girisimleriGetir();
  }, [rol]);

  useEffect(() => {
    if (rol !== "program_yoneticisi") return;
    async function programlariGetir() {
      const { data, error } = await supabase.from("program").select("*").order("ad");
      if (!error && data) setProgramlar(data as Program[]);
    }
    programlariGetir();
  }, [rol]);

  if (rol !== "startup" && rol !== "program_yoneticisi") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="rounded-lg bg-[var(--warning-soft)] px-4 py-3 text-sm text-warning">
          {t.portal.sadeceStartupProgramYoneticisi}
        </p>
      </div>
    );
  }

  const baslik = rol === "program_yoneticisi" ? t.portal.baslikProgramYoneticisi : t.portal.baslikStartup;
  const aciklama =
    rol === "program_yoneticisi"
      ? t.portal.aciklamaProgramYoneticisi
      : t.portal.aciklamaStartup;

  const seciliGirisim = girisimler.find((g) => g.id === seciliId) ?? null;
  const bekleyenVarMi = !!seciliGirisim?.bekleyen_veri;

  function girisimSecildi(id: string) {
    setSeciliId(id);
    setMesaj(null);
    setHata(null);
    const secilen = girisimler.find((g) => g.id === id);
    if (secilen) setForm(girisimdenFormaCevir(secilen));
  }

  async function kaydet() {
    if (!seciliId) return;
    setKaydediliyor(true);
    setMesaj(null);
    setHata(null);

    const teknolojiDizisi = form.teknoloji
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    // ÖNEMLİ: Burada girisim tablosunun canlı (onaylı) alanlarına DOKUNMUYORUZ.
    // Değişiklik teklifi sadece bekleyen_veri JSON kolonuna yazılıyor; admin
    // onaylayana kadar herkesin gördüğü kart eski (onaylı) veriyi göstermeye
    // devam eder. Bu, "onay mekanizması olmadan hiçbir güncelleme canlıya
    // geçmez" kuralını sağlamak için gerekli.
    const bekleyenVeri = {
      ad: form.ad,
      sektor: form.sektor || null,
      kisa_aciklama: form.kisa_aciklama || null,
      ekip_buyuklugu: form.ekip_buyuklugu ? Number(form.ekip_buyuklugu) : null,
      teknoloji: teknolojiDizisi,
    };

    const { error } = await supabase
      .from("girisim")
      .update({
        bekleyen_veri: bekleyenVeri,
        durum: "onay_bekliyor",
      })
      .eq("id", seciliId);

    if (error) {
      setHata(error.message);
    } else {
      setMesaj(t.portal.kaydedildiMesaj);
      setGirisimler((prev) =>
        prev.map((g) =>
          g.id === seciliId
            ? { ...g, bekleyen_veri: bekleyenVeri, durum: "onay_bekliyor" }
            : g,
        ),
      );
    }
    setKaydediliyor(false);
  }

  async function yeniGirisimEkle() {
    if (!yeniGirisimForm.ad.trim()) return;
    setYeniGirisimKaydediliyor(true);
    setYeniGirisimMesaj(null);
    setYeniGirisimHata(null);

    const teknolojiDizisi = yeniGirisimForm.teknoloji
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const { data, error } = await supabase
      .from("girisim")
      .insert({
        ad: yeniGirisimForm.ad.trim(),
        sektor: yeniGirisimForm.sektor || null,
        kurulus_yili: yeniGirisimForm.kurulus_yili ? Number(yeniGirisimForm.kurulus_yili) : null,
        kisa_aciklama: yeniGirisimForm.kisa_aciklama || null,
        ekip_buyuklugu: yeniGirisimForm.ekip_buyuklugu
          ? Number(yeniGirisimForm.ekip_buyuklugu)
          : null,
        teknoloji: teknolojiDizisi,
      })
      .select()
      .single();

    if (error) {
      setYeniGirisimHata(error.message);
    } else if (data) {
      setYeniGirisimMesaj(t.portal.girisimEklendiMesaj);
      setYeniGirisimForm(BOS_YENI_GIRISIM_FORM);
      setGirisimler((prev) =>
        [...prev, data as Girisim].sort((a, b) => a.ad.localeCompare(b.ad, "tr")),
      );
    }
    setYeniGirisimKaydediliyor(false);
  }

  async function notEkle() {
    if (!seciliId || !notForm.programId) return;
    setNotKaydediliyor(true);
    setNotMesaj(null);
    setNotHata(null);

    const { error } = await supabase.from("girisim_program_gecmisi").insert({
      girisim_id: seciliId,
      program_id: notForm.programId,
      donem: notForm.donem || null,
      durum: notForm.durum || null,
      onemli_adimlar: notForm.onemliAdimlar || null,
    });

    if (error) {
      setNotHata(error.message);
    } else {
      setNotMesaj(t.portal.notEklendiMesaj);
      setNotForm(BOS_NOT_FORM);
    }
    setNotKaydediliyor(false);
  }

  async function belgeEkle() {
    if (!seciliId || !belgeForm.dosya.trim()) return;
    setBelgeKaydediliyor(true);
    setBelgeMesaj(null);
    setBelgeHata(null);

    const { error } = await supabase.from("dokuman").insert({
      girisim_id: seciliId,
      dosya: belgeForm.dosya.trim(),
      tur: belgeForm.tur || null,
    });

    if (error) {
      setBelgeHata(error.message);
    } else {
      setBelgeMesaj(t.portal.belgeEklendiMesaj);
      setBelgeForm(BOS_BELGE_FORM);
    }
    setBelgeKaydediliyor(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">{baslik}</h1>
      <p className="mt-1 text-sm text-foreground-muted">{aciklama}</p>

      {yukleniyor && <p className="mt-6 text-sm text-foreground-muted">{t.ortak.yukleniyor}</p>}

      {!yukleniyor && girisimler.length === 0 && !hata && (
        <p className="mt-6 text-sm text-foreground-muted">{t.portal.kayitliGirisimYok}</p>
      )}

      {!yukleniyor && girisimler.length > 0 && (
        <div className="mt-6 space-y-4 rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-foreground-muted">
              {t.portal.girisimSec}
            </label>
            <select
              value={seciliId}
              onChange={(e) => girisimSecildi(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
            >
              {girisimler.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.ad}
                </option>
              ))}
            </select>
          </div>

          {bekleyenVarMi && (
            <p className="rounded-lg bg-[var(--warning-soft)] px-3 py-2 text-sm text-warning">
              {t.portal.bekleyenUyari}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground-muted">{t.portal.ad}</label>
            <input
              type="text"
              value={form.ad}
              onChange={(e) => setForm({ ...form, ad: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted">{t.portal.sektor}</label>
            <input
              type="text"
              value={form.sektor}
              onChange={(e) => setForm({ ...form, sektor: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted">
              {t.portal.kisaAciklama}
            </label>
            <textarea
              value={form.kisa_aciklama}
              onChange={(e) => setForm({ ...form, kisa_aciklama: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted">
              {t.portal.ekipBuyuklugu}
            </label>
            <input
              type="number"
              value={form.ekip_buyuklugu}
              onChange={(e) => setForm({ ...form, ekip_buyuklugu: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted">
              {t.portal.teknolojiEtiket}
            </label>
            <input
              type="text"
              value={form.teknoloji}
              onChange={(e) => setForm({ ...form, teknoloji: e.target.value })}
              placeholder={t.portal.teknolojiOrnek}
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
            />
          </div>

          {mesaj && (
            <p className="rounded-lg bg-[var(--success-soft)] px-3 py-2 text-sm text-success">
              {mesaj}
            </p>
          )}
          {hata && (
            <p className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-danger">
              {t.portal.hataOnEk} {hata}
            </p>
          )}

          <button
            onClick={kaydet}
            disabled={kaydediliyor}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {kaydediliyor ? t.portal.kaydediliyor : t.portal.kaydet}
          </button>
        </div>
      )}

      {!yukleniyor && rol === "program_yoneticisi" && (
        <div className="mt-6 rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
          <button
            onClick={() => setYeniGirisimAcik((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-lg font-semibold text-foreground">{t.portal.yeniGirisimEkleBaslik}</span>
            <span className="text-sm text-foreground-muted">
              {yeniGirisimAcik ? t.portal.kapat : t.portal.ac}
            </span>
          </button>

          {yeniGirisimAcik && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted">{t.portal.ad}</label>
                <input
                  type="text"
                  value={yeniGirisimForm.ad}
                  onChange={(e) =>
                    setYeniGirisimForm({ ...yeniGirisimForm, ad: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted">
                  {t.portal.sektor}
                </label>
                <input
                  type="text"
                  value={yeniGirisimForm.sektor}
                  onChange={(e) =>
                    setYeniGirisimForm({ ...yeniGirisimForm, sektor: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted">
                  {t.portal.kurulusYili}
                </label>
                <input
                  type="number"
                  value={yeniGirisimForm.kurulus_yili}
                  onChange={(e) =>
                    setYeniGirisimForm({ ...yeniGirisimForm, kurulus_yili: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted">
                  {t.portal.kisaAciklama}
                </label>
                <textarea
                  value={yeniGirisimForm.kisa_aciklama}
                  onChange={(e) =>
                    setYeniGirisimForm({ ...yeniGirisimForm, kisa_aciklama: e.target.value })
                  }
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted">
                  {t.portal.ekipBuyuklugu}
                </label>
                <input
                  type="number"
                  value={yeniGirisimForm.ekip_buyuklugu}
                  onChange={(e) =>
                    setYeniGirisimForm({ ...yeniGirisimForm, ekip_buyuklugu: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted">
                  {t.portal.teknolojiEtiket}
                </label>
                <input
                  type="text"
                  value={yeniGirisimForm.teknoloji}
                  onChange={(e) =>
                    setYeniGirisimForm({ ...yeniGirisimForm, teknoloji: e.target.value })
                  }
                  placeholder={t.portal.teknolojiOrnek}
                  className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
                />
              </div>

              {yeniGirisimMesaj && (
                <p className="rounded-lg bg-[var(--success-soft)] px-3 py-2 text-sm text-success">
                  {yeniGirisimMesaj}
                </p>
              )}
              {yeniGirisimHata && (
                <p className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-danger">
                  {t.portal.hataOnEk} {yeniGirisimHata}
                </p>
              )}

              <button
                onClick={yeniGirisimEkle}
                disabled={yeniGirisimKaydediliyor || !yeniGirisimForm.ad.trim()}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {yeniGirisimKaydediliyor ? t.portal.ekleniyor : t.portal.girisimEkleButonu}
              </button>
            </div>
          )}
        </div>
      )}

      {!yukleniyor && rol === "program_yoneticisi" && girisimler.length > 0 && (
        <div className="mt-6 space-y-4 rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t.portal.programNotuEkleBaslik}</h2>
            <p className="mt-1 text-sm text-foreground-muted">
              {t.portal.girisimEtiketi} <span className="text-foreground">{seciliGirisim?.ad}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted">
              {t.portal.programSec}
            </label>
            <select
              value={notForm.programId}
              onChange={(e) => setNotForm({ ...notForm, programId: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
            >
              <option value="">{t.portal.secSecenegi}</option>
              {programlar.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.ad}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted">{t.portal.donem}</label>
            <input
              type="text"
              value={notForm.donem}
              onChange={(e) => setNotForm({ ...notForm, donem: e.target.value })}
              placeholder={t.portal.donemOrnek}
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted">{t.portal.durum}</label>
            <input
              type="text"
              value={notForm.durum}
              onChange={(e) => setNotForm({ ...notForm, durum: e.target.value })}
              placeholder={t.portal.durumOrnek}
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted">
              {t.portal.onemliAdimlar}
            </label>
            <textarea
              value={notForm.onemliAdimlar}
              onChange={(e) => setNotForm({ ...notForm, onemliAdimlar: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
            />
          </div>

          {notMesaj && (
            <p className="rounded-lg bg-[var(--success-soft)] px-3 py-2 text-sm text-success">
              {notMesaj}
            </p>
          )}
          {notHata && (
            <p className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-danger">
              {t.portal.hataOnEk} {notHata}
            </p>
          )}

          <button
            onClick={notEkle}
            disabled={notKaydediliyor || !notForm.programId}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {notKaydediliyor ? t.portal.kaydediliyor : t.portal.notEkleButonu}
          </button>
        </div>
      )}

      {!yukleniyor && rol === "startup" && girisimler.length > 0 && (
        <div className="mt-6 space-y-4 rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t.portal.belgeEkleBaslik}</h2>
            <p className="mt-1 text-sm text-foreground-muted">
              {t.portal.girisimEtiketi} <span className="text-foreground">{seciliGirisim?.ad}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted">
              {t.portal.dosyaAdi}
            </label>
            <input
              type="text"
              value={belgeForm.dosya}
              onChange={(e) => setBelgeForm({ ...belgeForm, dosya: e.target.value })}
              placeholder={t.portal.dosyaOrnek}
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted">{t.portal.tur}</label>
            <input
              type="text"
              value={belgeForm.tur}
              onChange={(e) => setBelgeForm({ ...belgeForm, tur: e.target.value })}
              placeholder={t.portal.turOrnek}
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
            />
          </div>

          {belgeMesaj && (
            <p className="rounded-lg bg-[var(--success-soft)] px-3 py-2 text-sm text-success">
              {belgeMesaj}
            </p>
          )}
          {belgeHata && (
            <p className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-danger">
              {t.portal.hataOnEk} {belgeHata}
            </p>
          )}

          <button
            onClick={belgeEkle}
            disabled={belgeKaydediliyor || !belgeForm.dosya.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {belgeKaydediliyor ? t.portal.kaydediliyor : t.portal.belgeEkleBaslik}
          </button>
        </div>
      )}
    </div>
  );
}
