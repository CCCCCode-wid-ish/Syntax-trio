export type Priority = "low" | "medium" | "high" | "critical";
export type OrderStatus =
  | "queued"
  | "routed"
  | "picking"
  | "dispatching"
  | "out_for_delivery"
  | "delivered";

export interface Product {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  storageType: "ambient" | "cold";
}

export interface InventoryRecord {
  productId: string;
  currentStock: number;
  reorderPoint: number;
  targetStock: number;
  incomingStock: number;
  avgDailyDemand: number;
}

export interface DarkStore {
  id: string;
  name: string;
  zone: string;
  utilization: number;
  pickingCongestion: number;
  rentPerHour: number;
  inventory: InventoryRecord[];
}

export interface Rider {
  id: string;
  name: string;
  zone: string;
  status: "available" | "delivering" | "break";
  batteryLevel: number;
  currentLoad: number;
  speedScore: number;
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
  assignedRiderId?: string;
  estimatedMinutes?: number;
  pickPathMeters?: number;
  margin?: number;
}

export type AgentName =
  | "Demand Agent"
  | "Inventory Agent"
  | "Routing Agent"
  | "Picking Agent"
  | "Dispatch Agent"
  | "Profit Agent"
  | "Monitoring Agent"
  | "Orchestrator";

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

export interface DashboardSnapshot {
  generatedAt: string;
  metrics: MetricCard[];
  products: Product[];
  stores: DarkStore[];
  riders: Rider[];
  orders: CustomerOrder[];
  alerts: Alert[];
  recommendations: AgentRecommendation[];
  resolutions: OrchestrationResolution[];
}
