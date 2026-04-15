import {
  AgentName,
  AgentRecommendation,
  Alert,
  DispatchPlan,
  OrchestratorAgentStatus,
  PickingBatch,
  ProfitDecision,
  RestockSignal
} from "../../src/shared/types.js";
import { SimulationEventBus } from "../core/event-bus.js";
import {
  productById,
  SimulationState,
  storeById,
  zoneDistance
} from "../core/state.js";

export const demandAgent = (state: SimulationState): AgentRecommendation[] =>
  state.stores.map((store) => {
    const hot = store.inventory
      .map((item) => ({
        ...item,
        coverageHours:
          (item.currentStock + item.incomingStock - item.reservedStock) /
          Math.max(item.avgDailyDemand / 24, 0.1)
      }))
      .sort((a, b) => a.coverageHours - b.coverageHours)
      .slice(0, 2);
    return {
      agent: "Demand Forecasting Agent" as AgentName,
      subject: store.name,
      summary: `Forecast pressure building in ${store.zone}; protect ${hot.map((item) => item.productId).join(" and ")}.`,
      score: Math.min(0.98, 1 - hot[0].coverageHours / 20),
      rationale: hot.map((item) => `${item.productId} has ${item.coverageHours.toFixed(1)} forecast hours left.`),
      tradeoffs: ["Extra stock raises holding cost.", "More cover reduces stockout risk."],
      actions: hot.map((item) => `Raise target cover for ${item.productId}.`)
    };
  });

export const inventoryAgent = (state: SimulationState, bus: SimulationEventBus) => {
  const recommendations: AgentRecommendation[] = [];
  const signals: RestockSignal[] = [];
  const alerts: Alert[] = [];

  for (const store of state.stores) {
    const risky = store.inventory.filter(
      (item) =>
        item.currentStock + item.incomingStock - item.reservedStock <= item.reorderPoint + 2
    );
    if (!risky.length) continue;

    for (const item of risky) {
      const signal: RestockSignal = {
        id: `restock-${store.id}-${item.productId}`,
        storeId: store.id,
        productId: item.productId,
        quantity: Math.max(0, item.targetStock - item.currentStock - item.incomingStock),
        urgency: item.currentStock <= item.reorderPoint ? "critical" : "high",
        reason: "Net stock is near reorder point."
      };
      signals.push(signal);
      bus.publish(state, {
        type: "inventory.risk",
        severity: signal.urgency === "critical" ? "critical" : "warning",
        agent: "Inventory Agent",
        entityType: "inventory",
        entityId: `${store.id}:${item.productId}`,
        message: `${item.productId} is near stockout in ${store.name}.`,
        payload: { ...signal }
      });
    }

    recommendations.push({
      agent: "Inventory Agent",
      subject: store.name,
      summary: `${risky.length} SKUs need replenishment in ${store.zone}.`,
      score: 0.87,
      rationale: risky
        .slice(0, 3)
        .map((item) => `${item.productId} on-hand ${item.currentStock}, reorder point ${item.reorderPoint}.`),
      tradeoffs: ["Urgent transfers cost more.", "Restocking protects fill rate."],
      actions: risky.slice(0, 3).map((item) => `Restock ${item.productId} to ${item.targetStock}.`)
    });
    alerts.push({
      id: `inv-${store.id}`,
      title: `${store.name} stock pressure`,
      detail: `${risky.length} SKUs are close to stockout.`,
      priority: risky.some((item) => item.currentStock <= item.reorderPoint) ? "critical" : "high",
      sourceAgent: "Inventory Agent",
      createdAt: new Date().toISOString()
    });
  }

  return { recommendations, signals, alerts };
};

export const routingAgent = (state: SimulationState) =>
  state.orders
    .filter((order) => order.status === "queued" || order.status === "routed")
    .map((order) => {
      const ranked = state.stores
        .map((store) => {
          const fillRate =
            order.lines.filter((line) => {
              const item = store.inventory.find((inventory) => inventory.productId === line.productId);
              return (item?.currentStock ?? 0) - (item?.reservedStock ?? 0) >= line.quantity;
            }).length / order.lines.length;
          const distanceKm = zoneDistance[order.zone] + (store.zone === order.zone ? 0.2 : 1.1);
          const eta = distanceKm * 2.7 + store.pickingCongestion * 5 + store.dispatchLoad * 3;
          const score = fillRate * 0.55 + (1 / eta) * 2.5 + (1 - store.utilization) * 0.2;
          return { store, score, eta, distanceKm, fillRate };
        })
        .sort((a, b) => b.score - a.score)[0];
      return {
        orderId: order.id,
        storeId: ranked.store.id,
        score: ranked.score,
        eta: Number(ranked.eta.toFixed(1)),
        distanceKm: Number(ranked.distanceKm.toFixed(1)),
        rationale: [
          `${(ranked.fillRate * 100).toFixed(0)}% item availability.`,
          `ETA ${ranked.eta.toFixed(1)} minutes.`,
          `Distance ${ranked.distanceKm.toFixed(1)} km.`
        ]
      };
    });

