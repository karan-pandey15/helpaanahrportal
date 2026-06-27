import React from "react";
import useDarkMode from "@/hooks/useDarkMode";
import { Link } from "react-router-dom";
import useWidth from "@/hooks/useWidth";

import MainLogo from "@/assets/images/logo/logo.svg";
import LogoWhite from "@/assets/images/logo/logo-white.svg";
import MobileLogo from "@/assets/images/logo/logo-c.svg";
import MobileLogoWhite from "@/assets/images/logo/logo-c-white.svg";
import useAuth from "@/hooks/useAuth";
import { ROLE_BASED_ROOT_PATH } from "@/utils/constants";

const Logo = () => {
  const [isDark] = useDarkMode();
  const { width, breakpoints } = useWidth();
  const { role, loading } = useAuth();
  const getBaseLink = loading ? "#" : ROLE_BASED_ROOT_PATH[role] || "#";
  return (
    <div>
      <Link to={getBaseLink}>
        {width >= breakpoints.xl ? (
          <img src={isDark ? LogoWhite : MainLogo} alt="" />
        ) : (
          <img src={isDark ? MobileLogoWhite : MobileLogo} alt="" />
        )}
      </Link>
    </div>
  );
};

export default Logo;
