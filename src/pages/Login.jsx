import { useState, useEffect, useRef } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../features/auth/authThunks";
import { clearMessages } from "../features/auth/authSlice";
import { toast } from "react-toastify";
import Checkbox from "../components/ui/Checkbox";
import Logo from "../assets/images/logo/logo.svg";
import Illustration from "../assets/images/logo/ils1.svg";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { ROLE_BASED_ROOT_PATH } from "@/utils/constants";

// Only same-app paths are valid callback targets ("/x/y?z="). Anything else
// ("https://evil.com", "//evil.com") is dropped to prevent open redirects.
const safeInternalPath = (p) =>
  typeof p === "string" && p.startsWith("/") && !p.startsWith("//") ? p : null;

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const prevAuth = useRef(false);
  const prevMessage = useRef(null);
  const prevLastLoginAt = useRef(null);
  const redirectTimeoutRef = useRef(null);
  const [checked, setChecked] = useState(false);

  const { isAuthenticated, user, loading, message, lastLoginAt } = useSelector(
    (state) => state.auth,
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Where to land after login: the page the user originally tried to open
  // (via ProtectedRoute state or ?redirect= from the session-expiry redirect),
  // falling back to the role dashboard.
  const postLoginPath = (role) =>
    safeInternalPath(location.state?.from) ||
    safeInternalPath(new URLSearchParams(location.search).get("redirect")) ||
    `/${role}/dashboard`;

  const handleLogin = (e) => {
    try {
      e.preventDefault();
      dispatch(loginUser({ email, password }));
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(
    () =>
      console.log("Auth State:", {
        isAuthenticated,
        user,
        loading,
        message,
        lastLoginAt,
      }),
    [isAuthenticated, user, loading, message, lastLoginAt],
  );

  useEffect(() => {
    if (location.state?.toastMessage) {
      toast.info(location.state.toastMessage);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (message && message !== prevMessage.current) {
      if (!isAuthenticated) {
        toast.error(message);
        dispatch(clearMessages());
      }
      prevMessage.current = message;
    }
    if (!message) {
      prevMessage.current = null;
    }

    if (!prevAuth.current && isAuthenticated && user?.role) {
      if (lastLoginAt && lastLoginAt !== prevLastLoginAt.current) {
        toast.success("Login successful");
        dispatch(clearMessages());
        redirectTimeoutRef.current = setTimeout(() => {
          navigate(postLoginPath(user.role), { replace: true });
          redirectTimeoutRef.current = null;
        }, 2000);
      } else {
        navigate(postLoginPath(user.role), { replace: true });
      }
    }

    if (prevAuth.current && isAuthenticated && user?.role) {
      navigate(postLoginPath(user.role), { replace: true });
    }

    if (prevAuth.current && !isAuthenticated) {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    }

    prevAuth.current = isAuthenticated;
    prevLastLoginAt.current = lastLoginAt;

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, [message, isAuthenticated, user, navigate, dispatch, lastLoginAt]);

  return (
    <div className="loginwrapper min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 relative bg-gray-100">
        <div className="max-w-[520px] pt-10 pl-20 z-10">
          <Link to="/">
            <span className="text-2xl font-bold text-slate-900">
              Helpaana <span className="text-primary-600 font-semibold">HR Portal</span>
            </span>
          </Link>
          <h4 className="text-3xl font-semibold text-gray-900">
            Unlock your HR
            <span className="block font-bold">Performance</span>
          </h4>
        </div>
        <img
          src={Illustration}
          alt=""
          className="absolute bottom-0 left-0 w-full h-full object-contain"
        />
      </div>

      {/* Right panel (form) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white">
        <div className="w-full max-w-md px-6 pb-24">
          <div className="text-center mb-8">
            <div className="lg:hidden flex justify-center mb-6">
              <Link to="/">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  Helpaana <span className="text-primary-600 font-semibold">HR Portal</span>
                </span>
              </Link>
            </div>
            <h2 className="text-4xl font-semibold">Sign in</h2>
            <p className="text-gray-500 mt-4 text-xl">
              Login to your HR management system
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 border rounded-md px-4 focus:outline-none focus:ring-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 border rounded-md px-4 pr-12 focus:outline-none focus:ring-1"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Checkbox
                value={checked}
                onChange={() => setChecked(!checked)}
                label="Keep me signed in"
              />

              <Link
                to="/forgot-password"
                className="text-sm text-slate-800 dark:text-slate-400 leading-6 font-medium"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 disabled:bg-gray-400"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-10">
            Don’t have an account?{" "}
            <Link to="/signup" className="font-medium text-gray-900">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function isLoggedIn() {
  const { isAuthenticated, user, loading, message, lastLoginAt } = useSelector(
    (state) => state.auth,
  );
  const location = useLocation();

  // if (loading && !isAuthenticated) {
  //   return null; // or a loading spinner
  // }
  if (!isAuthenticated && !user?.role) {
    return <LoginPage />;
  }
  // Already signed in — honor a pending callback URL, else go to the dashboard.
  const redirect =
    safeInternalPath(location.state?.from) ||
    safeInternalPath(new URLSearchParams(location.search).get("redirect"));
  const getBaseLink = loading
    ? "#"
    : redirect || ROLE_BASED_ROOT_PATH[user?.role] || "#";
  return <Navigate to={getBaseLink} replace />;
}
