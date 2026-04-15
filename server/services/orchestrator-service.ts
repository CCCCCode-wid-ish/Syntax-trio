import {
  AgentName,
  AgentRecommendation,
  OrchestratorAgentStatus,
  OrchestratorState,
  OrchestrationResolution,
  ProfitDecision
} from "../../src/shared/types.js";
import { SimulationEventBus } from "../core/event-bus.js";
import { SimulationState, storeById } from "../core/state.js";

export const routeOrders = (
  state: SimulationState,
  bus: SimulationEventBus,
  routes: Array<{
    orderId: string;
    storeId: string;
    score: number;
    eta: number;
    distanceKm: number;
    rationale: string[];
  }>,
  profits: ProfitDecision[],
  reserveInventory: (state: SimulationState, orderId: string, storeId: string) => void
): OrchestrationResolution[] => {
  const resolutions: OrchestrationResolution[] = [];

  for (const route of routes) {
    const order = state.orders.find((item) => item.id === route.orderId);
    const profit = profits.find((item) => item.orderId === route.orderId);
    if (!order || !profit) continue;

    let winningObjective = "Speed + margin";
    let reason = `Selected ${route.storeId} with ETA ${route.eta} min.`;

    if (profit.recommendation === "reject") {
      order.status = "rejected";
      order.rejectionReason = "Rejected by profit optimization agent.";
      winningObjective = "Profit protection";
      reason = `Projected margin ${profit.projectedMargin.toFixed(2)} is too low.`;
    } else {
      order.assignedStoreId = route.storeId;
      order.estimatedMinutes = route.eta;
      order.deliveryDistanceKm = route.distanceKm;
      order.status = "allocated";
      if (profit.recommendation !== "approve") {
        order.batchId = `batch-${order.zone.toLowerCase()}`;
      }
      reserveInventory(state, order.id, route.storeId);
      bus.publish(state, {
        type: "order.routed",
        severity: "info",
        agent: "Order Routing Agent",
        entityType: "order",
        entityId: order.id,
        message: `${order.id} routed to ${route.storeId}.`,
        payload: route
      });
    }

    resolutions.push({
      id: `res-${order.id}`,
      title: `Orchestrator decision for ${order.id}`,
      winningObjective,
      competingObjectives: ["speed", "cost", "inventory health"],
      reason
    });
    bus.publish(state, {
      type: "orchestrator.resolved",
      severity: winningObjective === "Profit protection" ? "warning" : "info",
      agent: "Orchestrator",
      entityType: "order",
      entityId: order.id,
      message: `Orchestrator finalized ${order.id}.`,
      payload: { winningObjective, reason }
    });
  }

  return resolutions;
};

export const assignPicking = (
  state: SimulationState,
  bus: SimulationEventBus,
  decisions: Array<{
    orderId: string;
    pickerId?: string;
    pickTime: number;
    batch: {
      id: string;
      storeId: string;
      orderIds: string[];
      pickerId?: string;
      estimatedPickTimeMinutes: number;
      pathMeters: number;
    };
  }>
) => {
  for (const decision of decisions) {
    const order = state.orders.find((item) => item.id === decision.orderId);
    if (!order || order.status === "rejected") continue;
    order.assignedPickerId = decision.pickerId;
    order.pickPathMeters = decision.batch.pathMeters;
    order.pickTimeMinutes = decision.pickTime;
    order.status = "packed";
    const picker = state.pickers.find((item) => item.id === decision.pickerId);
    if (picker) {
      picker.status = "picking";
      picker.queueDepth = Math.min(3, picker.queueDepth + 1);
    }
    bus.publish(state, {
      type: "batch.created",
      severity: "info",
      agent: "Picking Optimization Agent",
      entityType: "order",
      entityId: order.id,
      message: `Created ${decision.batch.id} for ${order.id}.`,
      payload: { ...decision.batch }
    });
    bus.publish(state, {
      type: "picker.assigned",
      severity: "info",
      agent: "Picking Optimization Agent",
      entityType: "picker",
      entityId: decision.pickerId ?? "unassigned",
      message: `Picker ${decision.pickerId ?? "pending"} allocated to ${order.id}.`,
      payload: {
        orderId: decision.orderId,
        pickerId: decision.pickerId,
        pickTime: decision.pickTime
      }
    });
    bus.publish(state, {
      type: "order.picked",
      severity: "info",
      agent: "Picking Optimization Agent",
      entityType: "order",
      entityId: order.id,
      message: `${order.id} pick completed.`,
      payload: {
        orderId: order.id,
        pickerId: decision.pickerId,
        pickTime: decision.pickTime,
        pathMeters: decision.batch.pathMeters
      }
    });
  }

  return decisions.map((item) => item.batch);
};

