import AgentLog from "../components/Layout/AgentLog";
import InventoryPanel from "../components/Layout/InventoryPanel";

export default function WarehousePage({ simulator }) {
  const { inventory, logs, lowStockCount, settings } = simulator;

  return (
    <div className="page-layout">
      <section className="page-header-card">
        <div>
          <p className="eyebrow">Warehouse</p>
          <h1>Stock and Picking Control</h1>
          <p className="hero-copy">
            Monitor shelf pressure, auto-restock behavior, and the live event stream for fulfillment issues.
          </p>
        </div>
        <div className="page-badge-stack">
          <span className="panel-chip warning">{lowStockCount} low stock alerts</span>
          <span className="panel-chip">{settings.autoRestock ? "Auto restock enabled" : "Manual replenishment"}</span>
        </div>
      </section>

      <section className="dashboard-grid">
        <InventoryPanel inventory={inventory} />
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Pick Readiness</p>
              <h2>Zone utilization</h2>
            </div>
            <span className="panel-chip success">Stable</span>
          </div>

          <div className="metric-row metric-row-two">
            <MetricCard label="Cold storage" value="82%" tone="cyan" />
            <MetricCard label="Fast movers" value="91%" tone="green" />
          </div>

          <div className="warehouse-zones">
            {inventory.map((item) => (
              <div className="zone-card" key={item.id}>
                <strong>{item.name}</strong>
                <p>Reorder point: {item.reorderPoint}</p>
                <span className={`status-pill ${item.stock <= item.reorderPoint ? "danger" : "success"}`}>
                  {item.stock <= item.reorderPoint ? "Needs attention" : "Ready to pick"}
                </span>
              </div>
            ))}
          </div>
        </div>
        <AgentLog logs={logs} />
      </section>
    </div>
  );
}

function MetricCard({ label, value, tone }) {
  return (
    <div className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
