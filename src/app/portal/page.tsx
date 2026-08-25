"use client";

import { useEffect, useState } from "react";
import { useRole } from "@/context/RoleContext";
import { supabase } from "@/lib/supabase";
import type { Girisim } from "@/lib/types";

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

  const [girisimler, setGirisimler] = useState<Girisim[]>([]);
  const [seciliId, setSeciliId] = useState<string>("");
  const [form, setForm] = useState<Form>(BOS_FORM);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    if (rol !== "startup") return;
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

  if (rol !== "startup") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="rounded-lg bg-[var(--warning-soft)] px-4 py-3 text-sm text-warning">
          Bu sayfa sadece Startup rolü içindir.
        </p>
      </div>
    );
  }

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
      setMesaj(
        "Değişiklikler admin onayına gönderildi. Onaylanana kadar ekosistemde eski (onaylı) bilgilerin görünmeye devam edeceğini unutma.",
      );
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">Startup Portalı</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Girişim bilgilerini güncelle. Kaydettiğinde değişiklikler admin onayına düşer.
      </p>

      {yukleniyor && <p className="mt-6 text-sm text-foreground-muted">Yükleniyor...</p>}

      {!yukleniyor && girisimler.length === 0 && !hata && (
        <p className="mt-6 text-sm text-foreground-muted">Kayıtlı girişim bulunamadı.</p>
      )}

      {!yukleniyor && girisimler.length > 0 && (
        <div className="mt-6 space-y-4 rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-foreground-muted">
              Girişim Seç
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
              Bu girişim için gönderdiğin bir değişiklik hâlâ admin onayında. Aşağıda
              son gönderdiğin taslağı görüyorsun; ekosistemde ise onaylanana kadar
              eski (onaylı) bilgiler görünmeye devam ediyor.
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground-muted">Ad</label>
            <input
              type="text"
              value={form.ad}
              onChange={(e) => setForm({ ...form, ad: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted">Sektör</label>
            <input
              type="text"
              value={form.sektor}
              onChange={(e) => setForm({ ...form, sektor: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted">
              Kısa Açıklama
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
              Ekip Büyüklüğü
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
              Teknoloji (virgülle ayır)
            </label>
            <input
              type="text"
              value={form.teknoloji}
              onChange={(e) => setForm({ ...form, teknoloji: e.target.value })}
              placeholder="Örn: Python, React, IoT"
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
              Hata: {hata}
            </p>
          )}

          <button
            onClick={kaydet}
            disabled={kaydediliyor}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {kaydediliyor ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      )}
    </div>
  );
}
