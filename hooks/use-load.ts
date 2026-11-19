"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { friendlyError } from "@/lib/utils/errors";

/** Loads async data once and whenever deps change; exposes loading/error/reload. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[], enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const runId = useRef(0);

  const run = useCallback(async () => {
    const id = ++runId.current;
    setLoading(true);
    try {
      const result = await fnRef.current();
      if (id !== runId.current) return;
      setData(result);
      setError(null);
    } catch (e) {
      if (id !== runId.current) return;
      setError(friendlyError(e));
    } finally {
      if (id === runId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, run, ...deps]);

  return { data, setData, loading, error, reload: run };
}
