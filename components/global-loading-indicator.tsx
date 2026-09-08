"use client";

import {LoaderCircle} from "lucide-react";
import {useEffect, useRef, useState} from "react";

export function GlobalLoadingIndicator() {
  const [pending, setPending] = useState(0), originalFetch = useRef<typeof window.fetch | null>(null);
  useEffect(() => {
    if (originalFetch.current) return;
    originalFetch.current = window.fetch.bind(window);
    window.fetch = async (...args) => {
      setPending(value => value + 1);
      try { return await originalFetch.current!(...args); }
      finally { setPending(value => Math.max(0, value - 1)); }
    };
    return () => { if (originalFetch.current) window.fetch = originalFetch.current; };
  }, []);
  return pending > 0 ? <div className="global-loading" role="status" aria-live="polite" aria-label="Laden"><LoaderCircle size={26} /></div> : null;
}
