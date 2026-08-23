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

function girisimdenFormaCevir(g: Girisim): Form {
  return {
    ad: g.ad ?? "",
    sektor: g.sektor ?? "",
    kisa_aciklama: g.kisa_aciklama ?? "",
    ekip_buyuklugu: g.ekip_buyuklugu?.toString() ?? "",
    teknoloji: g.teknoloji?.join(", ") ?? "",
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
        <p className="rounded-md bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Bu sayfa sadece Startup rolü içindir.
        </p>
      </div>
    );
  }

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

    const { error } = await supabase
      .from("girisim")
      .update({
        ad: form.ad,
        sektor: form.sektor || null,
        kisa_aciklama: form.kisa_aciklama || null,
        ekip_buyuklugu: form.ekip_buyuklugu ? Number(form.ekip_buyuklugu) : null,
        teknoloji: teknolojiDizisi,
        durum: "onay_bekliyor",
        son_guncelleme: new Date().toISOString().slice(0, 10),
      })
      .eq("id", seciliId);

    if (error) {
      setHata(error.message);
    } else {
      setMesaj("Değişiklikler admin onayına gönderildi.");
      setGirisimler((prev) =>
        prev.map((g) =>
          g.id === seciliId
            ? {
                ...g,
                ad: form.ad,
                sektor: form.sektor || null,
                kisa_aciklama: form.kisa_aciklama || null,
                ekip_buyuklugu: form.ekip_buyuklugu
                  ? Number(form.ekip_buyuklugu)
                  : null,
                teknoloji: teknolojiDizisi,
                durum: "onay_bekliyor",
              }
            : g,
        ),
      );
    }
    setKaydediliyor(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Startup Portalı</h1>
      <p className="mt-1 text-sm text-gray-500">
        Girişim bilgilerini güncelle. Kaydettiğinde değişiklikler admin onayına düşer.
      </p>

      {yukleniyor && <p className="mt-6 text-sm text-gray-500">Yükleniyor...</p>}

      {!yukleniyor && girisimler.length === 0 && !hata && (
        <p className="mt-6 text-sm text-gray-500">Kayıtlı girişim bulunamadı.</p>
      )}

      {!yukleniyor && girisimler.length > 0 && (
        <div className="mt-6 space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Girişim Seç
            </label>
            <select
              value={seciliId}
              onChange={(e) => girisimSecildi(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800"
            >
              {girisimler.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.ad}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Ad</label>
            <input
              type="text"
              value={form.ad}
              onChange={(e) => setForm({ ...form, ad: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sektör</label>
            <input
              type="text"
              value={form.sektor}
              onChange={(e) => setForm({ ...form, sektor: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Kısa Açıklama
            </label>
            <textarea
              value={form.kisa_aciklama}
              onChange={(e) => setForm({ ...form, kisa_aciklama: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ekip Büyüklüğü
            </label>
            <input
              type="number"
              value={form.ekip_buyuklugu}
              onChange={(e) => setForm({ ...form, ekip_buyuklugu: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Teknoloji (virgülle ayır)
            </label>
            <input
              type="text"
              value={form.teknoloji}
              onChange={(e) => setForm({ ...form, teknoloji: e.target.value })}
              placeholder="Örn: Python, React, IoT"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800"
            />
          </div>

          {mesaj && (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
              {mesaj}
            </p>
          )}
          {hata && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
              Hata: {hata}
            </p>
          )}

          <button
            onClick={kaydet}
            disabled={kaydediliyor}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {kaydediliyor ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      )}
    </div>
  );
}
