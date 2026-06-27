import api from "./axios";
import store from "@/store/store";
import { refreshAuth } from "@/features/auth/authThunks";
import { clearAuth, setAccessToken } from "@/features/auth/authSlice";
import {
  getAccessToken,
  setTokens,
  clearTokens,
} from "@/utils/tokenStorage";
import { createDpopProof } from "@/utils/deviceKey";

// Requests to these endpoints must never trigger the refresh-and-retry loop
// (a 401 from /auth/refresh means the session is genuinely over).
const isAuthEndpoint = (url = "") =>
  url.includes("/auth/login") ||
  url.includes("/auth/refresh") ||
  url.includes("/auth/logout");

// Resolve the absolute request URL (for the DPoP `htu` claim). The server only
// compares the PATH, but we sign a full URL so it's a valid `htu`. Handles an
// absolute baseURL (cross-origin backend) or a relative one (same-origin proxy).
const absoluteUrl = (config) => {
  const base = (config.baseURL || "").replace(/\/+$/, "");
  const url = config.url || "";
  if (/^https?:\/\//i.test(url)) return url;
  if (/^https?:\/\//i.test(base)) {
    return `${base}/${url.replace(/^\/+/, "")}`;
  }
  const path = `${base}/${url.replace(/^\/+/, "")}`.replace(/\/{2,}/g, "/");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
};

// Single-flight refresh: while one refresh is in progress, queue other 401s and
// resolve them all once we have a fresh token (or fail them together).
let isRefreshing = false;
let pendingQueue = [];

const flushQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token),
  );
  pendingQueue = [];
};

export const setupInterceptors = () => {
  // Request interceptor — attach (1) the bearer token from localStorage (the
  // source of truth, falling back to the Redux copy) and (2) a fresh DPoP proof
  // signed by the non-extractable device key, binding this request to it.
  api.interceptors.request.use(
    async (config) => {
      if (!config.headers) config.headers = {};
      if (!config.headers.Authorization) {
        const token =
          getAccessToken() || store.getState?.()?.auth?.accessToken || null;
        if (token) config.headers.Authorization = `Bearer ${token}`;
      }
      // Regenerate the proof every time (incl. retries) so iat/jti are fresh and
      // it matches the method/URL actually being sent.
      try {
        config.headers.DPoP = await createDpopProof(
          config.method,
          absoluteUrl(config),
        );
      } catch {
        // Proof generation failed (e.g. no WebCrypto) — send without it; the
        // server will 401 and the user re-authenticates.
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor — (1) capture a server-renewed token, (2) silently
  // refresh on 401 and retry the original request.
  api.interceptors.response.use(
    (response) => {
      // The auth middleware renews an expired token transparently and returns
      // it here; keep localStorage + Redux in sync so the next request uses it.
      const renewed = response?.headers?.["x-new-access-token"];
      if (renewed) {
        setTokens({ accessToken: renewed });
        store.dispatch(setAccessToken(renewed));
      }
      return response;
    },
    async (error) => {
      const original = error.config;
      const status = error.response?.status;

      if (
        status !== 401 ||
        !original ||
        original._retry ||
        isAuthEndpoint(original.url)
      ) {
        return Promise.reject(error);
      }

      original._retry = true;

      // A refresh is already in flight — wait for it, then retry.
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          if (token) {
            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${token}`;
          }
          return api(original);
        });
      }

      isRefreshing = true;
      try {
        // Sends the stored refresh token (x-refresh-token header); updates
        // localStorage + Redux on success.
        const result = await store.dispatch(refreshAuth()).unwrap();
        const newToken = result?.accessToken || null;
        flushQueue(null, newToken);

        if (newToken) {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(original);
      } catch (refreshError) {
        // Refresh failed → the session is really over.
        flushQueue(refreshError, null);
        clearTokens();
        store.dispatch(clearAuth());
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/login")
        ) {
          // Carry the current page along so Login can return the user to it.
          const here = window.location.pathname + window.location.search;
          window.location.assign(`/login?redirect=${encodeURIComponent(here)}`);
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );
};
