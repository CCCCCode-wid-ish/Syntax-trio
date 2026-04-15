export default function Sidebar() {
  return (
    <div style={{
      width: "200px",
      background: "#0A0A0F",
      borderRight: "1px solid #1E1E2E",
      height: "100vh",
      color: "white"
    }}>
      <div style={{ padding: "12px" }}>Dashboard</div>
      <div style={{ padding: "12px" }}>Warehouse</div>
      <div style={{ padding: "12px" }}>Substitution</div>
    </div>
  );
}