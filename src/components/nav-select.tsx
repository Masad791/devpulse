"use client";

import { useRouter } from "next/navigation";

/** A <select> whose options are URLs: picking one navigates (client-side, so it feels instant). */
export function NavSelect({ label, value, options }: { label: string; value: string; options: [href: string, label: string][] }) {
  const router = useRouter();
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-muted">{label}</span>
      <select value={value} onChange={(e) => router.push(e.target.value)} className="rounded-lg border border-line bg-bg px-2.5 py-1.5 text-sm text-fg">
        {options.map(([href, text]) => (
          <option key={href} value={href}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
