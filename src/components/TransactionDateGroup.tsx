import type { ReactNode } from "react";

export function TransactionDateGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="bg-[#f8f8fa] px-4 py-2 text-[14px] leading-5 font-normal text-[#6e6e73]">{label}</h2>
      {children}
    </section>
  );
}
