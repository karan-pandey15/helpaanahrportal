import { useSelector } from "react-redux";

const useAuth = () => {
  const auth = useSelector((state) => state.auth);

  return {
    user: auth.user,
    role: auth.user?.role,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading,
    initialized: auth.initialized
  };
};

export default useAuth;
