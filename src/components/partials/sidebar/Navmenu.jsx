import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Collapse } from "react-collapse";
import Icon from "@/components/ui/Icon";
import useMobileMenu from "@/hooks/useMobileMenu";
import Submenu from "./Submenu";
import useAuth from "@/hooks/useAuth";
import usePendingInterviewRequests from "@/hooks/usePendingInterviewRequests";


const Navmenu = ({ menus }) => {
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const { role } = useAuth();
  // Live count for items with badgeKey: "interviewRequests" (admin/hr only).
  const pendingRequestCount = usePendingInterviewRequests(role);

  const resolveBadge = (item) => {
    if (item.badgeKey === "interviewRequests") {
      return pendingRequestCount > 0 ? pendingRequestCount : null;
    }
    return item.badge || null;
  };

  const filteredMenus = menus.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  const toggleSubmenu = (i) => {
    if (activeSubmenu === i) {
      setActiveSubmenu(null);
    } else {
      setActiveSubmenu(i);
    }
  };

  const location = useLocation();
  const locationName = location.pathname.replace("/", "");
  const [mobileMenu, setMobileMenu] = useMobileMenu();

  useEffect(() => {
    let submenuIndex = null;
    filteredMenus.map((item, i) => {
      if (!item.child) return;
      if (item.link === locationName) {
        submenuIndex = null;
      } else {
        const ciIndex = item.child.findIndex(
          (ci) => ci.childlink === locationName
        );
        if (ciIndex !== -1) {
          submenuIndex = i;
        }
      }
    });
    document.title = `HR Management  | ${locationName}`;

    setActiveSubmenu(submenuIndex);
    if (mobileMenu) {
      setMobileMenu(false);
    }
  }, [location]);

  return (
    <>
      <ul>
        {filteredMenus.map((item, i) => (
          <li
            key={i}
            className={` single-sidebar-menu 
              ${item.child ? "item-has-children" : ""}
              ${activeSubmenu === i ? "open" : ""}
              ${locationName === item.link ? "menu-item-active" : ""}`}
          >
            {/* single menu with no childred*/}
            {!item.child && !item.isHeadr && (
              <NavLink
                className={`menu-link flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors ${
                  locationName === item.link
                    ? ""
                    : "hover:bg-slate-100 dark:hover:bg-slate-700/50"
                }`}
                to={item.link}
              >
                <span className="menu-icon flex-grow-0">
                  <Icon icon={item.icon} />
                </span>
                <label className="text-box flex-grow text-nowrap cursor-pointer">
                  {item.title}
                </label>
                {resolveBadge(item) && (
                  <span className="menu-badge">{resolveBadge(item)}</span>
                )}
              </NavLink>
            )}
            {/* only for menulabel */}
            {item.isHeadr && !item.child && (
              <div className="menulabel">{item.title}</div>
            )}
            {/*    !!sub menu parent   */}
            {item.child && (
              <div
                className={`menu-link ${
                  activeSubmenu === i
                    ? "parent_active not-collapsed"
                    : "collapsed"
                }`}
                onClick={() => toggleSubmenu(i)}
              >
                <div className="flex-1 flex items-start">
                  <span className="menu-icon">
                    <Icon icon={item.icon} />
                  </span>
                  <div className="text-box">{item.title}</div>
                </div>
                <div className="flex-0">
                  <div
                    className={`menu-arrow transform transition-all duration-300 ${
                      activeSubmenu === i ? " rotate-90" : ""
                    }`}
                  >
                    <Icon icon="heroicons-outline:chevron-right" />
                  </div>
                </div>
              </div>
            )}

            <Submenu activeSubmenu={activeSubmenu} item={item} i={i} />
          </li>
        ))}
      </ul>
    </>
  );
};

export default Navmenu;
