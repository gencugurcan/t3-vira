"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/context/RoleContext";
import { useOturum } from "@/context/OturumContext";
import type { KullaniciRol } from "@/lib/types";

export default function GirisSayfasi() {
  const router = useRouter();
  const { setRol } = useRole();
  const { girisYap } = useOturum();
  const [eposta, setEposta] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function girisYapiliyor(e: React.FormEvent) {
    e.preventDefault();
    setYukleniyor(true);
    setHata(null);
    try {
      const res = await fetch("/api/giris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eposta, sifre }),
      });
      const veri = await res.json();
      if (!res.ok) throw new Error(veri.error ?? "Giriş başarısız");
      setRol(veri.rol as KullaniciRol);
      girisYap(veri.ad as string);
      router.replace("/");
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <img src="/vira-mark.png" alt="Vira" className="h-10 w-auto" />
          <span className="text-xl font-semibold text-foreground">vira</span>
          <p className="text-sm text-foreground-muted">Girişim ekosistemi yönetim sistemi</p>
        </div>

        <form
          onSubmit={girisYapiliyor}
          className="space-y-4 rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm"
        >
          <div>
            <label className="block text-sm font-medium text-foreground-muted">
              E-posta
            </label>
            <input
              type="email"
              required
              autoFocus
              value={eposta}
              onChange={(e) => setEposta(e.target.value)}
              placeholder="ornek@t3vira.app"
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted">
              Şifre
            </label>
            <input
              type="password"
              required
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground"
            />
          </div>

          {hata && (
            <p className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-danger">
              {hata}
            </p>
          )}

          <button
            type="submit"
            disabled={yukleniyor}
            className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {yukleniyor ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
