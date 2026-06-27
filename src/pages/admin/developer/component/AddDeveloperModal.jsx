import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import addDeveloperService from "../../../../features/user/addDeveloperService";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AddDeveloperModal = ({ onClose, editUser }) => {
  const { loading } = useSelector((s) => s.users || { loading: false });

  const [email, setEmail] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (editUser) {
      setEmail(editUser.email || "");
    }
  }, [editUser]);

  const handleSubmitWrapper = async (e) => {
    e.preventDefault();
    if (formLoading) return;
    setFormLoading(true);
    try {
      if (!emailRegex.test(email)) {
        toast.error("Valid email is required");
        setFormLoading(false);
        return;
      }
      // Call service to send email invite
      await addDeveloperService.addDeveloper({ email });
      toast.success(
        "Invitation sent! Developer will receive a link to fill details.",
      );
      onClose?.();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Something went wrong",
      );
    } finally {
      setFormLoading(false);
    }
  };
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const submitBtnLabel = loading || formLoading ? "Adding..." : "Add Developer";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold">Add Developer</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmitWrapper} className="p-6 space-y-5">
          <div>
            <label className="block mb-1 text-sm text-slate-700 dark:text-slate-300">
              Email Address <span className="text-danger-500">*</span>
            </label>
            <input
              type="email"
              placeholder="Enter developer email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formLoading}
              className="btn btn-primary"
            >
              {submitBtnLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDeveloperModal;
