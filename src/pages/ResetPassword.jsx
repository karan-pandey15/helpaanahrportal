import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import Logo from "../assets/images/logo/logo.svg";
import Illustration from "../assets/images/logo/ils1.svg";
import api from "../api/axios";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isInvalidLink = !email || !token;

  async function handleSubmit(e) {
    e.preventDefault();

    if (isInvalidLink) {
      setErrorMessage("Invalid password reset link. Please request a new one.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await api.post("/auth/reset-password", {
        email,
        token,
        newPassword,
      });

      setSuccessMessage(
        response?.data?.message ||
          "Password reset successful. You can now login with your new password.",
      );
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1800);
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="loginwrapper min-h-screen flex">
      <div className="hidden lg:flex w-1/2 relative bg-gray-100">
        <div className="max-w-[520px] pt-10 pl-20 z-10">
          <Link to="/login">
            <span className="text-2xl font-bold text-slate-900">
              Helpaana <span className="text-primary-600 font-semibold">HR Portal</span>
            </span>
          </Link>
          <h4 className="text-3xl font-semibold text-gray-900">
            Create a new
            <span className="block font-bold">Password</span>
          </h4>
        </div>
        <img
          src={Illustration}
          alt=""
          className="absolute bottom-0 left-0 w-full h-full object-contain"
        />
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white">
        <div className="w-full max-w-md px-6 pb-24">
          <div className="text-center mb-8">
            <div className="lg:hidden flex justify-center mb-6">
              <Link to="/login">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  Helpaana <span className="text-primary-600 font-semibold">HR Portal</span>
                </span>
              </Link>
            </div>
            <h2 className="text-4xl font-semibold">Reset Password</h2>
            <p className="text-gray-500 mt-4 text-base">
              Set a new password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errorMessage) {
                      setErrorMessage("");
                    }
                  }}
                  className="w-full h-12 border rounded-md px-4 pr-12 focus:outline-none focus:ring-1"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  aria-label={
                    showNewPassword ? "Hide password" : "Show password"
                  }
                >
                  {showNewPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) {
                      setErrorMessage("");
                    }
                  }}
                  className="w-full h-12 border rounded-md px-4 pr-12 focus:outline-none focus:ring-1"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                </button>
              </div>
            </div>

            {isInvalidLink ? (
              <p className="text-sm text-red-700 bg-red-50 p-3 rounded-md">
                Invalid password reset link. Please request a new one.
              </p>
            ) : null}

            {errorMessage ? (
              <p className="text-sm text-red-700 bg-red-50 p-3 rounded-md">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="text-sm text-green-700 bg-green-50 p-3 rounded-md">
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading || isInvalidLink}
              className="w-full h-12 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 disabled:bg-gray-400"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-10">
            Back to{" "}
            <Link to="/login" className="font-medium text-gray-900">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
