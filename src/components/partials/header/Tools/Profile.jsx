import React, { useState } from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import { Menu } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import UserAvatar from "@/assets/images/users/user.png";
import { logoutUser } from "@/features/auth/authThunks";
import ConfirmDialog from "../Tools/ConfirmDialog";

const profileLabel = () => {
  const user = useSelector((state) => state.auth.user);
  const displayName = user?.name ? user.name.trim().split(" ")[0] : "User";

  return (
    <div className="flex items-center">
      <div className="flex-1 ltr:mr-[10px] rtl:ml-[10px]">
        <div className="lg:h-8 lg:w-8 h-7 w-7 rounded-full">
          <img
            src={UserAvatar}
            alt={displayName}
            className="block w-full h-full object-cover rounded-full"
          />
        </div>
      </div>
      <div className="flex-none text-slate-600 dark:text-white text-sm font-normal items-center lg:flex hidden overflow-hidden text-ellipsis whitespace-nowrap">
        <span className="overflow-hidden text-ellipsis whitespace-nowrap w-[85px] block">
          {displayName}
        </span>
        <span className="text-base inline-block ltr:ml-[10px] rtl:mr-[10px]">
          <Icon icon="heroicons-outline:chevron-down"></Icon>
        </span>
      </div>
    </div>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const role = useSelector((state) => state.auth.user?.role);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const openConfirm = () => setConfirmOpen(true);
  const closeConfirm = () => setConfirmOpen(false);

  const confirmLogout = async () => {
    setConfirmLoading(true);
    try {
      const result = await dispatch(logoutUser());
      toast.success(result?.payload?.message || "Logged out successfully");
      setConfirmOpen(false);
      navigate("/login");
    } catch (err) {
      toast.error(err?.message || "Logout failed");
    } finally {
      setConfirmLoading(false);
    }
  };

  const ProfileMenu = [
    {
      label: "Profile",
      icon: "heroicons-outline:user",
      action: () => navigate("/profile"),
    },
    // Round & email management lives under the profile now (admin only).
    ...(role === "admin"
      ? [
          {
            label: "Rounds & Email",
            icon: "heroicons:adjustments-horizontal",
            action: () => navigate("/profile?tab=rounds"),
          },
        ]
      : []),
    {
      label: "Chat",
      icon: "heroicons-outline:chat",
      action: () => navigate("/chat"),
    },
    {
      label: "Email",
      icon: "heroicons-outline:mail",
      action: () => navigate("/email"),
    },
    {
      label: "Todo",
      icon: "heroicons-outline:clipboard-check",
      action: () => navigate("/todo"),
    },
    {
      label: "Settings",
      icon: "heroicons-outline:cog",
      action: () => navigate("/settings"),
    },
    {
      label: "Price",
      icon: "heroicons-outline:credit-card",
      action: () => navigate("/pricing"),
    },
    {
      label: "Faq",
      icon: "heroicons-outline:information-circle",
      action: () => navigate("/faq"),
    },
    {
      label: "Logout",
      icon: "heroicons-outline:login",
      hasDivider: true,
      action: () => openConfirm(),
    },
  ];

  return (
    <>
      <Dropdown label={profileLabel()} classMenuItems="w-[180px] top-[58px]">
        {ProfileMenu.map((item, index) => (
          <Menu.Item key={index}>
            {({ active }) => (
              <div
                onClick={item.action}
                className={`${
                  active
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-600 dark:text-slate-300 dark:bg-opacity-50"
                    : "text-slate-600 dark:text-slate-300"
                } block ${
                  item.hasDivider
                    ? "border-t border-slate-100 dark:border-slate-700"
                    : ""
                }`}
              >
                <div className="block cursor-pointer px-4 py-2">
                  <div className="flex items-center">
                    <span className="block text-xl ltr:mr-3 rtl:ml-3">
                      <Icon icon={item.icon} />
                    </span>
                    <span className="block text-sm">{item.label}</span>
                  </div>
                </div>
              </div>
            )}
          </Menu.Item>
        ))}
      </Dropdown>
      <ConfirmDialog
        open={confirmOpen}
        title="Confirm logout"
        description="Are you sure you want to logout?"
        cancelText="Close"
        confirmText={confirmLoading ? "Logging out..." : "Sure"}
        loading={confirmLoading}
        onClose={closeConfirm}
        onConfirm={confirmLogout}
      />
    </>
  );
};

export default Profile;
