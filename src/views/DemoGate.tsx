import { useEffect, useState } from "react";
import { StatusBar, Wordmark } from "../components/chrome";
import { MoreIcon } from "../components/icons";
import { PhoneOverlay } from "../components/PhoneFrame";

export function DemoGate({ onEnter }: { onEnter: () => void }) {
  const [ready, setReady] = useState(false);
  const [about, setAbout] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <PhoneOverlay>
      <div className="absolute inset-0 z-[45] flex flex-col bg-brand text-primary-foreground">
        <StatusBar />
        {ready ? (
          <>
            <div className="relative flex items-start justify-center pt-[42px]">
              <Wordmark size={21} />
              <button
                type="button"
                className="absolute top-9 right-4"
                aria-label="More options"
                aria-expanded={about}
                onClick={() => setAbout((value) => !value)}
              >
                <MoreIcon />
              </button>
            </div>
            {about && (
              <p className="px-6 pt-6 text-center text-[13px] leading-5">
                Unofficial demo recreation. Not operated by Virgin Money. No sign-in and no access to a real account.
              </p>
            )}
            <div className="flex-1" />
            <div className="px-4 pb-[64px]">
              <button
                type="button"
                onClick={onEnter}
                className="h-[52px] w-full rounded-[8px] bg-background text-[14px] font-semibold text-brand"
              >
                Continue demo
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center pb-16">
            <Wordmark size={34} />
          </div>
        )}
      </div>
    </PhoneOverlay>
  );
}
