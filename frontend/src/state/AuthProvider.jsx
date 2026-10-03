import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onSessionExpired } from "../api/client.js";
import { getRefreshToken } from "../api/tokenStorage.js";
import * as authApi from "../features/auth/api.js";
import { AuthContext } from "./authContext.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(
    getRefreshToken() ? "loading" : "anonymous",
  );

  useEffect(() => {
    return onSessionExpired(() => {
      setUser(null);
      setStatus("anonymous");
    });
  }, []);

  useEffect(() => {
    if (!getRefreshToken()) return;
    let cancelled = false;
    authApi
      .fetchMe()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!cancelled) setStatus("anonymous");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    await authApi.login(credentials);
    setUser(await authApi.fetchMe());
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(
    () => ({ user, status, login, logout }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
