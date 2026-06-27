// Auth tokens live in localStorage so the session travels in the
// `Authorization` / `x-refresh-token` HEADERS instead of a cookie.
//
// Why: header-based auth isn't bound by cookie same-site/domain rules, so it
// works when the frontend and backend are on different domains (e.g.
// hr-crm-...-frontend.vercel.app calling hr-...-backend.vercel.app) and on
// mobile browsers that block cross-site cookies. That's the whole reason we
// switched off cookies — there's no shared parent domain to make a cookie
// first-party.
//
// Tradeoff: localStorage is readable by JavaScript, so a token here is exposed
// to XSS (an httpOnly cookie is not). Keep the app XSS-clean (escape rendered
// input, keep deps patched) and this is a standard, accepted setup.

const ACCESS_KEY = "hr_access_token";
const REFRESH_KEY = "hr_refresh_token";

// All access is wrapped in try/catch: localStorage throws in private-mode
// Safari and when storage is disabled. Auth should degrade, not crash.
export const getAccessToken = () => {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
};

export const getRefreshToken = () => {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
};

// Pass only the token(s) you want to change. Passing `null`/"" clears that one;
// omitting a key leaves it untouched.
export const setTokens = ({ accessToken, refreshToken } = {}) => {
  try {
    if (accessToken !== undefined) {
      if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
      else localStorage.removeItem(ACCESS_KEY);
    }
    if (refreshToken !== undefined) {
      if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
      else localStorage.removeItem(REFRESH_KEY);
    }
  } catch {
    /* storage unavailable — ignore */
  }
};

export const clearTokens = () => {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
};
