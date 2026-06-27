import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const RoleRoute = ({ allowedRoles }) => {
  const { role } = useAuth();

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
};

export default RoleRoute;
