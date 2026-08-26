"use client";

import { useEffect, useState } from "react";
import { useRole } from "@/context/RoleContext";
import { useOturum } from "@/context/OturumContext";
import { supabase } from "@/lib/supabase";
import { useCeviri } from "@/lib/ceviriler";
import type { Kullanici, KullaniciRol } from "@/lib/types";

export default function KullanicilarSayfasi() {
  const t = useCeviri();
  const { rol, roller } = useRole();
  const { oturum } = useOturum();

  const [kullanicilar, setKullanicilar] = useState<Kullanici[]>([]);
  const [callerEposta, setCallerEposta] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [guncellenenId, setGuncellenenId] = useState<string | null>(null);

  // onay/portal/sorgu sayfalarındaki "mount'ta veri çek" deseniyle aynı;
  // eslint-plugin-react-hooks'un yeni (deneysel) immutability kuralı diğer
  // sayfalarda derleyicinin başka desenlerde erken vazgeçmesi yüzünden hiç
  // tetiklenmiyor, burada tetikleniyor — davranış aynı, bilinçli susturuluyor.
  useEffect(() => {
    if (rol !== "super_admin") return;
    // eslint-disable-next-line react-hooks/immutability
    listeyiGetir();
  }, [rol]);

  async function listeyiGetir() {
    setYukleniyor(true);
    setHata(null);
    // kullanici_public: sifre_hash İÇERMEYEN view (bkz. supabase_schema.sql)
    const { data, error } = await supabase
      .from("kullanici_public")
      .select("*")
      .order("ad");
    if (error) {
      setHata(error.message);
      setYukleniyor(false);
      return;
    }
    const liste = (data ?? []) as Kullanici[];
    setKullanicilar(liste);
    setCallerEposta(liste.find((k) => k.ad === oturum.ad)?.eposta ?? null);
    setYukleniyor(false);
  }

  async function rolGuncelle(hedefId: string, yeniRol: KullaniciRol) {
    if (!callerEposta) {
      setHata(t.kullanicilar.kimlikDogrulanamadi);
      return;
    }
    setHata(null);
    setGuncellenenId(hedefId);
    try {
      const res = await fetch("/api/rol-guncelle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callerEposta, hedefId, yeniRol }),
      });
      const veri = await res.json();
      if (!res.ok) throw new Error(veri.error ?? t.kullanicilar.rolGuncellenemedi);
      setKullanicilar((prev) =>
        prev.map((k) => (k.id === hedefId ? { ...k, rol: yeniRol } : k)),
      );
    } catch (err) {
      setHata(err instanceof Error ? err.message : t.ortak.bilinmeyenHata);
    } finally {
      setGuncellenenId(null);
    }
  }

  if (rol !== "super_admin") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="rounded-lg bg-[var(--warning-soft)] px-4 py-3 text-sm text-warning">
          {t.ortak.sadeceSuperAdmin}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold text-foreground">{t.kullanicilar.baslik}</h1>
      <p className="mb-6 text-sm text-foreground-muted">
        {t.kullanicilar.aciklama}
      </p>

      {hata && (
        <p className="mb-4 rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-danger">
          {hata}
        </p>
      )}

      {yukleniyor ? (
        <p className="text-sm text-foreground-muted">{t.ortak.yukleniyor}</p>
      ) : kullanicilar.length === 0 ? (
        <p className="text-sm text-foreground-muted">{t.kullanicilar.bosDurum}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border-subtle">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-foreground-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t.kullanicilar.ad}</th>
                <th className="px-4 py-3 font-medium">{t.kullanicilar.eposta}</th>
                <th className="px-4 py-3 font-medium">{t.kullanicilar.rol}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {kullanicilar.map((k) => (
                <tr key={k.id}>
                  <td className="px-4 py-3 text-foreground">
                    {k.ad}
                    {k.rol === "basvuran" && (
                      <span className="ml-2 rounded-full bg-[var(--warning-soft)] px-2 py-0.5 text-xs text-warning">
                        {t.ortak.roller.basvuran}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground-muted">{k.eposta}</td>
                  <td className="px-4 py-3">
                    <select
                      value={k.rol}
                      disabled={guncellenenId === k.id}
                      onChange={(e) => rolGuncelle(k.id, e.target.value as KullaniciRol)}
                      className="rounded-lg border border-border-subtle bg-surface-2 px-2 py-1 text-sm text-foreground disabled:opacity-50"
                    >
                      {roller.map((r) => (
                        <option key={r.value} value={r.value}>
                          {t.ortak.roller[r.value]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
