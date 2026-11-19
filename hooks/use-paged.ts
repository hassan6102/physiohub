"use client";

import { getDocs, limit, query, startAfter, type Query, type QueryDocumentSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import { fromSnap } from "@/services/base";
import { friendlyError } from "@/lib/utils/errors";

type Options = {
  /** Builds the base query (filters + orderBy). Pagination is added by the hook. */
  build: () => Query;
  pageSize?: number;
  /** Re-run from the first page when any of these change. */
  deps: unknown[];
  enabled?: boolean;
};

export function usePaged<T extends { id: string }>({ build, pageSize = 20, deps, enabled = true }: Options) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cursor = useRef<QueryDocumentSnapshot | null>(null);
  const buildRef = useRef(build);
  buildRef.current = build;
  const runId = useRef(0);

  const fetchPage = useCallback(
    async (reset: boolean) => {
      const id = ++runId.current;
      if (reset) {
        cursor.current = null;
        setLoading(true);
      } else setLoadingMore(true);
      try {
        const base = buildRef.current();
        const q = cursor.current
          ? query(base, startAfter(cursor.current), limit(pageSize))
          : query(base, limit(pageSize));
        const snap = await getDocs(q);
        if (id !== runId.current) return;
        const next = snap.docs.map((d) => fromSnap<T>(d));
        cursor.current = snap.docs[snap.docs.length - 1] ?? cursor.current;
        setItems((prev) => (reset ? next : [...prev, ...next]));
        setHasMore(snap.docs.length === pageSize);
        setError(null);
      } catch (e) {
        if (id !== runId.current) return;
        setError(friendlyError(e));
      } finally {
        if (id === runId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [pageSize]
  );

  useEffect(() => {
    if (!enabled) return;
    void fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fetchPage, ...deps]);

  return {
    items,
    setItems,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore: () => fetchPage(false),
    reload: () => fetchPage(true),
  };
}
