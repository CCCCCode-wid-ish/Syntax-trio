import AgentLog from "../components/Layout/AgentLog";

export default function Dashboard() {
  return (
    <div style={{ padding: "20px", color: "white" }}>
      
      <h2 style={{ marginBottom: "20px" }}>Dashboard</h2>

      {/* LIVE ORDERS */}
      <div style={{
        background: "#111",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "20px"
      }}>
        <h3>Live Orders</h3>
        <p>ORD-101 <span style={{ color: "skyblue" }}>Processing</span></p>
        <p>ORD-102 <span style={{ color: "orange" }}>Picked</span></p>
        <p>ORD-103 <span style={{ color: "lightgreen" }}>Delivered</span></p>
      </div>

      {/* AGENT LOG */}
      <AgentLog />

    </div>
  );
}