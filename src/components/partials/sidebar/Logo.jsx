import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import useDarkMode from "@/hooks/useDarkMode";
import useSidebar from "@/hooks/useSidebar";
import useSemiDark from "@/hooks/useSemiDark";
import useSkin from "@/hooks/useSkin";

// import images
import MobileLogo from "@/assets/images/logo/logo-c.svg";
import MobileLogoWhite from "@/assets/images/logo/logo-c-white.svg";
import { ROLE_BASED_ROOT_PATH } from "@/utils/constants";

const getRoleTextSize = (role) => {
  if (role.length > 10) return "text-sm";
  if (role.length > 6) return "text-base";
  return "text-xl";
};

const SidebarLogo = ({ menuHover }) => {
  const [isDark] = useDarkMode();
  const [collapsed, setMenuCollapsed] = useSidebar();
  // semi dark
  const auth = useSelector((state) => state.auth);
  const role = auth.user.role.toUpperCase();
  const [isSemiDark] = useSemiDark();
  // skin
  const [skin] = useSkin();

  const loading = auth?.loading;
  const getBaseLink = loading
    ? "#"
    : ROLE_BASED_ROOT_PATH[auth?.user?.role] || "#";
  return (
    <div
      className={`logo-segment flex justify-between items-center bg-primary-500 text-black-500 dark:bg-primary-500 dark:text-black-500 h-[80px] px-4 z-[9]
  ${menuHover ? "logo-hovered" : ""}
      ${
        skin === "bordered"
          ? " border-b border-r-0 border-slate-200 dark:border-slate-700"
          : " border-none"
      }
      
      `}
    >
      <Link to={getBaseLink}>
        <div className="flex items-center space-x-4">
          <div className="logo-icon">
            {!isDark && !isSemiDark ? (
              <img src={MobileLogo} alt="" />
            ) : (
              <img src={MobileLogoWhite} alt="" />
            )}
          </div>

          {(!collapsed || menuHover) && (
            <div>
              <h1
                className={`font-semibold text-black-500 dark:text-black-500
                  ${getRoleTextSize(role)}
                `}
              >
               Helpaana CRM - {role}
              </h1>
            </div>
          )}
        </div>
      </Link>

      {(!collapsed || menuHover) && (
        <div
          onClick={() => setMenuCollapsed(!collapsed)}
          className={`h-4 w-4 border-[1.5px] border-black-500 dark:border-black-500 rounded-full transition-all duration-150
          ${
            collapsed
              ? ""
              : "ring-2 ring-inset ring-offset-4 ring-black-900 dark:ring-black-500 bg-black-500 dark:bg-black-500 dark:ring-offset-primary-500"
          }
          `}
        ></div>
      )}
    </div>
  );
};

export default SidebarLogo;
