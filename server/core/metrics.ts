import { MetricCard } from "../../src/shared/types.js";
import { SimulationState } from "./state.js";

export const buildMetricCards = (state: SimulationState): MetricCard[] => {
  const liveOrders = state.orders.filter((order) => !["delivered", "rejected"].includes(order.status)).length;
  const etaOrders = state.orders.filter((order) => order.estimatedMinutes !== undefined);
  const avgEta =
    etaOrders.reduce((sum, order) => sum + (order.estimatedMinutes ?? 0), 0) /
    Math.max(etaOrders.length, 1);
  const profitable = state.profitDecisions.filter((decision) => decision.profitable).length;
  const riskCount = state.alerts.length + state.restockSignals.length;

  return [
    { label: "Live Orders", value: `${liveOrders}`, delta: "Continuous event stream" },
    { label: "Avg ETA", value: `${avgEta.toFixed(1)} min`, delta: "Routing agent optimized" },
    { label: "Profitable Orders", value: `${profitable}`, delta: "Profit agent screened" },
    { label: "Detected Risks", value: `${riskCount}`, delta: "Monitoring + inventory" }
  ];
};
