"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useOturum } from "@/context/OturumContext";
import { RoleSwitcher } from "@/components/RoleSwitcher";

export function AppKabuk({ children }: { children: React.ReactNode }) {
  const { oturum } = useOturum();
  const pathname = usePathname();
  const router = useRouter();
  const girisSayfasindaMi = pathname === "/giris";
  const [hazir, setHazir] = useState(false);

  useEffect(() => {
    setHazir(true);
  }, []);

  useEffect(() => {
    if (hazir && !oturum.girisYapildi && !girisSayfasindaMi) {
      router.replace("/giris");
    }
  }, [hazir, oturum.girisYapildi, girisSayfasindaMi, router]);

  if (girisSayfasindaMi) {
    return <>{children}</>;
  }

  if (!hazir || !oturum.girisYapildi) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border-subtle bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <img src="/vira-mark.png" alt="Vira" className="h-6 w-auto" />
              vira
            </Link>
            <nav className="flex items-center gap-4 text-sm text-foreground-muted">
              <Link href="/" className="transition hover:text-foreground">
                Ana Sayfa
              </Link>
              <Link href="/portal" className="transition hover:text-foreground">
                Portal
              </Link>
              <Link href="/onay" className="transition hover:text-foreground">
                Onay Kuyruğu
              </Link>
              <Link href="/sorgu" className="transition hover:text-foreground">
                AI Sorgu
              </Link>
              <Link href="/rapor" className="transition hover:text-foreground">
                Yönetici Raporu
              </Link>
            </nav>
          </div>
          <RoleSwitcher />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
