import { useCallback, useEffect, useMemo, useState } from 'react';

export type ParamUpdate = Record<string, string | null>;

function applyUpdate(search: string, update: ParamUpdate): string {
  const params = new URLSearchParams(search);
  for (const [key, value] of Object.entries(update)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : window.location.pathname;
}

/**
 * Minimal query-string router. The app only has two screens and its entire
 * state lives in the URL (`?teams=` and `?team=`), so this replaces both
 * SwiftUI's `NavigationLink` stack and the iOS app's UserDefaults persistence
 * without pulling in a router dependency.
 */
export function useSearchParams(): {
  params: URLSearchParams;
  /** Absolute href reflecting `update`, for real `<a href>` links. */
  hrefFor: (update: ParamUpdate) => string;
  /** Client-side navigation: pushes history and re-renders. */
  navigate: (update: ParamUpdate) => void;
} {
  const [search, setSearch] = useState(() => window.location.search);

  useEffect(() => {
    const onPopState = (): void => setSearch(window.location.search);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const params = useMemo(() => new URLSearchParams(search), [search]);

  const hrefFor = useCallback(
    (update: ParamUpdate) => {
      const next = applyUpdate(search, update);
      return next.startsWith('?') ? next : window.location.pathname;
    },
    [search],
  );

  const navigate = useCallback(
    (update: ParamUpdate) => {
      const next = applyUpdate(search, update);
      window.history.pushState(null, '', next);
      setSearch(next.startsWith('?') ? next : '');
      window.scrollTo({ top: 0 });
    },
    [search],
  );

  return { params, hrefFor, navigate };
}
