export type Priority = "low" | "medium" | "high" | "critical";
export type StorageType = "ambient" | "cold" | "frozen";
export type RiderStatus = "available" | "delivering" | "break";
export type PickerStatus = "available" | "picking" | "break";
export type EventSeverity = "info" | "warning" | "critical";
export type AutomationMode = "running" | "paused";
export type SimulationScenario = "normal" | "high_load" | "failure" | "peak_demand";

export type OrderStatus =
  | "queued"
  | "routed"
  | "allocated"
  | "picking"
  | "packed"
  | "dispatching"
  | "out_for_delivery"
  | "delivered"
  | "rejected";

export type AgentName =
  | "Demand Forecasting Agent"
  | "Inventory Agent"
  | "Order Routing Agent"
  | "Picking Optimization Agent"
  | "Delivery Dispatch Agent"
  | "Profit Optimization Agent"
  | "Monitoring / Anomaly Agent"
  | "Orchestrator";

export interface Product {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  marginRate: number;
  storageType: StorageType;
  popularity: number;
}

export interface InventoryRecord {
  productId: string;
  currentStock: number;
  reservedStock: number;
  reorderPoint: number;
  targetStock: number;
  incomingStock: number;
  avgDailyDemand: number;
  leadTimeMinutes: number;
}

export interface DarkStore {
  id: string;
  name: string;
  zone: string;
  utilization: number;
  pickingCongestion: number;
  packLoad: number;
  dispatchLoad: number;
  rentPerHour: number;
  inventory: InventoryRecord[];
}

export interface Rider {
  id: string;
  name: string;
  zone: string;
  status: RiderStatus;
  batteryLevel: number;
  currentLoad: number;
  speedScore: number;
  costPerKm: number;
}

export interface Picker {
  id: string;
  name: string;
  storeId: string;
  status: PickerStatus;
  speedUnitsPerMinute: number;
  queueDepth: number;
}

export interface OrderLine {
  productId: string;
  quantity: number;
}

export interface CustomerOrder {
  id: string;
  zone: string;
  createdAt: string;
  promisedMinutes: number;
  status: OrderStatus;
  lines: OrderLine[];
  basketValue: number;
  assignedStoreId?: string;
  assignedPickerId?: string;
  assignedRiderId?: string;
  estimatedMinutes?: number;
  pickPathMeters?: number;
  pickTimeMinutes?: number;
  deliveryDistanceKm?: number;
  deliveryCost?: number;
  batchId?: string;
  margin?: number;
  rejectionReason?: string;
}

export interface Alert {
  id: string;
  title: string;
  detail: string;
  priority: Priority;
  sourceAgent: AgentName;
  createdAt: string;
}

export interface AgentRecommendation {
  agent: AgentName;
  subject: string;
  summary: string;
  score: number;
  rationale: string[];
  tradeoffs: string[];
  actions: string[];
}

export interface OrchestrationResolution {
  id: string;
  title: string;
  winningObjective: string;
  competingObjectives: string[];
  reason: string;
}

export interface MetricCard {
  label: string;
  value: string;
  delta: string;
}

export interface RestockSignal {
  id: string;
  storeId: string;
  productId: string;
  quantity: number;
  urgency: Priority;
  reason: string;
}

export interface PickingBatch {
  id: string;
  storeId: string;
  orderIds: string[];
  pickerId?: string;
  estimatedPickTimeMinutes: number;
  pathMeters: number;
}

export interface DispatchPlan {
  orderId: string;
  riderId?: string;
  routeStops: string[];
  etaMinutes: number;
  cost: number;
}

export interface ProfitDecision {
  orderId: string;
  projectedMargin: number;
  projectedCost: number;
  profitable: boolean;
  recommendation: "approve" | "batch" | "reroute" | "reject";
}

export interface OrchestratorAgentStatus {
  agent: AgentName;
  activeSubjects: number;
  lastSummary: string;
}

export interface OrchestratorState {
  mode: "coordinating";
  coordinationHealth: "stable" | "watch" | "degraded";
  activeConflicts: number;
  lastCycleAt: string;
  lastDecisionSummary: string;
  connectedAgents: OrchestratorAgentStatus[];
}

export interface SimulationEvent {
  id: string;
  type:
    | "simulation.tick"
    | "order.created"
    | "order.routed"
    | "order.picked"
    | "order.delivered"
    | "inventory.risk"
    | "inventory.restocked"
    | "batch.created"
    | "picker.assigned"
    | "dispatch.assigned"
    | "profit.reviewed"
    | "anomaly.detected"
    | "orchestrator.resolved";
  severity: EventSeverity;
  timestamp: string;
  agent: AgentName | "System";
  entityType: "order" | "store" | "inventory" | "rider" | "picker" | "system";
  entityId: string;
  message: string;
  payload: Record<string, unknown>;
}

export interface SimulationControl {
  mode: AutomationMode;
  scenario: SimulationScenario;
  tickIntervalMs: number;
  tickCount: number;
  lastTickAt: string;
}

export interface DashboardSnapshot {
  generatedAt: string;
  metrics: MetricCard[];
  products: Product[];
  stores: DarkStore[];
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
}
