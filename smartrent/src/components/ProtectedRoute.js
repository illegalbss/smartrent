import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "./LoadingScreen";

function homePathFor(role) {
  if (role === "tenant") return "/dashboard/tenant";
  if (role === "superadmin") return "/admin/dashboard";
  return "/dashboard/staff";
}

// `role` may be a single role ("landlord") or an array of allowed roles (["landlord", "secretary"]).
export default function ProtectedRoute({ children, role }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <LoadingScreen />;

  const allowed = Array.isArray(role) ? role : role ? [role] : null;
  const loginPath = allowed?.includes("superadmin") ? "/admin/login" : "/login";

  if (!user) return <Navigate to={loginPath} state={{ from: location.pathname }} replace />;
  if (allowed && !allowed.includes(user.role)) return <Navigate to={homePathFor(user.role)} replace />;

  return children;
}