export const pickingAgent = (state: SimulationState) =>
  state.orders
    .filter((order) => ["allocated", "routed", "picking"].includes(order.status))
    .filter((order) => order.assignedStoreId)
    .map((order) => {
      const pickers = state.pickers
        .filter((picker) => picker.storeId === order.assignedStoreId)
        .sort((a, b) => a.queueDepth - b.queueDepth || b.speedUnitsPerMinute - a.speedUnitsPerMinute);
      const picker = pickers[0];
      const units = order.lines.reduce((sum, line) => sum + line.quantity, 0);
      const pathMeters = 38 + units * 11 + (picker?.queueDepth ?? 0) * 6;
      const pickTime = pathMeters / 28 + units / Math.max(picker?.speedUnitsPerMinute ?? 2.1, 1);
      const batch: PickingBatch = {
        id: `batch-${order.id}`,
        storeId: order.assignedStoreId!,
        orderIds: [order.id],
        pickerId: picker?.id,
        estimatedPickTimeMinutes: Number(pickTime.toFixed(1)),
        pathMeters
      };
      return { orderId: order.id, pickerId: picker?.id, pickTime: Number(pickTime.toFixed(1)), batch };
    });

export const dispatchAgent = (state: SimulationState) =>
  state.orders
    .filter((order) => ["packed", "dispatching"].includes(order.status))
    .map((order) => {
      const winner = state.riders
        .filter((rider) => rider.status === "available" || rider.zone === order.zone)
        .map((rider) => {
          const distanceKm = order.deliveryDistanceKm ?? zoneDistance[order.zone];
          const eta = distanceKm * (2.15 - rider.speedScore * 0.35) + rider.currentLoad * 2;
          const cost = distanceKm * rider.costPerKm + 1.4 + rider.currentLoad * 0.2;
          const score =
            rider.speedScore * 0.45 +
            (rider.batteryLevel / 100) * 0.25 +
            (1 - rider.currentLoad / 3) * 0.2 +
            (1 / Math.max(cost, 0.1)) * 0.1;
          return { rider, eta, cost, score };
        })
        .sort((a, b) => b.score - a.score)[0];
      const plan: DispatchPlan = {
        orderId: order.id,
        riderId: winner?.rider.id,
        routeStops: [`${order.zone}-drop`],
        etaMinutes: Number((winner?.eta ?? 99).toFixed(1)),
        cost: Number((winner?.cost ?? 0).toFixed(2))
      };
      return { orderId: order.id, plan };
    });

export const profitAgent = (state: SimulationState): ProfitDecision[] =>
  state.orders
    .filter((order) => !["delivered", "rejected"].includes(order.status))
    .map((order) => {
      const itemCost = order.lines.reduce((sum, line) => {
        const product = productById(state, line.productId);
        return sum + ((product?.basePrice ?? 1) * (1 - (product?.marginRate ?? 0.3))) * line.quantity;
      }, 0);
      const opCost =
        1.2 +
        (order.deliveryDistanceKm ?? zoneDistance[order.zone]) * 0.45 +
        (order.pickTimeMinutes ?? 2.6) * 0.18;
      const projectedCost = Number((itemCost + opCost).toFixed(2));
      const projectedMargin = Number((order.basketValue - projectedCost).toFixed(2));
      return {
        orderId: order.id,
        projectedMargin,
        projectedCost,
        profitable: projectedMargin > 0,
        recommendation:
          projectedMargin < -1
            ? "reject"
            : projectedMargin < 0.75
              ? "batch"
              : projectedMargin < 1.4
                ? "reroute"
                : "approve"
      };
    });

