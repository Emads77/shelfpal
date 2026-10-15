import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./tokenStorage.js";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

export class ApiError extends Error {
  constructor(status, data, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

let sessionExpiredHandler = () => {};
export function onSessionExpired(handler) {
  sessionExpiredHandler = handler;
  return () => {
    sessionExpiredHandler = () => {};
  };
}

async function send(path, { method = "GET", body, auth = true } = {}) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const token = getAccessToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      null,
      "Can't reach the server. Check your connection.",
    );
  }

  const data = await parseJson(response);
  return { response, data };
}

let refreshPromise = null;

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function doRefresh() {
  const refresh = getRefreshToken();
  const { response, data } = await send("/auth/refresh/", {
    method: "POST",
    body: { refresh },
    auth: false,
  });
  if (!response.ok) {
    if (response.status === 401) clearTokens();
    throw new ApiError(response.status, data, "Token refresh failed");
  }
  setTokens({ access: data.access, refresh: data.refresh ?? refresh });
}

export async function apiRequest(path, options = {}) {
  let { response, data } = await send(path, options);

  if (response.status === 401 && options.auth !== false && getRefreshToken()) {
    try {
      await refreshAccessToken();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        sessionExpiredHandler();
        throw new ApiError(401, data, "Session expired");
      }
      throw err;
    }
    ({ response, data } = await send(path, options));
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data,
      `Request failed (${response.status})`,
    );
  }
  return data;
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
