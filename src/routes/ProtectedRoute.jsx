import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = () => {
  const auth = useSelector((state) => state.auth);
  const location = useLocation();

  if (!auth.initialized) {
    return null;
  }
  if (!auth.isAuthenticated) {
    // Remember where the user was headed so Login can send them back there.
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
