import AgentLog from "../components/Layout/AgentLog";

export default function AdminPage({ simulator }) {
  const {
    logs,
    settings,
    addOrders,
    emergencyDispatch,
    manualSync,
    resetSimulation,
    toggleAutoRestock,
    toggleDelayMode,
    togglePause,
    toggleStoreOpen,
  } = simulator;

  return (
    <div className="page-layout">
      <section className="page-header-card">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Operations Controls</h1>
          <p className="hero-copy">
            Manual overrides, backend simulation settings, and emergency operations live in one dedicated page.
          </p>
        </div>
        <div className="page-badge-stack">
          <span className="panel-chip">{settings.storeOpen ? "Store open" : "Store paused"}</span>
          <span className="panel-chip warning">{settings.delayMode ? "Delay mode on" : "Normal flow"}</span>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Simulation Controls</p>
              <h2>Stress-test the system</h2>
            </div>
          </div>

          <div className="controls-grid">
            <button className="action-button primary" onClick={() => addOrders(3)} type="button">
              Increase orders
            </button>
            <button className="action-button" onClick={resetSimulation} type="button">
              Reset
            </button>
            <button className="action-button" onClick={toggleDelayMode} type="button">
              {settings.delayMode ? "Clear delay" : "Delay"}
            </button>
            <button className="action-button" onClick={togglePause} type="button">
              {settings.simulationPaused ? "Resume" : "Pause"}
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Admin Panel</p>
              <h2>Overrides and syncs</h2>
            </div>
          </div>

          <div className="admin-grid">
            <button className="admin-card" onClick={toggleAutoRestock} type="button">
              <span>Inventory mode</span>
              <strong>{settings.autoRestock ? "Disable auto restock" : "Enable auto restock"}</strong>
            </button>
            <button className="admin-card" onClick={emergencyDispatch} type="button">
              <span>Fleet action</span>
              <strong>Emergency dispatch</strong>
            </button>
            <button className="admin-card" onClick={manualSync} type="button">
              <span>Backend sync</span>
              <strong>Manual refresh</strong>
            </button>
            <button className="admin-card" onClick={toggleStoreOpen} type="button">
              <span>Store state</span>
              <strong>{settings.storeOpen ? "Pause store intake" : "Reopen store intake"}</strong>
            </button>
          </div>

          <div className="health-strip">
            <span>Picking SLA: 94%</span>
            <span>Dispatch SLA: {settings.delayMode ? "81%" : "92%"}</span>
            <span>Backend: {settings.backendMode}</span>
          </div>
        </div>

        <AgentLog logs={logs} />
      </section>
    </div>
  );
}
