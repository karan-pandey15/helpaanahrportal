import React, { useEffect } from "react";
import UserAvatar from "@/assets/images/users/user.png";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserActivity } from "@/features/activity/activityThunks";
import { clearActivity } from "@/features/activity/activitySlice";
import Loading from "../../../../components/Loading";
import { X } from "lucide-react";

const ViewUser = ({ user, onClose }) => {
  const dispatch = useDispatch();
  const { activities, loading } = useSelector((s) => s.activity);

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchUserActivity(user._id));
    }

    return () => {
      dispatch(clearActivity());
    };
  }, [user?._id]);

  if (!user) return null;

  useEffect(() => {
    console.log(user);
  }, [user]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const titleCase = (str = "") =>
    str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
    );

  const formatActivityDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-3 lg:items-start lg:p-0 lg:pt-24 lg:pl-36">
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full lg:w-[94%] max-w-6xl h-[90vh] lg:h-[85vh]
        bg-white dark:bg-slate-800
        text-slate-900 dark:text-slate-100
        rounded-2xl shadow-2xl flex flex-col lg:flex-row
        overflow-y-auto lg:overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center text-2xl rounded-full bg-primary border border-primary text-slate-400 hover:text-slate-700 dark:hover:text-white z-10"
        >
          <X size={20} />
        </button>

        <div className="lg:flex-1 lg:overflow-y-auto p-4 space-y-6">
          <div className="border rounded-xl p-4 sm:p-6 space-y-4 border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl sm:text-4xl font-semibold break-words">
              {titleCase(user.name)}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-slate-500">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>

              <div>
                <p className="text-slate-500">Phone</p>
                <p className="font-medium">{user.phone || "—"}</p>
              </div>

              <div>
                <h4 className="text-sm text-slate-500 mb-1">Role</h4>
                <span
                  className="inline-block px-3 py-1 text-xs rounded-full
              bg-indigo-100 text-indigo-600 capitalize"
                >
                  {user?.role?.toUpperCase() || "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="border rounded-xl p-6 space-y-4 border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">User Setup</h3>
              <span className="text-sm text-slate-500">3 of 5</span>
            </div>

            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full w-[60%] bg-indigo-500 ml-auto" />
            </div>

            <div className="space-y-3 text-sm">
              {[
                "Verify email",
                "Assign role",
                "Activate account",
                "Upload avatar",
                "Send welcome mail",
              ].map((label, i) => (
                <label key={i} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={i < 3}
                    readOnly
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div
          className="w-full lg:w-[320px] shrink-0 border-t lg:border-t-0 lg:border-l
        bg-slate-50 dark:bg-slate-900
        border-slate-200 dark:border-slate-700
          flex flex-col"
        >
          <div className="p-4">
            <div className="border rounded-xl px-4 py-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <h4 className="text-sm text-slate-500 mb-2">Created By</h4>
              <div className="flex items-center gap-3">
                <img
                  src={UserAvatar}
                  alt="User"
                  className="w-9 h-9 rounded-full"
                />
                <div>
                  <p className="font-medium">
                    {user.createdBy?.name || "System"}
                  </p>
                  <p className="text-xs text-slate-500">
                    @{user.createdBy?.name || "system"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 pb-2">
            <h4 className="text-sm text-slate-500">Activity</h4>
          </div>

          <div
            className="border rounded-lg p-3 mx-4 mb-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm
          max-h-72 lg:max-h-96 overflow-y-auto
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-track]:rounded-full
        [&::-webkit-scrollbar-track]:bg-gray-100
          [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-gray-300
        dark:[&::-webkit-scrollbar-track]:bg-neutral-700
        dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500"
          >
            {loading && <Loading />}

            {!loading && !activities.length && (
              <div className="flex justify-center items-center h-64">
                <p className="text-sm text-slate-400">No activity found</p>
              </div>
            )}

            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.activityId} className="flex gap-3 text-sm">
                  <span className="mt-2 w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">
                      {activity.performedAt}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {activity.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="p-4 border-t border-slate-200 dark:border-slate-700
    bg-slate-50 dark:bg-slate-900"
          >
            <button
              className="w-full py-3 rounded-lg
      bg-red-100 dark:bg-red-900/30
      text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition"
            >
              Delete User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewUser;
