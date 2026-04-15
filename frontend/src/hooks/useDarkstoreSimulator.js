import { useEffect, useMemo, useState } from "react";

const INITIAL_INVENTORY = [
  { id: "milk", name: "Amul Milk", stock: 22, capacity: 40, reorderPoint: 10 },
  { id: "cola", name: "Coca Cola", stock: 14, capacity: 24, reorderPoint: 8 },
  { id: "bread", name: "Bread", stock: 16, capacity: 30, reorderPoint: 10 },
  { id: "eggs", name: "Eggs", stock: 28, capacity: 36, reorderPoint: 12 },
  { id: "paneer", name: "Paneer", stock: 9, capacity: 18, reorderPoint: 6 },
];

const INITIAL_RIDERS = [
  { id: "R-12", name: "Anaya", status: "Delivering", zone: "North Hub", eta: 12, x: 18, y: 24 },
  { id: "R-18", name: "Kabir", status: "Returning", zone: "East Loop", eta: 7, x: 70, y: 22 },
  { id: "R-07", name: "Meera", status: "Idle", zone: "Store", eta: 0, x: 45, y: 64 },
  { id: "R-21", name: "Ishan", status: "Delivering", zone: "South Grid", eta: 18, x: 78, y: 76 },
];

const ORDER_NAMES = ["Milk", "Bread", "Eggs", "Paneer", "Cold Drinks", "Snacks"];
const ORDER_STATUS_FLOW = ["Queued", "Picking", "Packed", "Out for delivery", "Delivered"];
const LOG_MESSAGES = [
  "Order received and prioritized",
  "Picking route optimized",
  "Inventory threshold reached",
  "Rider assigned to a hot zone",
  "Delay detected on south corridor",
  "Admin sync completed",
  "Order delivered within SLA",
];

function makeInitialOrders() {
  return [
    { id: "ORD-301", customer: "Aarav", items: 4, amount: 358, status: "Picking", eta: 14, risk: "Normal" },
    { id: "ORD-302", customer: "Sana", items: 2, amount: 190, status: "Packed", eta: 8, risk: "Normal" },
    { id: "ORD-303", customer: "Vihaan", items: 6, amount: 522, status: "Out for delivery", eta: 17, risk: "High" },
    { id: "ORD-304", customer: "Diya", items: 3, amount: 244, status: "Queued", eta: 21, risk: "Normal" },
  ];
}

function createOrders(count, existingCount = 0) {
  return Array.from({ length: count }, (_, index) => ({
    id: `ORD-${400 + existingCount + index}`,
    customer: ORDER_NAMES[(existingCount + index) % ORDER_NAMES.length],
    items: 1 + ((existingCount + index) % 6),
    amount: 140 + ((existingCount + index) % 5) * 65,
    status: index === 0 ? "Packed" : "Queued",
    eta: 12 + ((existingCount + index) % 9),
    risk: "Normal",
  }));
}

