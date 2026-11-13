import { FaTh, FaBuilding, FaUsers, FaComments, FaUserTie, FaCog, FaMoneyBillWave, FaTools, FaBullhorn, FaBook, FaWallet, FaFolderOpen, FaHistory } from "react-icons/fa";

// Shared by Landlord and Secretary — both operate within the landlord's portfolio.
export const STAFF_NAV = [
  { to: "/dashboard/staff", label: "Dashboard", icon: FaTh, end: true },
  { to: "/dashboard/staff/properties", label: "Properties", icon: FaBuilding },
  { to: "/dashboard/staff/tenants", label: "Tenants", icon: FaUsers },
  { to: "/dashboard/staff/payments", label: "Payments", icon: FaMoneyBillWave },
  { to: "/dashboard/staff/documents", label: "Documents", icon: FaFolderOpen },
  { to: "/dashboard/staff/maintenance", label: "Maintenance", icon: FaTools },
  { to: "/dashboard/staff/notices", label: "Notices", icon: FaBullhorn },
  { to: "/dashboard/staff/house-rules", label: "House Rules", icon: FaBook },
  { to: "/dashboard/staff/complaints", label: "Complaints", icon: FaComments },
  { to: "/dashboard/staff/secretaries", label: "Secretaries", icon: FaUserTie, landlordOnly: true },
  { to: "/dashboard/staff/payout-setup", label: "Payout Setup", icon: FaWallet, landlordOnly: true },
  { to: "/dashboard/staff/history", label: "History log", icon: FaHistory },
  { to: "/dashboard/staff/settings", label: "Settings", icon: FaCog },
];

export const TENANT_NAV = [
  { to: "/dashboard/tenant", label: "Dashboard", icon: FaTh, end: true },
  { to: "/dashboard/tenant/payments", label: "Payment History", icon: FaBuilding },
  { to: "/dashboard/tenant/maintenance", label: "Maintenance", icon: FaTools },
  { to: "/dashboard/tenant/notices", label: "Notices", icon: FaBullhorn },
  { to: "/dashboard/tenant/house-rules", label: "House Rules", icon: FaBook },
  { to: "/dashboard/tenant/complaints", label: "Complaints", icon: FaComments },
  { to: "/dashboard/tenant/settings", label: "Settings", icon: FaCog },
];
