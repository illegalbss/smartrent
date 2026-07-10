import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardShell({ navItems, title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-ink-50">
      <Sidebar navItems={navItems} />
      <div className="lg:pl-64 print:pl-0">
        <Topbar title={title} subtitle={subtitle} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