function createLogEntry(text) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    text,
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function syncRidersWithOrders(riders, orders) {
  const activeOrderCount = orders.filter((order) => order.status !== "Delivered").length;
  const deliveryDemand = orders.filter((order) =>
    ["Packed", "Out for delivery"].includes(order.status)
  ).length;

  if (activeOrderCount === 0) {
    return riders.map((rider) => ({
      ...rider,
      status: "Idle",
      zone: "Store",
      eta: 0,
    }));
  }

  return riders.map((rider, index) => {
    const shouldBeBusy = index < Math.min(deliveryDemand || 1, activeOrderCount, riders.length);

    if (!shouldBeBusy) {
      return {
        ...rider,
        status: "Idle",
        zone: "Store",
        eta: 0,
      };
    }

    return rider;
  });
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function useDarkstoreSimulator() {
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [orders, setOrders] = useState(makeInitialOrders);
  const [riders, setRiders] = useState(INITIAL_RIDERS);
  const [logs, setLogs] = useState(() => [
    createLogEntry("Simulator started for dark store operations"),
    createLogEntry("All systems are running in real-time frontend mode"),
  ]);
  const [metrics, setMetrics] = useState({
    revenue: 43120,
    cost: 27950,
    delivered: 124,
    avgOrderValue: 348,
    fillRate: 96,
  });
  const [settings, setSettings] = useState({
    autoRestock: true,
    simulationPaused: false,
    delayMode: false,
    backendMode: "Realtime Simulation",
    storeOpen: true,
  });

  useEffect(() => {
    if (settings.simulationPaused) {
      return undefined;
    }

    const intervalMs = settings.delayMode ? 3400 : 1800;
    const interval = setInterval(() => {
      setOrders((prevOrders) => {
        let nextOrders = prevOrders.map((order, index) => {
          const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status);
          const shouldAdvance = Math.random() > 0.35;
          const nextStatus =
            shouldAdvance && currentIndex < ORDER_STATUS_FLOW.length - 1
              ? ORDER_STATUS_FLOW[currentIndex + 1]
              : order.status;
          const nextEta = nextStatus === "Delivered" ? 0 : clamp(order.eta - 1, 4, 30);

          return {
            ...order,
            status: nextStatus,
            eta: nextEta,
            risk: nextEta > 16 && nextStatus !== "Delivered" ? "High" : "Normal",
            amount: index === 0 && Math.random() > 0.7 ? order.amount + 22 : order.amount,
          };
        });

        const remainingActiveOrders = nextOrders.filter((order) => order.status !== "Delivered");
        const shouldInjectOrders =
          settings.storeOpen &&
          (
            remainingActiveOrders.length === 0 ||
            (remainingActiveOrders.length < 2 && Math.random() > 0.55)
          );

        if (shouldInjectOrders) {
          const replenishmentCount = remainingActiveOrders.length === 0 ? 3 : 2;
          const replenishmentOrders = createOrders(replenishmentCount, nextOrders.length);
          nextOrders = [...replenishmentOrders, ...nextOrders]
            .filter((order, index, allOrders) => {
              if (order.status !== "Delivered") {
                return true;
              }

              const deliveredCount = allOrders.filter((item) => item.status === "Delivered").length;
              return index >= allOrders.length - Math.min(deliveredCount, 3);
            })
            .slice(0, 8);

          setLogs((prevLogs) => [
            createLogEntry(
              remainingActiveOrders.length === 0
                ? "Fresh wave of orders entered the system"
                : "New orders added to keep the queue healthy"
            ),
            ...prevLogs,
          ].slice(0, 12));
        }

        setRiders((prevRiders) =>
          syncRidersWithOrders(
            prevRiders.map((rider, index) => {
              const status =
                rider.status === "Idle"
                  ? "Delivering"
                  : rider.status === "Delivering" && Math.random() > 0.6
                    ? "Returning"
                    : rider.status === "Returning" && Math.random() > 0.5
                      ? "Idle"
                      : rider.status;

              return {
                ...rider,
                status,
                eta: status === "Idle" ? 0 : clamp(rider.eta + (status === "Delivering" ? -1 : -2), 0, 20),
                x: clamp(rider.x + (index % 2 === 0 ? 4 : -3), 6, 92),
                y: clamp(rider.y + (index < 2 ? 3 : -4), 8, 88),
              };
            }),
            nextOrders
          )
        );

        return nextOrders;
      });

      setInventory((prev) =>
        prev.map((item) => {
          const delta = Math.random() > 0.55 ? -2 : -1;
          const replenishment = settings.autoRestock && item.stock <= item.reorderPoint ? 8 : 0;
          return {
            ...item,
            stock: clamp(item.stock + delta + replenishment, 0, item.capacity),
          };
        })
      );

      setMetrics((prev) => {
        const deliveredDelta = Math.random() > 0.45 ? 2 : 1;
        const revenueDelta = settings.delayMode ? 180 : 260;
        const costDelta = settings.delayMode ? 150 : 118;
        const fillRateDelta = settings.autoRestock ? 0.1 : -0.2;

        return {
          revenue: prev.revenue + revenueDelta,
          cost: prev.cost + costDelta,
          delivered: prev.delivered + deliveredDelta,
          avgOrderValue: clamp(prev.avgOrderValue + (Math.random() > 0.5 ? 3 : -2), 320, 390),
          fillRate: clamp(Number((prev.fillRate + fillRateDelta).toFixed(1)), 89, 99.5),
        };
      });

      setLogs((prev) => [
        createLogEntry(LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)]),
        ...prev,
      ].slice(0, 12));
    }, intervalMs);

    return () => clearInterval(interval);
  }, [settings.autoRestock, settings.delayMode, settings.simulationPaused]);

  const derived = useMemo(() => {
    const profit = metrics.revenue - metrics.cost;
    const activeOrders = orders.filter((order) => order.status !== "Delivered");
    const highRiskOrders = orders.filter((order) => order.risk === "High").length;
    const busyRiders = riders.filter((rider) => rider.status !== "Idle").length;
    const lowStockCount = inventory.filter((item) => item.stock <= item.reorderPoint).length;

    return {
      profit,
      activeOrders,
      highRiskOrders,
      busyRiders,
      lowStockCount,
      chartSeries: [
        { label: "Revenue", value: metrics.revenue, tone: "cyan" },
        { label: "Cost", value: metrics.cost, tone: "orange" },
        { label: "Profit", value: profit, tone: "green" },
        { label: "Margin", value: Math.round(profit * 0.12), tone: "violet" },
        { label: "Fill Gap", value: Math.round((metrics.fillRate - 90) * 8), tone: "red" },
      ],
    };
  }, [inventory, metrics, orders, riders]);

  function addOrders(count) {
    setOrders((prev) => {
      const nextOrders = createOrders(count, prev.length);

      const mergedOrders = [...nextOrders, ...prev].slice(0, 8);
      setRiders((prevRiders) => syncRidersWithOrders(prevRiders, mergedOrders));
      return mergedOrders;
    });

    setLogs((prev) => [createLogEntry(`${count} new orders injected into the simulator`), ...prev].slice(0, 12));
  }

  function resetSimulation() {
    setInventory(INITIAL_INVENTORY);
    setOrders(makeInitialOrders());
    setRiders(INITIAL_RIDERS);
    setMetrics({
      revenue: 43120,
      cost: 27950,
      delivered: 124,
      avgOrderValue: 348,
      fillRate: 96,
    });
    setSettings((prev) => ({
      ...prev,
      delayMode: false,
      simulationPaused: false,
      backendMode: "Realtime Simulation",
      storeOpen: true,
    }));
    setLogs([
      createLogEntry("Simulation reset to baseline"),
      createLogEntry("Operational counters restored"),
    ]);
  }

  function toggleDelayMode() {
    setSettings((prev) => ({ ...prev, delayMode: !prev.delayMode }));
    setLogs((prev) => [
      createLogEntry(settings.delayMode ? "Delay mode cleared" : "Delay mode enabled across delivery lanes"),
      ...prev,
    ].slice(0, 12));
  }

  function togglePause() {
    setSettings((prev) => ({ ...prev, simulationPaused: !prev.simulationPaused }));
  }

  function toggleAutoRestock() {
    setSettings((prev) => ({ ...prev, autoRestock: !prev.autoRestock }));
  }

  function manualSync() {
    setSettings((prev) => ({ ...prev, backendMode: "Manual Sync Triggered" }));
    setLogs((prev) => [createLogEntry("Manual backend sync triggered by admin"), ...prev].slice(0, 12));
  }

  function emergencyDispatch() {
    setRiders((prev) =>
      syncRidersWithOrders(
        prev.map((rider, index) =>
          index === 2 ? { ...rider, status: "Delivering", zone: "Priority Corridor", eta: 9 } : rider
        ),
        orders
      )
    );
    setLogs((prev) => [createLogEntry("Emergency rider dispatch activated"), ...prev].slice(0, 12));
  }

  function toggleStoreOpen() {
    setSettings((prev) => ({ ...prev, storeOpen: !prev.storeOpen }));
  }

  return {
    inventory,
    logs,
    metrics,
    orders,
    riders,
    settings,
    ...derived,
    addOrders,
    emergencyDispatch,
    manualSync,
    resetSimulation,
    toggleAutoRestock,
    toggleDelayMode,
    togglePause,
    toggleStoreOpen,
  };
}
