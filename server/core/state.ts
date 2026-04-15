import {
  AgentRecommendation,
  Alert,
  CustomerOrder,
  DispatchPlan,
  OrchestratorState,
  OrchestrationResolution,
  Picker,
  PickingBatch,
  Product,
  ProfitDecision,
  RestockSignal,
  Rider,
  SimulationControl,
  SimulationEvent,
  SimulationScenario
} from "../../src/shared/types.js";
import {
  pickers as seedPickers,
  products,
  riders as seedRiders,
  seedOrders,
  stores as seedStores
} from "../data.js";

export type SimulationState = {
  products: Product[];
  stores: typeof seedStores;
  riders: Rider[];
  pickers: Picker[];
  orders: CustomerOrder[];
  alerts: Alert[];
  recommendations: AgentRecommendation[];
  resolutions: OrchestrationResolution[];
  restockSignals: RestockSignal[];
  pickingBatches: PickingBatch[];
  dispatchPlans: DispatchPlan[];
  profitDecisions: ProfitDecision[];
  eventLog: SimulationEvent[];
  control: SimulationControl;
  orchestrator: OrchestratorState;
  orderCounter: number;
  idCounter: number;
};

export const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const zoneDistance: Record<string, number> = {
  Central: 2.4,
  North: 3.2,
  East: 2.9
};

export const createInitialState = (): SimulationState => ({
  products: clone(products),
  stores: clone(seedStores),
  riders: clone(seedRiders),
  pickers: clone(seedPickers),
  orders: clone(seedOrders),
  alerts: [],
  recommendations: [],
  resolutions: [],
  restockSignals: [],
  pickingBatches: [],
  dispatchPlans: [],
  profitDecisions: [],
  eventLog: [],
  control: {
    mode: "paused",
    scenario: "normal",
    tickIntervalMs: 3000,
    tickCount: 0,
    lastTickAt: new Date().toISOString()
  },
  orchestrator: {
    mode: "coordinating",
    coordinationHealth: "stable",
    activeConflicts: 0,
    lastCycleAt: new Date().toISOString(),
    lastDecisionSummary: "Orchestrator initialized.",
    connectedAgents: []
  },
  orderCounter: 204,
  idCounter: 1
});

export const productById = (state: SimulationState, id: string) =>
  state.products.find((item) => item.id === id);

export const storeById = (state: SimulationState, id?: string) =>
  state.stores.find((item) => item.id === id);
