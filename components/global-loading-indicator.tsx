"use client";

import {LoaderCircle} from "lucide-react";
import {useEffect, useRef, useState} from "react";

export function GlobalLoadingIndicator() {
  const [visible, setVisible] = useState(false), originalFetch = useRef<typeof window.fetch | null>(null), pending = useRef(0), timer = useRef<number | null>(null);
  useEffect(() => {
    if (originalFetch.current) return;
    originalFetch.current = window.fetch.bind(window);
    window.fetch = async (...args) => {
      pending.current += 1;
      if (timer.current === null) timer.current = window.setTimeout(() => { if (pending.current > 0) setVisible(true); }, 350);
      try { return await originalFetch.current!(...args); }
      finally {
        pending.current = Math.max(0, pending.current - 1);
        if (pending.current === 0) {
          if (timer.current !== null) window.clearTimeout(timer.current);
          timer.current = null;
          setVisible(false);
        }
      }
    };
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      if (originalFetch.current) window.fetch = originalFetch.current;
    };
  }, []);
  return visible ? <div className="global-loading" role="status" aria-live="polite" aria-label="Laden"><div><LoaderCircle size={30} /><span>Laden…</span></div></div> : null;
}
