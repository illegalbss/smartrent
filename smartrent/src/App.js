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
import PropertyTenants from "./pages/dashboard/staff/PropertyTenants";
import TenantDetail from "./pages/dashboard/staff/TenantDetail";
import PaymentLedger from "./pages/dashboard/staff/PaymentLedger";
import StaffMaintenance from "./pages/dashboard/staff/Maintenance";
import StaffNotices from "./pages/dashboard/staff/Notices";
import StaffHouseRules from "./pages/dashboard/staff/HouseRules";
import Complaints from "./pages/dashboard/staff/Complaints";
import Secretaries from "./pages/dashboard/staff/Secretaries";
import TenantDashboard from "./pages/dashboard/tenant/Dashboard";
import TenantPayments from "./pages/dashboard/tenant/Payments";
import TenantMaintenance from "./pages/dashboard/tenant/Maintenance";
import TenantNotices from "./pages/dashboard/tenant/Notices";
import TenantHouseRules from "./pages/dashboard/tenant/HouseRules";
import TenantComplaints from "./pages/dashboard/tenant/Complaints";
import Settings from "./pages/dashboard/Settings";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
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
          path="/dashboard/staff/properties/:propertyId/tenants"
          element={
            <ProtectedRoute role={STAFF_ROLES}>
              <PropertyTenants />
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
          path="/dashboard/staff/payments"
          element={
            <ProtectedRoute role={STAFF_ROLES}>
              <PaymentLedger />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/staff/maintenance"
          element={
            <ProtectedRoute role={STAFF_ROLES}>
              <StaffMaintenance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/staff/notices"
          element={
            <ProtectedRoute role={STAFF_ROLES}>
              <StaffNotices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/staff/house-rules"
          element={
            <ProtectedRoute role={STAFF_ROLES}>
              <StaffHouseRules />
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
          path="/dashboard/tenant/maintenance"
          element={
            <ProtectedRoute role="tenant">
              <TenantMaintenance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tenant/notices"
          element={
            <ProtectedRoute role="tenant">
              <TenantNotices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tenant/house-rules"
          element={
            <ProtectedRoute role="tenant">
              <TenantHouseRules />
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

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="superadmin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
