import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

export default function Shell({ children }) {
  return (
    <div>
      <Topbar />

      <div style={{ display: "flex" }}>
        <Sidebar />

        <div style={{
          flex: 1,
          padding: "24px",
          background: "#0A0A0F",
          minHeight: "100vh",
          color: "white"
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}