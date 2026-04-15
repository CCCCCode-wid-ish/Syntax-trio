import { useEffect, useMemo, useState } from "react";
import "./App.css";
import Shell from "./components/Layout/Shell";
import AdminPage from "./views/AdminPage";
import Dashboard from "./views/Dashboard";
import DeliveryPage from "./views/DeliveryPage";
import LoginPage from "./views/LoginPage";
import WarehousePage from "./views/WarehousePage";
import { useDarkstoreSimulator } from "./hooks/useDarkstoreSimulator";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", meta: "Live overview" },
  { key: "warehouse", label: "Warehouse", meta: "Stock and pick paths" },
  { key: "delivery", label: "Delivery", meta: "Fleet movement" },
  { key: "admin", label: "Admin", meta: "Manual overrides" },
];

function getRouteFromHash() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  return NAV_ITEMS.some((item) => item.key === raw) ? raw : "dashboard";
}

export default function App() {
  const simulator = useDarkstoreSimulator();
  const [route, setRoute] = useState(() => getRouteFromHash());
  const [auth, setAuth] = useState(() => {
    const savedPhone = window.localStorage.getItem("darkstore-phone");
    return {
      phone: savedPhone ?? "",
      loggedIn: window.localStorage.getItem("darkstore-auth") === "true",
    };
  });

  useEffect(() => {
    const handleHashChange = () => setRoute(getRouteFromHash());

    if (!window.location.hash) {
      window.location.hash = "/dashboard";
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const currentNavItem = useMemo(
    () => NAV_ITEMS.find((item) => item.key === route) ?? NAV_ITEMS[0],
    [route]
  );

  function navigate(nextRoute) {
    window.location.hash = `/${nextRoute}`;
  }

  function handleLogin(phone) {
    window.localStorage.setItem("darkstore-auth", "true");
    window.localStorage.setItem("darkstore-phone", phone);
    setAuth({ phone, loggedIn: true });
    navigate("dashboard");
  }

  function handleLogout() {
    window.localStorage.removeItem("darkstore-auth");
    setAuth((prev) => ({ ...prev, loggedIn: false }));
  }

  if (!auth.loggedIn) {
    return <LoginPage initialPhone={auth.phone} onLogin={handleLogin} />;
  }

  return (
    <Shell
      currentPage={route}
      currentPageLabel={currentNavItem.label}
      onLogout={handleLogout}
      onNavigate={navigate}
      userPhone={auth.phone}
      navItems={NAV_ITEMS}
    >
      {route === "dashboard" && <Dashboard simulator={simulator} onNavigate={navigate} />}
      {route === "warehouse" && <WarehousePage simulator={simulator} />}
      {route === "delivery" && <DeliveryPage simulator={simulator} />}
      {route === "admin" && <AdminPage simulator={simulator} />}
    </Shell>
  );
}
