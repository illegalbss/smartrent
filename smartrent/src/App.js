import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import AcceptInvite from "./pages/AcceptInvite";
import StaffDashboard from "./pages/dashboard/staff/Dashboard";
import Properties from "./pages/dashboard/staff/Properties";
import PropertyDetail from "./pages/dashboard/staff/PropertyDetail";
import Tenants from "./pages/dashboard/staff/Tenants";
import TenantDetail from "./pages/dashboard/staff/TenantDetail";
import Complaints from "./pages/dashboard/staff/Complaints";
import Secretaries from "./pages/dashboard/staff/Secretaries";
import TenantDashboard from "./pages/dashboard/tenant/Dashboard";
import TenantPayments from "./pages/dashboard/tenant/Payments";
import TenantComplaints from "./pages/dashboard/tenant/Complaints";
import Settings from "./pages/dashboard/Settings";
import NotFound from "./pages/NotFound";
import { STAFF_NAV, TENANT_NAV } from "./config/navigation";

const STAFF_ROLES = ["landlord", "secretary"];

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />

        <Route
          path="/dashboard/staff"
          element={
            <ProtectedRoute role={STAFF_ROLES}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/staff/properties"
          element={
            <ProtectedRoute role={STAFF_ROLES}>
              <Properties />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/staff/properties/:id"
          element={
            <ProtectedRoute role={STAFF_ROLES}>
              <PropertyDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/staff/tenants"
          element={
            <ProtectedRoute role={STAFF_ROLES}>
              <Tenants />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/staff/tenants/:id"
          element={
            <ProtectedRoute role={STAFF_ROLES}>
              <TenantDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/staff/complaints"
          element={
            <ProtectedRoute role={STAFF_ROLES}>
              <Complaints />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/staff/secretaries"
          element={
            <ProtectedRoute role={STAFF_ROLES}>
              <Secretaries />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/staff/settings"
          element={
            <ProtectedRoute role={STAFF_ROLES}>
              <Settings navItems={STAFF_NAV} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/tenant"
          element={
            <ProtectedRoute role="tenant">
              <TenantDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tenant/payments"
          element={
            <ProtectedRoute role="tenant">
              <TenantPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tenant/complaints"
          element={
            <ProtectedRoute role="tenant">
              <TenantComplaints />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tenant/settings"
          element={
            <ProtectedRoute role="tenant">
              <Settings navItems={TENANT_NAV} />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
