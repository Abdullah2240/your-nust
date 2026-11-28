// Tiny data-loading hook used by the Projects, Carpool and Requests pages.
// const { data, error, loading, reload } = useApi(() => api.get('/projects', { page }), [page]);
import { useCallback, useEffect, useRef, useState } from 'react';

export function useApi(loader, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const latest = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(() => {
    const id = ++latest.current;
    setState((s) => ({ ...s, error: null, loading: true }));
    return loader()
      .then((data) => id === latest.current && setState({ data, error: null, loading: false }))
      .catch((error) => id === latest.current && setState({ data: null, error, loading: false }));
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}
