import { useEffect, useState } from "react";
import { getCopy } from "./api.js";

export function useCopy(copyId) {
  const [copy, setCopy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getCopy(copyId)
      .then((data) => {
        if (!cancelled) setCopy(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [copyId, attempt]);

  function retry() {
    setLoadError(null);
    setLoading(true);
    setAttempt((n) => n + 1);
  }

  async function reload() {
    setCopy(await getCopy(copyId));
  }

  return { copy, loading, loadError, retry, reload };
}
