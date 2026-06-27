import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addStatus } from "@/features/status/statusSlice";
import { editStatusAndSyncInterviews } from "@/features/status/statusSlice";

const AddStatus = ({ editStatus: existing, onClose, loading = false }) => {
  const dispatch = useDispatch();
  const [name, setName] = useState("");

  useEffect(() => {
    if (existing) setName(existing.status || existing.name || "");
  }, [existing]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!name.trim()) return;

    if (existing) {
      await dispatch(
        editStatusAndSyncInterviews({
          statusId: existing._id,
          newStatus: name,
        }),
      );
    } else {
      await dispatch(addStatus({ status: name }));
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl
         dark:bg-slate-800
          text-slate-900 dark:text-slate-100"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">
            {existing ? "Edit Status" : "Add Status"}
          </h3>
          <button
            onClick={onClose}
            className="text-xl text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block mb-1 text-sm text-slate-700 dark:text-slate-300">
              Status Name <span className="text-danger-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border
                bg-white dark:bg-slate-700
                border-slate-300 dark:border-slate-600
                text-slate-900 dark:text-white
                focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={onClose} type="button">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStatus;
