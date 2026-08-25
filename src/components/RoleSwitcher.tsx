"use client";

import { useRole } from "@/context/RoleContext";
import type { KullaniciRol } from "@/lib/types";

export function RoleSwitcher() {
  const { rol, setRol, roller } = useRole();

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-foreground-muted">Rol:</span>
      <select
        value={rol}
        onChange={(e) => setRol(e.target.value as KullaniciRol)}
        className="rounded-lg border border-border-subtle bg-surface px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {roller.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
    </div>
  );
}
