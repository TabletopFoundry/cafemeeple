"use client";

import { useState, useEffect, useCallback } from "react";

export interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useFetch<T>(url: string, deps: unknown[] = []): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!cancelled) setLoading(true);
        if (!cancelled) setError(null);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load data from ${url}`);
        }
        const json = (await response.json()) as T;
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, refreshKey, ...deps]);

  return { data, loading, error, refresh };
}

export interface UseMultiFetchResult<T extends Record<string, unknown>> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useMultiFetch<T extends Record<string, unknown>>(
  urls: Record<keyof T, string>,
  deps: unknown[] = [],
): UseMultiFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const urlEntries = Object.entries(urls);
  const urlKey = urlEntries.map(([k, v]) => `${k}:${v}`).join("|");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!cancelled) setLoading(true);
        if (!cancelled) setError(null);

        const entries = Object.entries(urls) as [keyof T, string][];
        const responses = await Promise.all(entries.map(([, url]) => fetch(url)));

        for (const res of responses) {
          if (!res.ok) throw new Error("Failed to load data");
        }

        const results = await Promise.all(responses.map((r) => r.json()));
        const result = Object.fromEntries(entries.map(([key], i) => [key, results[i]])) as T;

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlKey, refreshKey, ...deps]);

  return { data, loading, error, refresh };
}
