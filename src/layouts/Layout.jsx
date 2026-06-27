import React, { Fragment, Suspense, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Header from "../components/partials/header";
import Sidebar from "../components/partials/sidebar";
import Settings from "../components/partials/settings";
import Footer from "../components/partials/footer";
import MobileMenu from "../components/partials/sidebar/MobileMenu";
import MobileFooter from "../components/partials/footer/MobileFooter";
import Loading from "../components/Loading";

import useWidth from "../hooks/useWidth";
import useSidebar from "../hooks/useSidebar";
import useContentWidth from "../hooks/useContentWidth";
import useMenulayout from "../hooks/useMenulayout";
import useMenuHidden from "../hooks/useMenuHidden";
import useMobileMenu from "../hooks/useMobileMenu";

import { motion } from "framer-motion";

const Layout = () => {
  const location = useLocation();
  const { width, breakpoints } = useWidth();
  const [collapsed] = useSidebar();
  const [contentWidth] = useContentWidth();
  const [menuType] = useMenulayout();
  const [menuHidden] = useMenuHidden();
  const [mobileMenu, setMobileMenu] = useMobileMenu();

  const switchHeaderClass = () => {
    if (menuType === "horizontal" || menuHidden) {
      return "ltr:ml-0 rtl:mr-0";
    } else if (collapsed) {
      return "ltr:ml-[72px] rtl:mr-[72px]";
    }
    return "ltr:ml-[248px] rtl:mr-[248px]";
  };

  return (
    <Fragment>
      <Header className={width >= breakpoints.xl ? switchHeaderClass() : ""} />

      {menuType === "vertical" && width >= breakpoints.xl && !menuHidden && (
        <Sidebar />
      )}

      <MobileMenu
        className={`${
          width < breakpoints.xl && mobileMenu
            ? "left-0 visible opacity-100 z-[9999]"
            : "left-[-300px] invisible opacity-0 z-[-999]"
        }`}
      />

      {width < breakpoints.xl && mobileMenu && (
        <div
          className="overlay fixed inset-0 bg-slate-900/50 z-[999]"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <Settings />

      <div
        className={`content-wrapper transition-all duration-150 ${
          width >= breakpoints.xl ? switchHeaderClass() : ""
        }`}
      >
        <div className="page-content page-min-height">
          <div
            className={
              contentWidth === "boxed" ? "container mx-auto" : "container-fluid"
            }
          >
            <Suspense fallback={<Loading />}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4 }}
              >
                <Outlet />
              </motion.div>
            </Suspense>
          </div>
        </div>
      </div>

      {width < breakpoints.md && <MobileFooter />}
      {width > breakpoints.md && (
        <Footer
          className={width >= breakpoints.xl ? switchHeaderClass() : ""}
        />
      )}
    </Fragment>
  );
};

export default Layout;
