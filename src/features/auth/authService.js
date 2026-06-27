import api from "../../api/axios";
import { setTokens, clearTokens, getRefreshToken } from "../../utils/tokenStorage";

const login = async (data) => {
  const res = await api.post("/auth/login", data);
  // Persist both tokens so the session survives a reload without depending on a
  // cookie (which mobile blocks when frontend and backend are different domains).
  setTokens({
    accessToken: res.data?.accessToken,
    refreshToken: res.data?.refreshToken,
  });
  return res.data;
};

const refreshToken = async () => {
  // Send the stored refresh token in a header so the server doesn't rely on the
  // cookie. (Backend still falls back to the cookie for legacy sessions.)
  const stored = getRefreshToken();
  const res = await api.post("/auth/refresh", null, {
    headers: stored ? { "x-refresh-token": stored } : undefined,
  });
  if (res.data?.accessToken) setTokens({ accessToken: res.data.accessToken });
  return res.data;
};

const logout = async () => {
  const stored = getRefreshToken();
  try {
    const res = await api.post("/auth/logout", null, {
      headers: stored ? { "x-refresh-token": stored } : undefined,
    });
    return res.data;
  } finally {
    // Always clear local tokens, even if the network call fails.
    clearTokens();
  }
};

export default {
  login,
  refreshToken,
  logout,
};