export const monitoringAgent = (state: SimulationState, bus: SimulationEventBus) => {
  const recommendations: AgentRecommendation[] = [];
  const alerts: Alert[] = [];

  for (const order of state.orders) {
    if (["delivered", "rejected"].includes(order.status)) continue;
    const age = (Date.now() - new Date(order.createdAt).getTime()) / 60000;
    const projected = (order.pickTimeMinutes ?? 0) + (order.estimatedMinutes ?? zoneDistance[order.zone] * 3);
    if (age + projected > order.promisedMinutes) {
      const priority = age > order.promisedMinutes ? "critical" : "high";
      alerts.push({
        id: `sla-${order.id}`,
        title: `SLA risk on ${order.id}`,
        detail: `Age ${age.toFixed(1)} + projected ${projected.toFixed(1)} > promise ${order.promisedMinutes}.`,
        priority,
        sourceAgent: "Monitoring / Anomaly Agent",
        createdAt: new Date().toISOString()
      });
      bus.publish(state, {
        type: "anomaly.detected",
        severity: priority === "critical" ? "critical" : "warning",
        agent: "Monitoring / Anomaly Agent",
        entityType: "order",
        entityId: order.id,
        message: `${order.id} is at SLA risk.`,
        payload: { age, projected, promise: order.promisedMinutes }
      });
    }
  }

  for (const store of state.stores) {
    if (store.pickingCongestion > 0.75 || store.dispatchLoad > 0.78) {
      recommendations.push({
        agent: "Monitoring / Anomaly Agent",
        subject: store.name,
        summary: `${store.name} is under operational stress.`,
        score: Math.max(store.pickingCongestion, store.dispatchLoad),
        rationale: [
          `Picking congestion ${(store.pickingCongestion * 100).toFixed(0)}%.`,
          `Dispatch load ${(store.dispatchLoad * 100).toFixed(0)}%.`
        ],
        tradeoffs: ["Load shedding can increase cost.", "Ignoring congestion risks SLA misses."],
        actions: ["Route the next wave to a lower-load store."]
      });
    }
  }

  return { recommendations, alerts };
};

export const buildConnectedAgents = (
  demand: ReturnType<typeof demandAgent>,
  inventory: ReturnType<typeof inventoryAgent>,
  routes: ReturnType<typeof routingAgent>,
  picks: ReturnType<typeof pickingAgent>,
  dispatches: ReturnType<typeof dispatchAgent>,
  profits: ProfitDecision[],
  monitoring: ReturnType<typeof monitoringAgent>
): OrchestratorAgentStatus[] => [
  {
    agent: "Demand Forecasting Agent",
    activeSubjects: demand.length,
    lastSummary: demand[0]?.summary ?? "No forecast pressure."
  },
  {
    agent: "Inventory Agent",
    activeSubjects: inventory.signals.length,
    lastSummary: inventory.recommendations[0]?.summary ?? "Inventory healthy."
  },
  {
    agent: "Order Routing Agent",
    activeSubjects: routes.length,
    lastSummary: routes[0] ? `Routing ${routes[0].orderId} to ${routes[0].storeId}.` : "No routing decisions."
  },
  {
    agent: "Picking Optimization Agent",
    activeSubjects: picks.length,
    lastSummary: picks[0] ? `Picking ${picks[0].orderId} in ${picks[0].pickTime.toFixed(1)} min.` : "No picking queue."
  },
  {
    agent: "Delivery Dispatch Agent",
    activeSubjects: dispatches.length,
    lastSummary: dispatches[0]
      ? `Dispatching ${dispatches[0].orderId} with ${dispatches[0].plan.riderId ?? "pending rider"}.`
      : "No dispatch queue."
  },
  {
    agent: "Profit Optimization Agent",
    activeSubjects: profits.length,
    lastSummary: profits[0] ? `${profits[0].orderId} => ${profits[0].recommendation}.` : "No profit decisions."
  },
  {
    agent: "Monitoring / Anomaly Agent",
    activeSubjects: monitoring.alerts.length + monitoring.recommendations.length,
    lastSummary: monitoring.alerts[0]?.title ?? monitoring.recommendations[0]?.summary ?? "System stable."
  }
];

export const reserveInventory = (state: SimulationState, orderId: string, storeId: string) => {
  const order = state.orders.find((item) => item.id === orderId);
  const store = storeById(state, storeId);
  if (!order || !store) return;
  for (const line of order.lines) {
    const item = store.inventory.find((inventory) => inventory.productId === line.productId);
    if (item) item.reservedStock += line.quantity;
  }
};