export const assignDispatch = (
  state: SimulationState,
  bus: SimulationEventBus,
  plans: Array<{
    orderId: string;
    plan: {
      orderId: string;
      riderId?: string;
      routeStops: string[];
      etaMinutes: number;
      cost: number;
    };
  }>
) => {
  for (const decision of plans) {
    const order = state.orders.find((item) => item.id === decision.orderId);
    if (!order || order.status === "rejected") continue;
    order.assignedRiderId = decision.plan.riderId;
    order.deliveryCost = decision.plan.cost;
    order.estimatedMinutes = decision.plan.etaMinutes;
    order.margin = Number(
      (order.basketValue - decision.plan.cost - (order.pickTimeMinutes ?? 0) * 0.18).toFixed(2)
    );
    order.status = decision.plan.riderId ? "out_for_delivery" : "dispatching";
    const rider = state.riders.find((item) => item.id === decision.plan.riderId);
    if (rider) {
      rider.status = "delivering";
      rider.currentLoad = Math.min(2, rider.currentLoad + 1);
    }
    bus.publish(state, {
      type: "dispatch.assigned",
      severity: decision.plan.riderId ? "info" : "warning",
      agent: "Delivery Dispatch Agent",
      entityType: "order",
      entityId: order.id,
      message: decision.plan.riderId
        ? `Assigned ${decision.plan.riderId} to ${order.id}.`
        : `No rider available for ${order.id}.`,
      payload: { ...decision.plan }
    });
  }

  return plans.map((item) => item.plan);
};

export const finishDeliveredOrders = (state: SimulationState, bus: SimulationEventBus) => {
  for (const order of state.orders) {
    if (order.status !== "out_for_delivery") continue;
    const age = (Date.now() - new Date(order.createdAt).getTime()) / 60000;
    if (age < Math.max(3, order.promisedMinutes * 0.45)) continue;
    order.status = "delivered";
    const store = storeById(state, order.assignedStoreId);
    if (!store) continue;
    for (const line of order.lines) {
      const item = store.inventory.find((inventory) => inventory.productId === line.productId);
      if (!item) continue;
      item.currentStock = Math.max(0, item.currentStock - line.quantity);
      item.reservedStock = Math.max(0, item.reservedStock - line.quantity);
    }
    bus.publish(state, {
      type: "order.delivered",
      severity: "info",
      agent: "Delivery Dispatch Agent",
      entityType: "order",
      entityId: order.id,
      message: `${order.id} has been delivered.`,
      payload: {
        orderId: order.id,
        storeId: order.assignedStoreId,
        riderId: order.assignedRiderId,
        deliveredAt: new Date().toISOString()
      }
    });
  }
};

