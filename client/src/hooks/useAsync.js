import { useCallback, useEffect, useRef, useState } from 'react';

// Runs an async function and tracks { data, loading, error }.
// `deps` re-runs it; `reload()` runs it again on demand.
export function useAsync(asyncFn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const callId = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(asyncFn, deps);

  const execute = useCallback(async () => {
    const id = ++callId.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await run();
      if (id === callId.current) setState({ data, loading: false, error: null });
    } catch (error) {
      if (id === callId.current) setState((prev) => ({ ...prev, loading: false, error }));
    }
  }, [run]);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, reload: execute, setData: (updater) => setState((prev) => ({ ...prev, data: typeof updater === 'function' ? updater(prev.data) : updater })) };
}
