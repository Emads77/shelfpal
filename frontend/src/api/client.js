import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./tokenStorage.js";
import { logger } from "../shared/logger.js";

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

function levelFor(status) {
  if (status >= 500) return "error";
  if (status === 400 || status === 401) return "debug";
  if (status >= 400) return "warn";
  return "debug";
}

async function send(path, { method = "GET", body, auth = true } = {}) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const token = getAccessToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const started = performance.now();
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    logger.error("Network request failed", {
      method,
      path,
      error,
      duration_ms: Math.round(performance.now() - started),
    });
    throw new ApiError(
      0,
      null,
      "Can't reach the server. Check your connection.",
    );
  }

  const data = await parseJson(response);
  logger[levelFor(response.status)](
    response.ok ? "API request" : "API request failed",
    {
      method,
      path,
      status: response.status,
      duration_ms: Math.round(performance.now() - started),
      request_id: response.headers.get("X-Request-ID"),
    },
  );
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
        logger.info("Session expired");
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
