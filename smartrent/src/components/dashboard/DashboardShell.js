import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import TenantTabBar from "./TenantTabBar";
import { useAuth } from "../../context/AuthContext";

export default function DashboardShell({ navItems, title, subtitle, children }) {
  const { user } = useAuth();
  const isTenant = user?.role === "tenant";
  return (
    <div className="min-h-screen bg-site-cream text-site-text">
      <Sidebar navItems={navItems} />
      <div className="lg:pl-64 print:pl-0">
        <Topbar title={title} subtitle={subtitle} />
        <main className={`px-4 py-6 sm:px-6 lg:px-8 ${isTenant ? "pb-28 lg:pb-6" : ""}`}>{children}</main>
      </div>
      {isTenant && <TenantTabBar />}
    </div>
  );
}
