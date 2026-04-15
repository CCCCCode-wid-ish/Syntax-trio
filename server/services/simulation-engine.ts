import { DashboardSnapshot, SimulationScenario } from "../../src/shared/types.js";
import { SimulationEventBus } from "../core/event-bus.js";
import { buildMetricCards } from "../core/metrics.js";
import {
  createInitialState,
  productById,
  SimulationState
} from "../core/state.js";
import {
  buildConnectedAgents,
  demandAgent,
  dispatchAgent,
  inventoryAgent,
  monitoringAgent,
  pickingAgent,
  profitAgent,
  reserveInventory,
  routingAgent
} from "./agents.js";
import {
  assignDispatch,
  assignPicking,
  buildRecommendationFeed,
  finishDeliveredOrders,
  routeOrders,
  updateOrchestratorState
} from "./orchestrator-service.js";

const zoneOptions = ["Central", "North", "East"] as const;
const skuIds = ["milk", "bread", "banana", "chips", "soda", "icecream", "detergent", "eggs"];

const scenarioConfig: Record<SimulationScenario, { minDelay: number; maxDelay: number; burst: number; congestionFactor: number; failureChance: number; delayChance: number }> = {
  normal: { minDelay: 2000, maxDelay: 5000, burst: 1, congestionFactor: 0.01, failureChance: 0.04, delayChance: 0.08 },
  high_load: { minDelay: 1200, maxDelay: 3200, burst: 2, congestionFactor: 0.03, failureChance: 0.08, delayChance: 0.12 },
  failure: { minDelay: 2200, maxDelay: 5200, burst: 1, congestionFactor: 0.02, failureChance: 0.24, delayChance: 0.28 },
  peak_demand: { minDelay: 1000, maxDelay: 2800, burst: 3, congestionFactor: 0.04, failureChance: 0.06, delayChance: 0.18 }
};

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const weightedChoice = <T>(items: Array<[T, number]>): T => {
  const total = items.reduce((sum, [, weight]) => sum + weight, 0);
  let pick = Math.random() * total;
  for (const [item, weight] of items) {
    if (pick < weight) return item;
    pick -= weight;
  }
  return items[items.length - 1][0];
};

export class SimulationEngine {
  private readonly bus = new SimulationEventBus();
  private readonly state: SimulationState = createInitialState();
  private timer?: NodeJS.Timeout;
  private nextOrderDelayMs = 0;

  constructor() {
    this.nextOrderDelayMs = this.randomOrderDelay(this.state.control.scenario);
  }

  getSnapshot(): DashboardSnapshot {
    if (!this.state.recommendations.length) {
      this.runCycle();
    }
    return {
      generatedAt: new Date().toISOString(),
      metrics: buildMetricCards(this.state),
      products: this.state.products,
      stores: this.state.stores,
      riders: this.state.riders,
      pickers: this.state.pickers,
      orders: this.state.orders,
      alerts: this.state.alerts,
      recommendations: this.state.recommendations,
      resolutions: this.state.resolutions,
      restockSignals: this.state.restockSignals,
      pickingBatches: this.state.pickingBatches,
      dispatchPlans: this.state.dispatchPlans,
      profitDecisions: this.state.profitDecisions,
      eventLog: this.state.eventLog,
      control: this.state.control,
      orchestrator: this.state.orchestrator
    };
  }

  subscribe(listener: (event: DashboardSnapshot["eventLog"][number]) => void) {
    return this.bus.subscribe(listener);
  }

  tick() {
    this.state.control.tickCount += 1;
    this.state.control.lastTickAt = new Date().toISOString();
    this.advanceOrderSchedule(this.state.control.tickIntervalMs);
    this.settleResources();

    this.bus.publish(this.state, {
      type: "simulation.tick",
      severity: "info",
      agent: "System",
      entityType: "system",
      entityId: "simulation",
      message: `Tick ${this.state.control.tickCount} processed in ${this.state.control.scenario} mode.`,
      payload: { tick: this.state.control.tickCount, scenario: this.state.control.scenario }
    });
    this.runCycle();
  }

