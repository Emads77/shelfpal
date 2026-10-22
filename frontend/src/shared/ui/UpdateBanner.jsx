import { useEffect, useState } from "react";
import "./update-banner.css";

const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION;
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

export default function UpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!CURRENT_VERSION || CURRENT_VERSION === "dev") return undefined;

    async function checkVersion() {
      try {
        const response = await fetch("/version.json", { cache: "no-store" });
        if (!response.ok) return;
        const { version } = await response.json();
        if (version && version !== CURRENT_VERSION) setUpdateAvailable(true);
      } catch {
        // Offline or mid deploy: the next check tries again.
      }
    }

    function checkWhenVisible() {
      if (document.visibilityState === "visible") checkVersion();
    }

    const intervalId = setInterval(checkVersion, CHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", checkWhenVisible);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", checkWhenVisible);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="update-banner" role="status">
      <span>A new version of ShelfPal is available.</span>
      <button type="button" onClick={() => window.location.reload()}>
        Reload
      </button>
    </div>
  );
}
