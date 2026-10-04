import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../state/useAuth.js";

export default function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <p role="status">Loading...</p>;
  if (status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
