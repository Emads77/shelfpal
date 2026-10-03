const REFRESH_KEY = "shelfpal_refresh";

let accessToken = null;

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setTokens({ access, refresh }) {
  accessToken = access;
  if (refresh) {
    try {
      return localStorage.setItem(REFRESH_KEY, refresh);
    } catch {
      // If storage is unavailable, the session will not survive reloading
    }
  }
}

export function clearTokens() {
  accessToken = null;
  try {
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    // Nothing to clear
  }
}
