import type { ReactNode } from "react";

export function TransactionDateGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="bg-[#f3f3f5] px-4 py-1.5 text-[12px] font-medium text-[#6b6b70]">{label}</h2>
      {children}
    </section>
  );
}
