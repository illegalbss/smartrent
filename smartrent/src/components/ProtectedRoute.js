import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "./LoadingScreen";

function homePathFor(role) {
  return role === "tenant" ? "/dashboard/tenant" : "/dashboard/staff";
}

// `role` may be a single role ("landlord") or an array of allowed roles (["landlord", "secretary"]).
export default function ProtectedRoute({ children, role }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  const allowed = Array.isArray(role) ? role : role ? [role] : null;
  if (allowed && !allowed.includes(user.role)) return <Navigate to={homePathFor(user.role)} replace />;

  return children;
}
