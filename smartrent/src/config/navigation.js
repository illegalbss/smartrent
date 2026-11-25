import {
  FaTh,
  FaBuilding,
  FaUsers,
  FaComments,
  FaUserTie,
  FaCog,
  FaMoneyBillWave,
  FaTools,
  FaBullhorn,
  FaBook,
  FaWallet,
  FaFolderOpen,
  FaHistory,
} from "react-icons/fa";

// Shared by Landlord and Secretary — both operate within the landlord's portfolio.
// Order and names follow the dashboard design; every page is still listed.
// `badge` names a live count the sidebar shows next to the item.
export const STAFF_NAV = [
  { to: "/dashboard/staff", label: "Overview", icon: FaTh, end: true },
  { to: "/dashboard/staff/properties", label: "Properties", icon: FaBuilding },
  { to: "/dashboard/staff/tenants", label: "Rooms & Tenants", icon: FaUsers },
  { to: "/dashboard/staff/payments", label: "Rent & Payments", icon: FaMoneyBillWave },
  { to: "/dashboard/staff/maintenance", label: "Maintenance", icon: FaTools },
  { to: "/dashboard/staff/complaints", label: "Messages", icon: FaComments, badge: "openComplaints" },
  { to: "/dashboard/staff/documents", label: "Documents", icon: FaFolderOpen },
  { to: "/dashboard/staff/notices", label: "Notices", icon: FaBullhorn },
  { to: "/dashboard/staff/house-rules", label: "House Rules", icon: FaBook },
  { to: "/dashboard/staff/history", label: "History log", icon: FaHistory },
  { to: "/dashboard/staff/secretaries", label: "Secretaries", icon: FaUserTie, landlordOnly: true },
  { to: "/dashboard/staff/payout-setup", label: "Payout Setup", icon: FaWallet, landlordOnly: true },
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
