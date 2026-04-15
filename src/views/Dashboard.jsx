import AgentLog from "../components/AgentLog";

export default function Dashboard() {
  const orders = [
    { id: "ORD-101", status: "Processing" },
    { id: "ORD-102", status: "Picked" },
    { id: "ORD-103", status: "Delivered" },
  ];

  return (
    <div style={{ display: "flex", gap: "20px" }}>
      
      {/* LEFT SIDE */}
      <div style={{ flex: 1 }}>
        <h2 style={{ marginBottom: "16px" }}>Live Orders</h2>

        <div style={{
          background: "#111118",
          border: "1px solid #1E1E2E",
          borderRadius: "8px",
          padding: "16px"
        }}>
          {orders.map((order) => (
            <div key={order.id} style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 0",
              borderBottom: "1px solid #1E1E2E"
            }}>
              <span>{order.id}</span>

              <span style={{
                color:
                  order.status === "Processing" ? "#3B82F6" :
                  order.status === "Picked" ? "#F59E0B" :
                  "#10B981"
              }}>
                {order.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE */}
      <AgentLog />

    </div>
  );
}