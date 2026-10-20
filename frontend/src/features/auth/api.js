import { apiRequest } from "../../api/client.js";
import {
  clearTokens,
  getRefreshToken,
  setTokens,
} from "../../api/tokenStorage.js";

export function register({ username, email, password }) {
  return apiRequest("/auth/register/", {
    method: "POST",
    body: { username, email, password },
    auth: false,
  });
}

export async function login({ email, password }) {
  const tokens = await apiRequest("/auth/login/", {
    method: "POST",
    body: { email: email.trim().toLowerCase(), password },
    auth: false,
  });
  setTokens({ access: tokens.access, refresh: tokens.refresh });
}

export async function logout() {
  const refresh = getRefreshToken();
  try {
    if (refresh) {
      await apiRequest("/auth/logout/", {
        method: "POST",
        body: { refresh },
        auth: false,
      });
    }
  } catch {
    //Clears locally even if the server can't be reached
  }
  clearTokens();
}

export function fetchMe() {
  return apiRequest("/auth/me/");
}
