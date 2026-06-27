import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/images/logo/logo.svg";
import Illustration from "../assets/images/logo/ils1.svg";
import api from "../api/axios";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  role: "",
};

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.phone || !form.role) {
      setErrorMessage("Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await api.post("/auth/signup-request", form);
      setSuccessMessage(
        response?.data?.message ||
          "Signup request submitted successfully. Please wait for admin approval.",
      );
      setForm(initialForm);
      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            toastMessage: "Check your mail to set password.",
          },
        });
      }, 1000);
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

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
            Create your
            <span className="block font-bold">Account Request</span>
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
            <h2 className="text-4xl font-semibold">Sign up</h2>
            <p className="text-gray-500 mt-4 text-base">
              Submit your signup request. Admin approval is required before password setup.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">
                Full Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full h-12 border rounded-md px-4 focus:outline-none focus:ring-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full h-12 border rounded-md px-4 focus:outline-none focus:ring-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">
                Phone
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full h-12 border rounded-md px-4 focus:outline-none focus:ring-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">
                Role
              </label>
              <select
                required
                value={form.role}
                onChange={(e) => handleChange("role", e.target.value)}
                className="w-full h-12 border rounded-md px-4 focus:outline-none focus:ring-1 bg-white"
              >
                <option value="">Select role</option>
                <option value="admin">Admin</option>
                <option value="hr">HR</option>
                <option value="interviewer">Interviewer</option>
              </select>
            </div>

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
              disabled={loading}
              className="w-full h-12 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 disabled:bg-gray-400"
            >
              {loading ? "Submitting..." : "Signup"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-10">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-gray-900">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
