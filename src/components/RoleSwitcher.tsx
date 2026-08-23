"use client";

import { useRole } from "@/context/RoleContext";
import type { KullaniciRol } from "@/lib/types";

export function RoleSwitcher() {
  const { rol, setRol, roller } = useRole();

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500">Rol:</span>
      <select
        value={rol}
        onChange={(e) => setRol(e.target.value as KullaniciRol)}
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-800"
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
