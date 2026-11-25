import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import TenantTabBar from "./TenantTabBar";
import { useAuth } from "../../context/AuthContext";

// Page frame: sidebar, top bar (search, bell, account), then the page's own
// heading and content — the heading sits in the page, as in the dashboard design.
export default function DashboardShell({ navItems, title, subtitle, actions, children }) {
  const { user } = useAuth();
  const isTenant = user?.role === "tenant";
  return (
    <div className="min-h-screen bg-site-cream text-site-text">
      <Sidebar navItems={navItems} />
      <div className="lg:pl-64 print:pl-0">
        <Topbar title={title} />
        <main className={`px-4 py-6 sm:px-6 lg:px-8 ${isTenant ? "pb-28 lg:pb-6" : ""}`}>
          {(title || actions) && (
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                {title && <h1 className="m-0 font-display text-[28px] font-bold leading-tight sm:text-[34px]">{title}</h1>}
                {subtitle && <div className="mt-1.5 text-[15px] text-site-muted">{subtitle}</div>}
              </div>
              {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
      {isTenant && <TenantTabBar />}
    </div>
  );
}
