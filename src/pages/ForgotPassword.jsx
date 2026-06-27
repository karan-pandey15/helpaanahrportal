import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../assets/images/logo/logo.svg";
import Illustration from "../assets/images/logo/ils1.svg";
import api from "../api/axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setErrorMessage("Email is required");
      setSuccessMessage("");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await api.post("/auth/forgot-password", {
        email: normalizedEmail,
      });

      setSubmitted(true);
      setSuccessMessage(
        response?.data?.message ||
          "If an account with that email exists, a password reset link has been sent.",
      );
    } catch (error) {
      setSubmitted(false);
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
            Reset your
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
            <h2 className="text-4xl font-semibold">Forgot Password</h2>
            <p className="text-gray-500 mt-4 text-base">
              Enter your email address and we&apos;ll send you reset
              instructions.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) {
                    setErrorMessage("");
                  }
                }}
                className="w-full h-12 border rounded-md px-4 focus:outline-none focus:ring-1"
              />
            </div>

            {errorMessage ? (
              <p className="text-sm text-red-700 bg-red-50 p-3 rounded-md">
                {errorMessage}
              </p>
            ) : null}

            {submitted && successMessage ? (
              <p className="text-sm text-green-700 bg-green-50 p-3 rounded-md">
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 disabled:bg-gray-400"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-10">
            Remembered your password?{" "}
            <Link to="/login" className="font-medium text-gray-900">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
