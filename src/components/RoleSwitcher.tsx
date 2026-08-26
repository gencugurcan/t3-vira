"use client";

import { useRouter } from "next/navigation";
import { useRole } from "@/context/RoleContext";
import { useOturum } from "@/context/OturumContext";
import { useCeviri } from "@/lib/ceviriler";

export function RoleSwitcher() {
  const t = useCeviri();
  const { rol } = useRole();
  const { oturum, cikisYap } = useOturum();
  const router = useRouter();

  const rolEtiketi = t.ortak.roller[rol] ?? rol;

  function cikisYapiliyor() {
    cikisYap();
    router.replace("/giris");
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="leading-tight">
        <p className="text-foreground">
          {t.ortak.tekrarHosGeldin}, {oturum.ad}
        </p>
        <p className="text-xs text-foreground-muted">{rolEtiketi}</p>
      </div>
      <button
        onClick={cikisYapiliyor}
        className="w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-1.5 text-left text-foreground-muted transition hover:text-foreground"
      >
        {t.ortak.cikisYap}
      </button>
    </div>
  );
}
