"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Return type for the {@link useFetch} hook.
 * @template T — The expected shape of the response JSON.
 */
export interface UseFetchResult<T> {
  /** Parsed response data, or `null` while loading / on error. */
  data: T | null;
  /** `true` while the request is in-flight. */
  loading: boolean;
  /** Error message if the request failed, otherwise `null`. */
  error: string | null;
  /** Call to re-fetch the data (cache-bust). */
  refresh: () => void;
}

/**
 * Generic data-fetching hook for a single API endpoint.
 *
 * Automatically cancels in-flight requests when the component unmounts or
 * when `url` / `deps` change.
 *
 * @template T — The expected shape of the response JSON.
 * @param url  - Absolute or relative URL to fetch.
 * @param deps - Additional reactive dependencies that trigger a re-fetch.
 * @param options - Optional configuration.
 * @param options.debounceMs - Delay in milliseconds before issuing the request.
 *   Useful for search inputs where rapid changes should not trigger a fetch per keystroke.
 *
 * @example
 * const { data, loading, error, refresh } = useFetch<Game[]>("/api/games");
 *
 * @example
 * // Debounced search
 * const { data } = useFetch<Game[]>(`/api/games?q=${search}`, [search], { debounceMs: 250 });
 */
export function useFetch<T>(
  url: string,
  deps: unknown[] = [],
  options?: { debounceMs?: number },
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const debounceMs = options?.debounceMs ?? 0;

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

    if (debounceMs > 0) {
      const timer = setTimeout(load, debounceMs);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, refreshKey, debounceMs, ...deps]);

  return { data, loading, error, refresh };
}

/**
 * Return type for the {@link useMultiFetch} hook.
 * @template T — An object whose keys map to different endpoint response shapes.
 */
export interface UseMultiFetchResult<T extends Record<string, unknown>> {
  /** Combined response data (all endpoints), or `null` while loading / on error. */
  data: T | null;
  /** `true` while any request is in-flight. */
  loading: boolean;
  /** Error message if any request failed, otherwise `null`. */
  error: string | null;
  /** Call to re-fetch all endpoints. */
  refresh: () => void;
}

/**
 * Fetches multiple API endpoints in parallel and returns them as a keyed object.
 *
 * All requests are issued simultaneously via `Promise.all`. If any fails,
 * the entire result is treated as an error.
 *
 * @template T — An object type whose keys correspond to endpoint names.
 * @param urls - Object mapping each key of `T` to its URL.
 * @param deps - Additional reactive dependencies that trigger a re-fetch.
 *
 * @example
 * const { data } = useMultiFetch<{ games: Game[]; tables: Table[] }>({
 *   games: "/api/games",
 *   tables: "/api/tables",
 * });
 */
export function useMultiFetch<T extends Record<string, unknown>>(
  urls: Record<keyof T, string>,
  deps: unknown[] = [],
): UseMultiFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const urlsRef = useRef(urls);
  useEffect(() => {
    urlsRef.current = urls;
  });
  const urlKey = JSON.stringify(urls);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!cancelled) setLoading(true);
        if (!cancelled) setError(null);

        const entries = Object.entries(urlsRef.current) as [keyof T, string][];
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
