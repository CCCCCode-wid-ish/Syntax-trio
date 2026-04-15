import { formatCurrency } from "../hooks/useDarkstoreSimulator";

export default function Dashboard({ simulator, onNavigate }) {
  const {
    metrics,
    settings,
    profit,
    activeOrders,
    highRiskOrders,
    busyRiders,
    lowStockCount,
    riders,
  } = simulator;
  const idleRiders = riders.length - busyRiders;
  const ordersMeta =
    activeOrders.length === 0
      ? "No live orders in queue"
      : `${highRiskOrders} at SLA risk`;
  const ridersMeta =
    activeOrders.length === 0
      ? `${idleRiders} riders ready for next dispatch`
      : `${idleRiders} riders on standby`;

  return (
    <div className="page-layout">
      <section className="hero-panel">
        <div className="hero-copy-wrap">
          <p className="eyebrow">DarkStore Command Center</p>
          <h1>Operations Dashboard</h1>
          <p className="hero-copy">
            A judge-ready operations console for dark store teams, designed to show demand, fleet readiness,
            and business health at a glance.
          </p>
          <div className="hero-pill-row">
            <span className="hero-pill">Live fulfillment state</span>
            <span className="hero-pill">Multi-page workspace</span>
            <span className="hero-pill">Phone-first access</span>
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat-card">
            <span className="stat-label">Active orders</span>
            <strong>{activeOrders.length}</strong>
            <span className="stat-meta">{ordersMeta}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Riders moving</span>
            <strong>{busyRiders}</strong>
            <span className="stat-meta">{ridersMeta}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Net profit</span>
            <strong>{formatCurrency(profit)}</strong>
            <span className="stat-meta">Fill rate {metrics.fillRate}%</span>
          </div>
        </div>
      </section>

      <section className="system-banner">
        <div>
          <span className="banner-dot" />
          <strong>{settings.backendMode}</strong>
        </div>
        <p>
          Pages are now separated. Use the left navigation to jump between overview, warehouse, delivery,
          and admin operations.
        </p>
      </section>

      <section className="summary-grid">
        <SummaryCard label="Delivered today" value={metrics.delivered} accent="green" detail="Orders completed" />
        <SummaryCard label="Avg order value" value={formatCurrency(metrics.avgOrderValue)} accent="cyan" detail="Rolling basket size" />
        <SummaryCard label="Low stock alerts" value={lowStockCount} accent="orange" detail="Items below reorder point" />
        <SummaryCard label="Store mode" value={settings.storeOpen ? "Open" : "Paused"} accent="violet" detail="Admin controlled" />
      </section>

      <section className="quick-grid">
        <button className="quick-link-card" onClick={() => onNavigate("warehouse")} type="button">
          <span>Warehouse</span>
          <strong>Inventory, stock pressure, and pick readiness</strong>
          <small>Track low stock risk, replenishment mode, and pick-zone health.</small>
        </button>
        <button className="quick-link-card" onClick={() => onNavigate("delivery")} type="button">
          <span>Delivery</span>
          <strong>Rider movement, route map, and order dispatch</strong>
          <small>Watch active riders, live map positions, and dispatch queue movement.</small>
        </button>
        <button className="quick-link-card" onClick={() => onNavigate("admin")} type="button">
          <span>Admin</span>
          <strong>Simulation controls, syncs, and overrides</strong>
          <small>Run scenarios, trigger manual sync, and adjust store behavior in one place.</small>
        </button>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, detail, accent }) {
  return (
    <div className={`summary-card ${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
