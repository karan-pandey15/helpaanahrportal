import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addUser,
  getAllUsers,
  updateUser,
} from "../../../../features/user/userThunks";
import { toast } from "react-toastify";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AddUser = ({ onClose, editUser }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.users || { loading: false });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (editUser) {
      setName(editUser.name || "");
      setEmail(editUser.email || "");
      setPhone(editUser.phone || "");
      setStatus(editUser.role || "");
    }
  }, [editUser]);

  const handleSubmitWrapper = async (e) => {
    e.preventDefault();
    try {
      console.log(formLoading, "loading---");
      if (formLoading) return;
      setFormLoading(true);
      await handleSubmit(e);
    } catch (error) {
      console.error("Error in handleSubmitWrapper:", error);
      setFormLoading(false);
      toast.error(error.message || "An error occurred");
    } finally {
      setFormLoading(false); // Commenting this because this component parent is getting refreshed after handleSubmit
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required");
    if (!emailRegex.test(email)) return toast.error("Valid email is required");
    if (!status) return toast.error("Role is required");

    try {
      let focusUserId = null;
      let isAdd = false;

      if (editUser) {
        const result = await dispatch(
          updateUser({
            id: editUser._id,
            data: { name, email, phone, role: status },
          }),
        ).unwrap();
        focusUserId = editUser._id;
        toast.success(result?.message || "User Updated Successfully");
      } else {
        const result = await dispatch(
          addUser({ name, email, phone, role: status }),
        ).unwrap();

        focusUserId = result?.user?._id;
        isAdd = true;
        toast.success("User added successfully");
      }

      await dispatch(getAllUsers());
      onClose?.({ focusUserId, isAdd });
    } catch (err) {
      toast.error(err || "Something went wrong");
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

  const submitBtnLabel = loading
    ? editUser
      ? "Updating..."
      : "Adding..."
    : editUser
      ? "Update User"
      : "Add User";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl
          bg-white dark:bg-slate-800
          text-slate-900 dark:text-slate-100"
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b
          border-slate-200 dark:border-slate-700"
        >
          <h3 className="text-lg font-semibold">
            {editUser ? "Edit User" : "Add User"}
          </h3>
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
              Full Name <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter candidate name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border
                bg-white dark:bg-slate-700
                border-slate-300 dark:border-slate-600
                text-slate-900 dark:text-white
                focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm text-slate-700 dark:text-slate-300">
              Email Address <span className="text-danger-500">*</span>
            </label>
            <input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border
                bg-white dark:bg-slate-700
                border-slate-300 dark:border-slate-600
                text-slate-900 dark:text-white
                focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm text-slate-700 dark:text-slate-300">
              Phone Number
            </label>
            <input
              type="text"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border
                bg-white dark:bg-slate-700
                border-slate-300 dark:border-slate-600
                text-slate-900 dark:text-white
                focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm text-slate-700 dark:text-slate-300">
              Role <span className="text-danger-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border
                bg-white dark:bg-slate-700
                border-slate-300 dark:border-slate-600
                text-slate-900 dark:text-white
                focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="hr">HR</option>
              <option value="interviewer">Interviewer</option>
            </select>
          </div>

          {/* Footer */}
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
              disabled={loading}
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

export default AddUser;
