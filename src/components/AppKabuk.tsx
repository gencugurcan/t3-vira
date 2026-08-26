"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useOturum } from "@/context/OturumContext";
import { useRole } from "@/context/RoleContext";
import { useTema } from "@/context/TemaContext";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import type { KullaniciRol } from "@/lib/types";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.JSX.Element;
  roller?: KullaniciRol[];
}[] = [
  { href: "/", label: "Ana Sayfa", icon: IconHome },
  {
    href: "/portal",
    label: "Portal",
    icon: IconEdit,
    roller: ["startup", "program_yoneticisi"],
  },
  { href: "/onay", label: "Onay Kuyruğu", icon: IconCheckSquare, roller: ["super_admin"] },
  {
    href: "/sorgu",
    label: "AI Sorgu",
    icon: IconSparkle,
    roller: ["karar_verici", "super_admin"],
  },
  {
    href: "/rapor",
    label: "Yönetici Raporu",
    icon: IconBarChart,
    roller: ["karar_verici", "super_admin"],
  },
  {
    href: "/karsilastir",
    label: "Karşılaştır",
    icon: IconColumns,
    roller: ["karar_verici", "super_admin"],
  },
];

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function IconEdit({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
function IconCheckSquare({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
function IconSparkle({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.1 2.1M15.6 15.6l2.1 2.1M17.7 6.3l-2.1 2.1M8.4 15.6l-2.1 2.1" />
    </svg>
  );
}
function IconBarChart({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
function IconColumns({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="18" rx="1" />
      <rect x="14" y="3" width="7" height="18" rx="1" />
    </svg>
  );
}
function IconSun({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
    </svg>
  );
}
function IconMoon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}

export function AppKabuk({ children }: { children: React.ReactNode }) {
  const { oturum } = useOturum();
  const { rol } = useRole();
  const { tema, temaDegistir } = useTema();
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

  // /giris kendi sabit koyu tasarımını korumalı; app/layout.tsx'teki inline
  // script bunu sadece ilk yüklemede (hard load) uyguluyor. Next.js'in
  // client-side route geçişlerinde o script tekrar çalışmadığı için, buraya
  // girip çıkarken <html>'i senkronda tutan bu effect gerekiyor — aksi halde
  // /giris'ten ayrılınca (veya girince) tema bir sonraki sayfa yüklenene
  // kadar yanlış kalabilir.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", girisSayfasindaMi ? "dark" : tema);
  }, [girisSayfasindaMi, tema]);

  if (girisSayfasindaMi) {
    return <>{children}</>;
  }

  if (!hazir || !oturum.girisYapildi) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="flex w-60 flex-shrink-0 flex-col border-r border-border-subtle bg-surface">
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <img src="/vira-mark.png" alt="Vira" className="h-6 w-auto" />
            vira
          </Link>
          <button
            type="button"
            onClick={temaDegistir}
            title={tema === "dark" ? "Aydınlık temaya geç" : "Koyu temaya geç"}
            aria-label={tema === "dark" ? "Aydınlık temaya geç" : "Koyu temaya geç"}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {tema === "dark" ? <IconMoon className="h-4 w-4" /> : <IconSun className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.filter((item) => !item.roller || item.roller.includes(rol)).map((item) => {
            const aktif = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 rounded-xl py-2.5 pl-3 pr-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  aktif
                    ? "bg-accent-soft text-foreground"
                    : "text-foreground-muted hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                {aktif && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-accent"
                  />
                )}
                <Icon className={`h-[18px] w-[18px] shrink-0 ${aktif ? "text-accent" : ""}`} />
                <span className="leading-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border-subtle p-3">
          <RoleSwitcher />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
