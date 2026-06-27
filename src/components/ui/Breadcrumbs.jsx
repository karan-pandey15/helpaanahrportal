import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import { ROLE_BASED_ROOT_PATH } from "@/utils/constants";

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const Breadcrumbs = () => {
  const location = useLocation();

  // "/admin/candidate" → ["admin", "candidate"]
  const paths = location.pathname.split("/").filter(Boolean);

  const basePath = ROLE_BASED_ROOT_PATH[paths[0]] || "#";

  return (
    <div className="md:mb-6 mb-4 flex items-center">
      <ul className="breadcrumbs flex items-center space-x-3 rtl:space-x-reverse">
        {/* Home */}
        {/* <li className="flex items-center text-primary-500">
          <NavLink to="/dashboard" className="text-lg">
            <Icon icon="heroicons-outline:home" />
          </NavLink>
        </li> */}

        {paths.map((segment, index) => {
          const routeTo = "/" + paths.slice(0, index + 1).join("/");
          const isLast = index === paths.length - 1;

          return (
            <li key={routeTo} className="flex items-center space-x-3">
              {index !== 0 && isLast && (
                <span className="breadcrumbs-icon rtl:rotate-180">
                  <Icon icon="heroicons:chevron-right" />
                </span>
              )}
              {index == 0 && (
                <Icon
                  className=" text-primary-500 translate-x-1"
                  icon="heroicons-outline:home"
                />
              )}
              {isLast ? (
                <span className="capitalize text-slate-500 dark:text-slate-400">
                  {capitalize(segment)}
                </span>
              ) : (
                <NavLink
                  to={index === 0 ? basePath : routeTo}
                  className="capitalize text-primary-500 hover:underline"
                >
                  {capitalize(segment)}
                </NavLink>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Breadcrumbs;
