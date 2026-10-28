import { createContext, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const PhonePortalContext = createContext<HTMLElement | null>(null);

export function PhoneFrame({ children, dock }: { children: ReactNode; dock?: ReactNode }) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  return (
    <div className="flex min-h-[100dvh] justify-center bg-[#e6e6ea]">
      <div ref={setNode} className="relative h-[100dvh] w-full max-w-[430px] overflow-hidden bg-white">
        <PhonePortalContext.Provider value={node}>
          <div className="h-full overflow-x-hidden overflow-y-auto">{children}</div>
          {dock}
        </PhonePortalContext.Provider>
      </div>
    </div>
  );
}

export function PhoneOverlay({ children }: { children: ReactNode }) {
  const node = useContext(PhonePortalContext);
  if (!node) return null;
  return createPortal(children, node);
}
