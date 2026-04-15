import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

export default function Shell({
  children,
  currentPage,
  currentPageLabel,
  navItems,
  onLogout,
  onNavigate,
  userPhone,
}) {
  return (
    <div className="app-shell">
      <Topbar currentPageLabel={currentPageLabel} onLogout={onLogout} userPhone={userPhone} />
      <div className="shell-body">
        <Sidebar currentPage={currentPage} items={navItems} onNavigate={onNavigate} />
        <main className="shell-content">{children}</main>
      </div>
    </div>
  );
}
