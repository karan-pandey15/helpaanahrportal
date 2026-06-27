import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Icon from "../../ui/Icon";
import { logoutUser } from "@/features/auth/authThunks";
import useAuth from "@/hooks/useAuth";
import usePendingInterviewRequests from "@/hooks/usePendingInterviewRequests";

import FooterAvatar from "@/assets/images/users/user-1.jpg";

const MobileFooter = () => {
  const { role } = useAuth();
  // Live pending candidate reschedule/cancel requests (admin/hr/interviewer).
  const pendingCount = usePendingInterviewRequests(role);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Same items as the desktop profile dropdown, so mobile has parity.
  const menuItems = [
    { label: "Profile", icon: "heroicons-outline:user", to: "/profile" },
    ...(role === "admin"
      ? [
          {
            label: "Rounds & Email",
            icon: "heroicons:adjustments-horizontal",
            to: "/profile?tab=rounds",
          },
        ]
      : []),
    { label: "Chat", icon: "heroicons-outline:chat", to: "/chat" },
    { label: "Email", icon: "heroicons-outline:mail", to: "/email" },
    { label: "Todo", icon: "heroicons-outline:clipboard-check", to: "/todo" },
    { label: "Settings", icon: "heroicons-outline:cog", to: "/settings" },
  ];

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const result = await dispatch(logoutUser());
      toast.success(result?.payload?.message || "Logged out successfully");
      setMenuOpen(false);
      navigate("/login");
    } catch (err) {
      toast.error(err?.message || "Logout failed");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <div className="bg-primary-500 bg-no-repeat custom-dropshadow footer-bg dark:bg-primary-500 text-black-500 flex justify-around items-center backdrop-filter backdrop-blur-[40px] fixed left-0 w-full z-[9999] bottom-0 py-[12px] px-4">
        <NavLink to="/interview-requests">
          {({ isActive }) => (
            <div>
              <span
                className={` relative cursor-pointer rounded-full text-[20px] flex flex-col items-center justify-center mb-1
           ${isActive ? "text-black-500" : "dark:text-black-500 text-black-500"}
            `}
              >
                <Icon icon="heroicons-outline:mail" />
                {pendingCount > 0 && (
                  <span className="absolute right-[5px] lg:top-0 -top-2 h-4 min-w-[16px] px-1 bg-red-500 text-[8px] font-semibold flex flex-col items-center justify-center rounded-full text-white z-[99]">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </span>
              <span
                className={` block text-[11px]
            ${
              isActive
                ? "text-black-500"
                : "text-black-500 dark:text-black-500"
            }
            `}
              >
                Requests
              </span>
            </div>
          )}
        </NavLink>

        {/* Center avatar — opens the profile menu (parity with desktop). */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="relative bg-primary-500 bg-no-repeat backdrop-filter backdrop-blur-[40px] rounded-full footer-bg dark:bg-primary-500 h-[65px] w-[65px] z-[-1] -mt-[40px] flex justify-center items-center"
          aria-label="Open profile menu"
        >
          <div className="h-[50px] w-[50px] rounded-full relative custom-dropshadow">
            <img
              src={FooterAvatar}
              alt=""
              className="w-full h-full rounded-full border-2 border-slate-100"
            />
          </div>
        </button>

        <NavLink to="/notifications">
          {({ isActive }) => (
            <div>
              <span
                className={` relative cursor-pointer rounded-full text-[20px] flex flex-col items-center justify-center mb-1
        ${isActive ? "text-black-500" : "dark:text-black-500 text-black-500"}
            `}
              >
                <Icon icon="heroicons-outline:bell" />
                <span className="absolute right-[17px] lg:top-0 -top-2 h-4 w-4 bg-red-500 text-[8px] font-semibold flex flex-col items-center justify-center rounded-full text-white z-[99]">
                  2
                </span>
              </span>
              <span
                className={` block text-[11px]
           ${isActive ? "text-black-500" : "text-black-500 dark:text-black-500"}
          `}
              >
                Notifications
              </span>
            </div>
          )}
        </NavLink>
      </div>

      {/* Bottom-sheet profile menu */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[9999] rounded-t-2xl bg-white dark:bg-slate-800 pb-6 pt-2 shadow-2xl">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
            <div className="px-2">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(item.to);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <span className="text-xl text-slate-500 dark:text-slate-300">
                    <Icon icon={item.icon} />
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="mt-1 flex w-full items-center gap-3 rounded-lg border-t border-slate-100 px-4 py-3 text-left text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-red-900/20"
              >
                <span className="text-xl">
                  <Icon icon="heroicons-outline:login" />
                </span>
                <span className="text-sm font-medium">
                  {loggingOut ? "Logging out…" : "Logout"}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MobileFooter;
