import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  AgentRecommendation,
  Alert,
  CustomerOrder,
  DashboardSnapshot,
  DarkStore,
  MetricCard,
  OrchestrationResolution,
  Rider
} from "./shared/types";

const fetchSnapshot = async (method: "GET" | "POST" = "GET"): Promise<DashboardSnapshot> => {
  const response = await fetch(method === "GET" ? "/api/dashboard" : "/api/simulate/tick", { method });
  if (!response.ok) {
    throw new Error("Unable to load AutoFulfill AI data.");
  }
  return response.json();
};

type LiveEvent = {
  event: string;
  orderId?: string;
  store?: string;
  riderId?: string;
  pickerId?: string;
  log?: string;
  timestamp?: string;
  payload?: Record<string, unknown>;
};

const statusTone: Record<CustomerOrder["status"], string> = {
  queued: "tone-muted",
  routed: "tone-info",
  allocated: "tone-info",
  picking: "tone-warn",
  packed: "tone-info",
  dispatching: "tone-info",
  out_for_delivery: "tone-good",
  delivered: "tone-good",
  rejected: "tone-bad"
};

export function App() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticking, setTicking] = useState(false);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const socket = io({ path: "/socket.io" });

    const load = async () => {
      try {
        const data = await fetchSnapshot();
        if (!cancelled) {
          setSnapshot(data);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const handleSocketEvent = (data: LiveEvent) => {
      setEvents((prev) => [{ ...data, timestamp: data.timestamp ?? new Date().toISOString() }, ...prev].slice(0, 30));
      if (data.event !== "AGENT_DECISION_LOG") {
        fetchSnapshot()
          .then((result) => {
            if (!cancelled) setSnapshot(result);
          })
          .catch(() => {
            /* ignore live refresh errors */
          });
      }
    };

    socket.on("connect", () => {
      setConnected(true);
    });
    socket.on("disconnect", () => {
      setConnected(false);
    });
    socket.on("INITIAL_SNAPSHOT", (data: DashboardSnapshot) => {
      if (!cancelled) {
        setSnapshot(data);
        setError(null);
        setLoading(false);
      }
    });
    const eventNames = [
      "ORDER_CREATED",
      "ORDER_ROUTED",
      "INVENTORY_UPDATED",
      "ORDER_PICKED",
      "ORDER_DELIVERED",
      "AGENT_DECISION_LOG"
    ];
    eventNames.forEach((name) => socket.on(name, handleSocketEvent));

    load();
    const interval = window.setInterval(load, 15_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const handleTick = async () => {
    try {
      setTicking(true);
      const data = await fetchSnapshot("POST");
      setSnapshot(data);
      setError(null);
    } catch (tickError) {
      setError(tickError instanceof Error ? tickError.message : "Unable to advance simulation");
    } finally {
      setTicking(false);
    }
  };

  if (loading) {
    return (
      <main className="shell">
        <section className="panel hero">
          <h1>AutoFulfill AI</h1>
          <p>Loading agent network...</p>
        </section>
      </main>
    );
  }

  if (error || !snapshot) {
    return (
      <main className="shell">
        <section className="panel hero">
          <h1>AutoFulfill AI</h1>
          <p>{error ?? "Snapshot unavailable"}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="hero panel">
        <div>
          <p className="eyebrow">Backend operations OS for quick commerce</p>
          <h1>AutoFulfill AI</h1>
          <p className="lede">
            Autonomous agents forecast demand, protect inventory, route orders, optimize picking,
            assign riders, and arbitrate profit versus delivery speed in one control tower.
          </p>
        </div>
        <div className="hero-actions">
          <button onClick={handleTick} disabled={ticking}>
            {ticking ? "Advancing..." : "Run Simulation Tick"}
          </button>
          <div className="stamp">
            <span>Last orchestration</span>
            <strong>{new Date(snapshot.generatedAt).toLocaleTimeString()}</strong>
          </div>
        </div>
      </section>

      <section className="metrics-grid">
        {snapshot.metrics.map((metric) => (
          <MetricPanel key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="grid two-up">
        <AgentBoard recommendations={snapshot.recommendations} />
        <ResolutionBoard resolutions={snapshot.resolutions} alerts={snapshot.alerts} />
      </section>

      <section className="grid two-up">
        <StoreBoard stores={snapshot.stores} />
        <RiderBoard riders={snapshot.riders} />
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Live execution</p>
            <h2>Order Flow</h2>
          </div>
        </div>
        <div className="orders-grid">
          {snapshot.orders.map((order) => (
            <article key={order.id} className="order-card">
              <div className="order-topline">
                <strong>{order.id}</strong>
                <span className={`chip ${statusTone[order.status]}`}>{order.status.replaceAll("_", " ")}</span>
              </div>
              <p>{order.zone} zone · Promise {order.promisedMinutes} min</p>
              <p>Store {order.assignedStoreId ?? "Pending"} · Picker {order.assignedPickerId ?? "Pending"}</p>
              <p>Rider {order.assignedRiderId ?? "Pending"} · ETA {order.estimatedMinutes?.toFixed(1) ?? "--"} min</p>
              <p>Basket {order.basketValue.toFixed(2)} · Margin {order.margin?.toFixed(2) ?? "--"} · Pick path {order.pickPathMeters ?? "--"}m</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Live updates</p>
            <h2>Realtime Event Log</h2>
          </div>
          <div className="stamp">
            <span>WebSocket</span>
            <strong className={connected ? "tone-good" : "tone-bad"}>{connected ? "Live" : "Disconnected"}</strong>
          </div>
        </div>
        <div className="stack">
          {events.length ? (
            events.map((event, index) => (
              <article key={`${event.event}-${index}-${event.timestamp}`} className="event-card">
                <div className="order-topline">
                  <strong>{event.event}</strong>
                  <span className="chip tone-info">{event.orderId ?? event.store ?? "system"}</span>
                </div>
                <p>{event.log ?? JSON.stringify(event.payload)}</p>
                <p className="muted">{new Date(event.timestamp ?? Date.now()).toLocaleTimeString()}</p>
              </article>
            ))
          ) : (
            <p>No realtime events received yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function MetricPanel({ metric }: { metric: MetricCard }) {
  return (
    <article className="panel metric-card">
      <p className="eyebrow">{metric.label}</p>
      <h2>{metric.value}</h2>
      <p>{metric.delta}</p>
    </article>
  );
}

function AgentBoard({ recommendations }: { recommendations: AgentRecommendation[] }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">AI decision fabric</p>
          <h2>Agent Recommendations</h2>
        </div>
      </div>
      <div className="stack">
        {recommendations.slice(0, 7).map((recommendation) => (
          <article key={`${recommendation.agent}-${recommendation.subject}`} className="agent-card">
            <div className="order-topline">
              <strong>{recommendation.agent}</strong>
              <span className="chip tone-info">score {recommendation.score.toFixed(2)}</span>
            </div>
            <p className="subject">{recommendation.subject}</p>
            <p>{recommendation.summary}</p>
            <p className="muted">{recommendation.rationale[0]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ResolutionBoard({
  resolutions,
  alerts
}: {
  resolutions: OrchestrationResolution[];
  alerts: Alert[];
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Conflict resolution</p>
          <h2>Orchestrator Decisions</h2>
        </div>
      </div>
      <div className="stack">
        {resolutions.map((resolution) => (
          <article key={resolution.id} className="resolution-card">
            <strong>{resolution.title}</strong>
            <p className="subject">{resolution.winningObjective}</p>
            <p>{resolution.reason}</p>
          </article>
        ))}
        {alerts.map((alert) => (
          <article key={alert.id} className="alert-card">
            <div className="order-topline">
              <strong>{alert.title}</strong>
              <span className={`chip ${alert.priority === "critical" ? "tone-bad" : "tone-warn"}`}>{alert.priority}</span>
            </div>
            <p>{alert.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function StoreBoard({ stores }: { stores: DarkStore[] }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Dark stores</p>
          <h2>Inventory + Capacity</h2>
        </div>
      </div>
      <div className="stack">
        {stores.map((store) => {
          const lowStock = store.inventory.filter((item) => item.currentStock <= item.reorderPoint).length;
          return (
            <article key={store.id} className="store-card">
              <div className="order-topline">
                <strong>{store.name}</strong>
                <span className="chip tone-muted">{store.zone}</span>
              </div>
              <p>Utilization {(store.utilization * 100).toFixed(0)}% · Congestion {(store.pickingCongestion * 100).toFixed(0)}%</p>
              <p>{lowStock} SKUs at reorder threshold · Rent {store.rentPerHour}/hr</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function RiderBoard({ riders }: { riders: Rider[] }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Fleet state</p>
          <h2>Dispatch Network</h2>
        </div>
      </div>
      <div className="stack">
        {riders.map((rider) => (
          <article key={rider.id} className="rider-card">
            <div className="order-topline">
              <strong>{rider.name}</strong>
              <span className={`chip ${rider.status === "available" ? "tone-good" : rider.status === "break" ? "tone-warn" : "tone-info"}`}>
                {rider.status}
              </span>
            </div>
            <p>{rider.zone} zone · Battery {rider.batteryLevel}%</p>
            <p>Load {rider.currentLoad} · Speed score {rider.speedScore.toFixed(2)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