export const updateOrchestratorState = (
  state: SimulationState,
  bus: SimulationEventBus,
  connectedAgents: OrchestratorAgentStatus[],
  resolutions: OrchestrationResolution[],
  profits: ProfitDecision[],
  monitoring: { alerts: Array<{ priority: string; detail: string }>; recommendations: AgentRecommendation[] }
) => {
  const activeConflicts =
    profits.filter((profit) => profit.recommendation !== "approve").length +
    monitoring.alerts.filter((alert) => alert.priority === "high" || alert.priority === "critical").length;
  const coordinationHealth: OrchestratorState["coordinationHealth"] =
    activeConflicts > 8 ? "degraded" : activeConflicts > 3 ? "watch" : "stable";
  const lastDecisionSummary =
    resolutions[0]?.reason ??
    monitoring.alerts[0]?.detail ??
    "Orchestrator aligned all agents without blocking conflicts.";

  state.orchestrator = {
    mode: "coordinating",
    coordinationHealth,
    activeConflicts,
    lastCycleAt: new Date().toISOString(),
    lastDecisionSummary,
    connectedAgents
  };

  bus.publish(state, {
    type: "orchestrator.resolved",
    severity:
      coordinationHealth === "degraded"
        ? "critical"
        : coordinationHealth === "watch"
          ? "warning"
          : "info",
    agent: "Orchestrator",
    entityType: "system",
    entityId: "orchestrator",
    message: `Orchestrator cycle completed with ${activeConflicts} active conflicts.`,
    payload: {
      coordinationHealth,
      activeConflicts,
      connectedAgents: connectedAgents.map((agent) => ({
        agent: agent.agent,
        activeSubjects: agent.activeSubjects
      }))
    }
  });
};

export const buildRecommendationFeed = (params: {
  demand: AgentRecommendation[];
  inventory: AgentRecommendation[];
  routes: Array<{ orderId: string; storeId: string; score: number; rationale: string[] }>;
  picks: Array<{ orderId: string; pickTime: number; pickerId?: string; batch: { id: string; pathMeters: number } }>;
  dispatches: Array<{ orderId: string; plan: { riderId?: string; etaMinutes: number; cost: number } }>;
  profits: ProfitDecision[];
  monitoring: AgentRecommendation[];
}) =>
  [
    ...params.demand,
    ...params.inventory,
    ...params.routes.map((route) => ({
      agent: "Order Routing Agent" as AgentName,
      subject: route.orderId,
      summary: `Route ${route.orderId} to ${route.storeId}.`,
      score: route.score,
      rationale: route.rationale,
      tradeoffs: ["Speed and fill rate can conflict.", "Closest store is not always most profitable."],
      actions: [`Assign ${route.orderId} to ${route.storeId}.`]
    })),
    ...params.picks.map((pick) => ({
      agent: "Picking Optimization Agent" as AgentName,
      subject: pick.orderId,
      summary: `Pick ${pick.orderId} in ${pick.pickTime.toFixed(1)} min.`,
      score: Math.max(0.45, 1 / Math.max(pick.pickTime / 4, 1)),
      rationale: [`Path ${pick.batch.pathMeters} meters.`, `Picker ${pick.pickerId ?? "pending"}.`],
      tradeoffs: ["Batching helps throughput.", "Waiting for a better batch adds latency."],
      actions: [`Create ${pick.batch.id}.`]
    })),
    ...params.dispatches.map((dispatch) => ({
      agent: "Delivery Dispatch Agent" as AgentName,
      subject: dispatch.orderId,
      summary: `Dispatch ${dispatch.orderId} using ${dispatch.plan.riderId ?? "next available rider"}.`,
      score: Math.max(0.35, 1 / Math.max(dispatch.plan.etaMinutes / 8, 1)),
      rationale: [
        `ETA ${dispatch.plan.etaMinutes.toFixed(1)} min.`,
        `Cost ${dispatch.plan.cost.toFixed(2)}.`
      ],
      tradeoffs: ["Cheaper riders can be slower.", "Fast dispatch can reduce batch opportunities."],
      actions: [`Assign rider ${dispatch.plan.riderId ?? "pending"}.`]
    })),
    ...params.profits.map((profit) => ({
      agent: "Profit Optimization Agent" as AgentName,
      subject: profit.orderId,
      summary: `${profit.orderId} margin ${profit.projectedMargin.toFixed(2)} with ${profit.recommendation}.`,
      score: Math.max(0.25, Math.min(0.95, profit.projectedMargin / 5 + 0.5)),
      rationale: [
        `Projected cost ${profit.projectedCost.toFixed(2)}.`,
        `Projected margin ${profit.projectedMargin.toFixed(2)}.`
      ],
      tradeoffs: ["Rejecting protects unit economics.", "Approving more orders helps volume."],
      actions: [`Recommendation: ${profit.recommendation}.`]
    })),
    ...params.monitoring
  ].sort((a, b) => b.score - a.score).slice(0, 40);
