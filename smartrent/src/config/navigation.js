import { FaTh, FaBuilding, FaUsers, FaComments, FaUserTie, FaCog, FaMoneyBillWave } from "react-icons/fa";

// Shared by Landlord and Secretary — both operate within the landlord's portfolio.
export const STAFF_NAV = [
  { to: "/dashboard/staff", label: "Dashboard", icon: FaTh, end: true },
  { to: "/dashboard/staff/properties", label: "Properties", icon: FaBuilding },
  { to: "/dashboard/staff/tenants", label: "Tenants", icon: FaUsers },
  { to: "/dashboard/staff/payments", label: "Payment Ledger", icon: FaMoneyBillWave },
  { to: "/dashboard/staff/complaints", label: "Complaints", icon: FaComments },
  { to: "/dashboard/staff/secretaries", label: "Secretaries", icon: FaUserTie, landlordOnly: true },
  { to: "/dashboard/staff/settings", label: "Settings", icon: FaCog },
];

export const TENANT_NAV = [
  { to: "/dashboard/tenant", label: "Dashboard", icon: FaTh, end: true },
  { to: "/dashboard/tenant/payments", label: "Payment History", icon: FaBuilding },
  { to: "/dashboard/tenant/complaints", label: "Complaints", icon: FaComments },
  { to: "/dashboard/tenant/settings", label: "Settings", icon: FaCog },
];
