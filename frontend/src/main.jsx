import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import "./index.css";
import "./shared/ui/form.css";
import { router } from "./app/router.jsx";
import { AuthProvider } from "./state/AuthProvider.jsx";
import { installGlobalErrorLogging, logger } from "./shared/logger.js";
import { initFaro } from "./shared/faro.js";
import UpdateBanner from "./shared/ui/UpdateBanner.jsx";
import OfflineBanner from "./shared/ui/OfflineBanner.jsx";
import EnvironmentBadge from "./shared/ui/EnvironmentBadge.jsx";
initFaro();
installGlobalErrorLogging();

createRoot(document.getElementById("root"), {
  onUncaughtError: (error, info) =>
    logger.error("Uncaught render error", {
      error,
      component_stack: info.componentStack,
    }),
  onCaughtError: (error, info) =>
    logger.error("Render error caught by boundary", {
      error,
      component_stack: info.componentStack,
    }),
}).render(
  <StrictMode>
    <AuthProvider>
      <EnvironmentBadge />
      <RouterProvider router={router} />
      <UpdateBanner />
      <OfflineBanner />
    </AuthProvider>
  </StrictMode>,
);