  start() {
    if (this.timer) return;
    this.state.control.mode = "running";
    this.timer = setInterval(() => this.tick(), this.state.control.tickIntervalMs);
  }

  pause() {
    this.state.control.mode = "paused";
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  setSpeed(tickIntervalMs: number) {
    this.state.control.tickIntervalMs = Math.max(1000, tickIntervalMs);
    if (this.state.control.mode === "running") {
      this.pause();
      this.start();
    }
  }

  setScenario(scenario: SimulationScenario) {
    this.state.control.scenario = scenario;
    this.nextOrderDelayMs = this.randomOrderDelay(scenario);
    this.bus.publish(this.state, {
      type: "orchestrator.resolved",
      severity: "info",
      agent: "System",
      entityType: "system",
      entityId: "simulation",
      message: `Simulation switched to ${scenario.replace("_", " ")} mode.`,
      payload: { scenario }
    });
  }

  private runCycle() {
    const demand = demandAgent(this.state);
    const inventory = inventoryAgent(this.state, this.bus);
    const routes = routingAgent(this.state);
    const profits = profitAgent(this.state);
    const resolutions = routeOrders(this.state, this.bus, routes, profits, reserveInventory);
    const picks = pickingAgent(this.state);
    const batches = assignPicking(this.state, this.bus, picks);
    const dispatches = dispatchAgent(this.state);
    const plans = assignDispatch(this.state, this.bus, dispatches);
    finishDeliveredOrders(this.state, this.bus);
    const monitoring = monitoringAgent(this.state, this.bus);
    const connectedAgents = buildConnectedAgents(
      demand,
      inventory,
      routes,
      picks,
      dispatches,
      profits,
      monitoring
    );

    this.state.restockSignals = inventory.signals.slice(0, 20);
    this.state.pickingBatches = batches.slice(0, 20);
    this.state.dispatchPlans = plans.slice(0, 20);
    this.state.profitDecisions = profits.slice(0, 20);
    this.state.alerts = [...inventory.alerts, ...monitoring.alerts].slice(0, 20);
    this.state.recommendations = buildRecommendationFeed({
      demand,
      inventory: inventory.recommendations,
      routes,
      picks,
      dispatches,
      profits,
      monitoring: monitoring.recommendations
    });
    this.state.resolutions = resolutions.slice(0, 20);
    updateOrchestratorState(this.state, this.bus, connectedAgents, this.state.resolutions, profits, monitoring);
  }

  private settleResources() {
    const config = scenarioConfig[this.state.control.scenario];

    for (const rider of this.state.riders) {
      if (rider.status === "delivering") {
        rider.currentLoad = Math.max(0, rider.currentLoad - 1);
        rider.batteryLevel = Math.max(25, rider.batteryLevel - 4);
        if (Math.random() < config.failureChance * 0.18) {
          rider.status = "break";
          this.bus.publish(this.state, {
            type: "anomaly.detected",
            severity: "critical",
            agent: "Monitoring / Anomaly Agent",
            entityType: "rider",
            entityId: rider.id,
            message: `${rider.name} experienced a delivery failure and is temporarily unavailable.`,
            payload: { riderId: rider.id, battery: rider.batteryLevel }
          });
        }
        if (rider.currentLoad === 0 && rider.status !== "break") {
          rider.status = "available";
        }
      } else if (rider.batteryLevel < 98) {
        rider.batteryLevel = Math.min(100, rider.batteryLevel + 1);
      }
    }

    for (const picker of this.state.pickers) {
      if (picker.status === "picking") {
        picker.queueDepth = Math.max(0, picker.queueDepth - 1);
        if (picker.queueDepth === 0) {
          picker.status = "available";
          continue;
        }
      }
      if (picker.status === "available" && Math.random() < 0.03) {
        picker.status = "break";
      }
    }

    for (const store of this.state.stores) {
      store.pickingCongestion = Math.min(0.95, store.pickingCongestion + config.congestionFactor);
      store.dispatchLoad = Math.min(0.92, store.dispatchLoad + config.congestionFactor);
      store.packLoad = Math.min(0.85, store.packLoad + config.congestionFactor * 0.8);

      for (const item of store.inventory) {
        if (item.incomingStock <= 0) continue;
        const replenished = Math.min(
          item.incomingStock,
          Math.max(1, Math.round(item.targetStock * 0.08))
        );
        item.incomingStock -= replenished;
        item.currentStock += replenished;
        this.bus.publish(this.state, {
          type: "inventory.restocked",
          severity: "info",
          agent: "System",
          entityType: "inventory",
          entityId: `${store.id}:${item.productId}`,
          message: `${replenished} units of ${item.productId} activated at ${store.name}.`,
          payload: { storeId: store.id, productId: item.productId, replenished }
        });
      }
    }

    this.simulateDeliveryDelays();
  }

  private simulateDeliveryDelays() {
    const config = scenarioConfig[this.state.control.scenario];

    for (const order of this.state.orders) {
      if (order.status !== "out_for_delivery") continue;
      if (Math.random() < config.delayChance) {
        order.promisedMinutes += 2;
        this.bus.publish(this.state, {
          type: "anomaly.detected",
          severity: "warning",
          agent: "Monitoring / Anomaly Agent",
          entityType: "order",
          entityId: order.id,
          message: `${order.id} is experiencing a delivery delay.`,
          payload: { orderId: order.id, newPromise: order.promisedMinutes }
        });
      }
      if (this.state.control.scenario === "failure" && Math.random() < config.failureChance * 0.1) {
        order.status = "rejected";
        order.rejectionReason = "Delivery infrastructure failure.";
        this.bus.publish(this.state, {
          type: "order.routed",
          severity: "critical",
          agent: "Delivery Dispatch Agent",
          entityType: "order",
          entityId: order.id,
          message: `${order.id} could not be completed due to a delivery failure.`,
          payload: { orderId: order.id }
        });
      }
    }
  }

  private advanceOrderSchedule(elapsedMs: number) {
    this.nextOrderDelayMs -= elapsedMs;
    if (this.nextOrderDelayMs > 0) return;
    const config = scenarioConfig[this.state.control.scenario];
    const burst = config.burst + (this.state.control.scenario === "peak_demand" ? 1 : 0);
    this.generateOrders(Math.max(1, burst));
    this.nextOrderDelayMs = this.randomOrderDelay(this.state.control.scenario);
  }

  private randomOrderDelay(scenario: SimulationScenario) {
    const config = scenarioConfig[scenario];
    return randomInt(config.minDelay, config.maxDelay);
  }

  private generateOrders(count: number) {
    const productWeights: Array<[string, number]> = skuIds.map((productId) => {
      const product = productById(this.state, productId);
      return [productId, product?.popularity ?? 0.5];
    });

    const zoneWeights: Array<[string, number]> = [
      ["Central", 0.34],
      ["North", 0.28],
      ["East", 0.38]
    ];

    for (let index = 0; index < count; index += 1) {
      const zone = weightedChoice(zoneWeights);
      const linesCount = randomInt(1, 4);
      const selected = new Set<string>();
      const lines = Array.from({ length: linesCount }, () => {
        const productId = weightedChoice(productWeights);
        selected.add(productId);
        return productId;
      })
        .filter((productId, index, values) => values.indexOf(productId) === index)
        .map((productId) => ({ productId, quantity: randomInt(1, 4) }));

      const basketValue = lines.reduce(
        (sum, line) => sum + (productById(this.state, line.productId)?.basePrice ?? 2) * line.quantity,
        0
      );
      const urgency = this.state.control.scenario === "peak_demand" ? 8 : randomInt(10, 16);
      const order = {
        id: `ord-${this.state.orderCounter}`,
        zone,
        createdAt: new Date().toISOString(),
        promisedMinutes: urgency,
        status: "queued" as const,
        lines,
        basketValue: Number(basketValue.toFixed(2))
      };

      this.state.orders = [order, ...this.state.orders].slice(0, 80);
      this.bus.publish(this.state, {
        type: "order.created",
        severity: "info",
        agent: "System",
        entityType: "order",
        entityId: order.id,
        message: `Generated ${order.id} for ${zone}.`,
        payload: { ...order }
      });
      this.state.orderCounter += 1;
    }
  }
}
