import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import { setupInterceptors } from "./api/interceptors";
import { useDispatch, useSelector } from "react-redux";
import { refreshAuth } from "./features/auth/authThunks";
import { markInitialized } from "./features/auth/authSlice";
import { getRefreshToken } from "./utils/tokenStorage";
import { getTokenExpiryMs } from "./utils/jwt";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Refresh this long before the access token expires, so a new one is in hand
// before any request can hit a 401.
const REFRESH_SKEW_MS = 60 * 1000; // 1 minute

const App = () => {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.accessToken);

  useEffect(() => {
    setupInterceptors();
  }, []);

  // On load, restore the session from the stored refresh token. Skip the
  // network call entirely if there's nothing stored (fresh visitor / logged
  // out) — just mark the bootstrap done so the router can route to /login.
  useEffect(() => {
    if (getRefreshToken()) {
      dispatch(refreshAuth());
    } else {
      dispatch(markInitialized());
    }
  }, [dispatch]);

  // Proactive refresh: whenever the access token changes, schedule the next
  // refresh just before it expires. The renewed token re-runs this effect, so
  // the session rolls forward on its own while the app stays open — no waiting
  // for a failed request at the 1-day boundary.
  useEffect(() => {
    if (!accessToken) return;
    const expMs = getTokenExpiryMs(accessToken);
    if (!expMs) return;
    const delay = Math.max(expMs - Date.now() - REFRESH_SKEW_MS, 0);
    const timer = setTimeout(() => dispatch(refreshAuth()), delay);
    return () => clearTimeout(timer);
  }, [accessToken, dispatch]);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        pauseOnHover
        style={{ zIndex: 100000 }}
      />
      <AppRoutes />
    </>
  );
};

export default App;
