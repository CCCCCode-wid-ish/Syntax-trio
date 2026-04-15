import { formatCurrency } from "../hooks/useDarkstoreSimulator";

export default function DeliveryPage({ simulator }) {
  const { orders, riders, busyRiders, activeOrders } = simulator;

  return (
    <div className="page-layout">
      <section className="page-header-card">
        <div>
          <p className="eyebrow">Delivery</p>
          <h1>Riders and Dispatch Map</h1>
          <p className="hero-copy">
            This page shows only fleet operations, with rider movement synchronized to real active orders.
          </p>
        </div>
        <div className="page-badge-stack">
          <span className="panel-chip">{busyRiders} riders active</span>
          <span className="panel-chip success">{activeOrders.length} live orders</span>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Delivery Panel</p>
              <h2>Rider queue</h2>
            </div>
            <span className="panel-chip">{busyRiders} moving</span>
          </div>

          <div className="rider-list">
            {riders.map((rider) => (
              <div className="rider-card" key={rider.id}>
                <div>
                  <strong>{rider.name}</strong>
                  <p>{rider.id} · {rider.zone}</p>
                </div>
                <div className="rider-status">
                  <span className={`status-pill ${rider.status === "Idle" ? "muted" : "live"}`}>{rider.status}</span>
                  <small>{rider.eta ? `${rider.eta} min` : "Ready"}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Route Map</p>
              <h2>Live positions</h2>
            </div>
            <span className="panel-chip success">Synced</span>
          </div>

          <div className="map-panel">
            <div className="map-grid" />
            {riders.map((rider) => (
              <button
                key={rider.id}
                className={`map-marker ${rider.status === "Idle" ? "idle" : ""}`}
                style={{ left: `${rider.x}%`, top: `${rider.y}%` }}
                type="button"
              >
                {rider.id}
              </button>
            ))}
            <div className="map-legend">
              <span>North Hub</span>
              <span>Store</span>
              <span>South Grid</span>
            </div>
          </div>
        </div>

        <div className="panel page-span-two">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Dispatch Queue</p>
              <h2>Orders in fulfillment</h2>
            </div>
            <span className="panel-chip warning">{activeOrders.length} pending</span>
          </div>

          <div className="orders-table">
            {orders.map((order) => (
              <div className="order-row" key={order.id}>
                <div>
                  <strong>{order.id}</strong>
                  <p>{order.customer} · {order.items} items</p>
                </div>
                <div>
                  <span className={`status-pill ${order.risk === "High" ? "danger" : "live"}`}>{order.status}</span>
                  <p>{order.eta ? `${order.eta} min` : "Done"} · {formatCurrency(order.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
