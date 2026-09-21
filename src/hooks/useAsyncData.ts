import { useCallback, useEffect, useState } from 'react';
import { describeError, isAbortError } from '../lib/http';

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Loads data on mount and whenever `loader` changes, cancelling the in-flight
 * request on unmount or reload. Callers must memoize `loader` with `useCallback`.
 *
 * This covers the `isLoading` / `errorMessage` `@State` pair plus the `.task`
 * and `.refreshable` modifiers the SwiftUI views used.
 */
export function useAsyncData<T>(loader: (signal: AbortSignal) => Promise<T>): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setIsLoading(true);
    setError(null);

    loader(controller.signal)
      .then((result) => {
        if (!active) return;
        setData(result);
        setIsLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active || isAbortError(cause)) return;
        setError(`Failed to load games: ${describeError(cause)}`);
        setIsLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [loader, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return { data, isLoading, error, reload };
}
