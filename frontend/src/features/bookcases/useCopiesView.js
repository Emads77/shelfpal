import { useCallback, useEffect, useState } from "react";
import { getCopies, getLibraryOverview } from "./api.js";

export function useCopiesView(shelfId) {
  const key = shelfId === null ? "unassigned" : `shelf-${shelfId}`;
  const [data, setData] = useState(null);
  const [failure, setFailure] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const fetchData = useCallback(async () => {
    const query = shelfId === null ? { unassigned: true } : { shelf: shelfId };
    const [overview, copies] = await Promise.all([
      getLibraryOverview(),
      getCopies(query),
    ]);
    return { key, overview, copies };
  }, [key, shelfId]);

  useEffect(() => {
    let cancelled = false;
    fetchData()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setFailure({ key, err });
      });
    return () => {
      cancelled = true;
    };
  }, [fetchData, key, attempt]);

  const reload = useCallback(async () => {
    try {
      setData(await fetchData());
    } catch (err) {
      setFailure({ key, err });
    }
  }, [fetchData, key]);

  function retry() {
    setFailure(null);
    setAttempt((n) => n + 1);
  }

  const loaded = data !== null && data.key === key;
  const error = failure !== null && failure.key === key ? failure.err : null;

  return {
    overview: loaded ? data.overview : null,
    copies: loaded ? data.copies : [],
    loading: !loaded && !error,
    error,
    retry,
    reload,
  };
}
