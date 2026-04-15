import { products, riders as seedRiders, seedOrders, stores as seedStores } from "./data.js";
const clone = (value) => JSON.parse(JSON.stringify(value));
const state = {
    products: clone(products),
    stores: clone(seedStores),
    riders: clone(seedRiders),
    orders: clone(seedOrders),
    alerts: [],
    recommendations: [],
    resolutions: [],
    orderCounter: 204
};
const zoneDistance = {
    Central: 2.4,
    North: 3.2,
    East: 2.9
};
const productCatalog = () => new Map(state.products.map((product) => [product.id, product]));
const getCoverageHours = (store, productId) => {
    const record = store.inventory.find((item) => item.productId === productId);
    if (!record)
        return 0;
    return (record.currentStock + record.incomingStock) / Math.max(record.avgDailyDemand / 24, 0.1);
};
const demandAgent = () => state.stores.map((store) => {
    const atRisk = store.inventory
        .map((item) => ({ ...item, coverageHours: getCoverageHours(store, item.productId) }))
        .sort((a, b) => a.coverageHours - b.coverageHours)
        .slice(0, 2);
    return {
        agent: "Demand Agent",
        subject: store.name,
        summary: `Demand spike expected in ${store.zone}; replenish ${atRisk.map((item) => item.productId).join(" and ")} next.`,
        score: Math.max(0.55, 1 - atRisk[0].coverageHours / 20),
        rationale: atRisk.map((item) => `${item.productId} has only ${item.coverageHours.toFixed(1)} hours of projected coverage.`),
        tradeoffs: ["Higher buffer increases carrying cost.", "Preemptive replenishment protects fill rate."],
        actions: atRisk.map((item) => `Increase ${item.productId} buffer to ${item.targetStock} units.`)
    };
});
const inventoryAgent = () => {
    const recommendations = state.stores
        .map((store) => {
        const lowStock = store.inventory.filter((item) => item.currentStock + item.incomingStock <= item.reorderPoint + 4);
        if (!lowStock.length)
            return null;
        return {
            agent: "Inventory Agent",
            subject: store.name,
            summary: `${lowStock.length} SKUs are near stockout in ${store.zone}.`,
            score: 0.82,
            rationale: lowStock.map((item) => `${item.productId} is at ${item.currentStock} on-hand with reorder point ${item.reorderPoint}.`),
            tradeoffs: ["Emergency replenishment raises transfer cost.", "Avoiding stockouts preserves conversion."],
            actions: lowStock.map((item) => `Raise replenishment request for ${item.productId} to reach ${item.targetStock} units.`)
        };
    })
        .filter((item) => item !== null);
    return recommendations;
};
const evaluateStoreForOrder = (order, store) => {
    const orderLines = order.lines.map((line) => {
        const record = store.inventory.find((item) => item.productId === line.productId);
        return { ...line, available: record?.currentStock ?? 0 };
    });
    const fulfillmentRatio = orderLines.filter((line) => line.available >= line.quantity).length / orderLines.length;
    const eta = zoneDistance[order.zone] * (store.zone === order.zone ? 3.1 : 4.4) + store.pickingCongestion * 6;
    const cost = 1.8 + zoneDistance[order.zone] * 0.85 + store.utilization * 1.9;
    const score = fulfillmentRatio * 0.5 + (1 / Math.max(eta, 1)) * 3 + (1 / Math.max(cost, 1)) * 1.8;
    return { storeId: store.id, storeName: store.name, fulfillmentRatio, eta, cost, score };
};
const routingAgent = () => state.orders
    .filter((order) => order.status === "queued" || order.status === "routed")
    .map((order) => {
    const best = state.stores
        .map((store) => evaluateStoreForOrder(order, store))
        .sort((a, b) => b.score - a.score)[0];
    return {
        agent: "Routing Agent",
        subject: order.id,
        summary: `Route ${order.id} through ${best.storeName} with ETA ${best.eta.toFixed(1)} min.`,
        score: best.score / 2,
        rationale: [
            `${(best.fulfillmentRatio * 100).toFixed(0)}% of requested items are available.`,
            `Estimated delivery time is ${best.eta.toFixed(1)} minutes.`,
            `Expected fulfillment cost is ${best.cost.toFixed(2)} credits.`
        ],
        tradeoffs: ["Closest store is not always cheapest.", "Higher fill rate can justify a longer route."],
        actions: [`Assign ${order.id} to ${best.storeId}.`]
    };
});
const pickingAgent = () => state.orders
    .filter((order) => order.status === "routed" || order.status === "picking")
    .map((order) => {
    const pickUnits = order.lines.reduce((sum, line) => sum + line.quantity, 0);
    const pickPath = 28 + pickUnits * 12 + (order.assignedStoreId === "blr-east" ? 22 : 10);
    return {
        agent: "Picking Agent",
        subject: order.id,
        summary: `Wave-pick ${order.id} with an optimized ${pickPath}m route.`,
        score: 0.74,
        rationale: [
            `${pickUnits} units can be picked in a single aisle sweep.`,
            "Store congestion is absorbed by batching high-frequency SKUs first."
        ],
        tradeoffs: ["Wave picking reduces picker travel.", "Short batching delay can improve throughput."],
        actions: [`Set pick path for ${order.id} to ${pickPath} meters.`]
    };
});
const dispatchAgent = () => state.orders
    .filter((order) => order.status === "dispatching" || order.status === "out_for_delivery")
    .map((order) => {
    const winner = state.riders
        .filter((rider) => rider.status === "available" || rider.zone === order.zone)
        .map((rider) => ({
        rider,
        score: rider.speedScore * 0.5 + (rider.batteryLevel / 100) * 0.3 + (1 - rider.currentLoad / 3) * 0.2
    }))
        .sort((a, b) => b.score - a.score)[0];
    return {
        agent: "Dispatch Agent",
        subject: order.id,
        summary: `Assign ${winner.rider.name} to ${order.id} for fastest drop-off.`,
        score: winner.score,
        rationale: [
            `${winner.rider.name} is in ${winner.rider.zone} with ${winner.rider.batteryLevel}% battery.`,
            `Current load ${winner.rider.currentLoad} supports a fast departure window.`
        ],
        tradeoffs: ["Best rider may increase idle time in other zones.", "Battery-aware dispatch reduces failed runs."],
        actions: [`Dispatch rider ${winner.rider.id} for ${order.id}.`]
    };
});
const profitAgent = () => state.orders.map((order) => {
    const itemCost = order.basketValue * 0.62;
    const deliveryCost = 2.1 + zoneDistance[order.zone] * 0.8;
    const margin = order.basketValue - itemCost - deliveryCost;
    return {
        agent: "Profit Agent",
        subject: order.id,
        summary: margin > 0
            ? `${order.id} remains profitable with projected margin ${margin.toFixed(2)}.`
            : `${order.id} risks negative margin; batch or reroute before dispatch.`,
        score: Math.max(0.2, Math.min(0.95, margin / 8 + 0.5)),
        rationale: [
            `Basket value is ${order.basketValue.toFixed(2)}.`,
            `Projected delivery cost is ${deliveryCost.toFixed(2)}.`,
            `Projected contribution margin is ${margin.toFixed(2)}.`
        ],
        tradeoffs: ["Batching can protect margin.", "Aggressive speed targets can erode contribution."],
        actions: margin > 0
            ? [`Keep service promise for ${order.id}.`]
            : [`Batch ${order.id} with nearby drops or assign from lower-cost store.`]
    };
});
const monitoringAgent = () => {
    const alerts = [];
    const recommendations = [];
    for (const order of state.orders) {
        const ageMinutes = (Date.now() - new Date(order.createdAt).getTime()) / 60000;
        if (ageMinutes > order.promisedMinutes * 0.8 && order.status !== "delivered") {
            alerts.push({
                id: `alert-${order.id}`,
                title: `Delivery SLA at risk for ${order.id}`,
                detail: `Order age is ${ageMinutes.toFixed(1)} minutes against promise of ${order.promisedMinutes} minutes.`,
                priority: ageMinutes > order.promisedMinutes ? "critical" : "high",
                sourceAgent: "Monitoring Agent",
                createdAt: new Date().toISOString()
            });
        }
    }
    for (const store of state.stores) {
        if (store.pickingCongestion > 0.68) {
            recommendations.push({
                agent: "Monitoring Agent",
                subject: store.name,
                summary: `${store.name} is entering a congestion pocket.`,
                score: store.pickingCongestion,
                rationale: [`Picking congestion is at ${(store.pickingCongestion * 100).toFixed(0)}%.`],
                tradeoffs: ["Slowing intake can protect SLA.", "Holding new waves may defer revenue."],
                actions: ["Shift next wave to a lower-load store when feasible."]
            });
        }
    }
    return { recommendations, alerts };
};
const orchestrate = () => {
    const routing = routingAgent();
    const profit = profitAgent();
    const demand = demandAgent();
    const inventory = inventoryAgent();
    const picking = pickingAgent();
    const dispatch = dispatchAgent();
    const monitoring = monitoringAgent();
    state.recommendations = [
        ...demand,
        ...inventory,
        ...routing,
        ...picking,
        ...dispatch,
        ...profit,
        ...monitoring.recommendations
    ]
        .sort((a, b) => b.score - a.score)
        .slice(0, 18);
    state.resolutions = state.orders
        .map((order) => {
        const routeRec = routing.find((rec) => rec.subject === order.id);
        const profitRec = profit.find((rec) => rec.subject === order.id);
        if (!routeRec || !profitRec)
            return null;
        const actionParts = routeRec.actions[0].split(" ");
        const storeId = actionParts[actionParts.length - 1]?.replace(".", "");
        const eta = Number(routeRec.rationale[1].match(/([\d.]+)/)?.[1] ?? "12");
        const margin = Number(profitRec.rationale[2].match(/(-?[\d.]+)/)?.[1] ?? "0");
        order.assignedStoreId = storeId;
        order.estimatedMinutes = eta;
        order.margin = margin;
        if (order.status === "queued") {
            order.status = "routed";
        }
        else if (order.status === "routed") {
            order.status = "picking";
            order.pickPathMeters = 52 + order.lines.reduce((sum, line) => sum + line.quantity * 11, 0);
        }
        else if (order.status === "picking") {
            order.status = "dispatching";
        }
        else if (order.status === "dispatching") {
            const rider = state.riders
                .filter((candidate) => candidate.status === "available")
                .sort((a, b) => b.speedScore - a.speedScore)[0];
            if (rider) {
                rider.status = "delivering";
                rider.currentLoad = 1;
                order.assignedRiderId = rider.id;
                order.status = "out_for_delivery";
            }
        }
        else if (order.status === "out_for_delivery") {
            order.status = "delivered";
        }
        return {
            id: `res-${order.id}`,
            title: `Order ${order.id} objective arbitration`,
            winningObjective: margin > 0 && eta <= order.promisedMinutes
                ? "Balanced speed + profit"
                : margin <= 0
                    ? "Profit protection"
                    : "SLA protection",
            competingObjectives: ["Speed", "Cost", "Fill rate"],
            reason: `${routeRec.summary} Profit view: ${profitRec.summary}`
        };
    })
        .filter((item) => Boolean(item))
        .slice(0, 8);
    state.alerts = monitoring.alerts.slice(0, 8);
};
const decrementInventoryForOrder = (order, storeId) => {
    const store = state.stores.find((candidate) => candidate.id === storeId);
    if (!store)
        return;
    for (const line of order.lines) {
        const record = store.inventory.find((item) => item.productId === line.productId);
        if (record) {
            record.currentStock = Math.max(0, record.currentStock - line.quantity);
        }
    }
    store.utilization = Math.min(0.96, store.utilization + 0.03);
    store.pickingCongestion = Math.min(0.92, store.pickingCongestion + 0.04);
};
const createSyntheticOrder = () => {
    const zoneOptions = ["Central", "North", "East"];
    const zone = zoneOptions[state.orderCounter % zoneOptions.length];
    const catalog = productCatalog();
    const productIds = ["milk", "bread", "banana", "chips", "soda", "icecream", "detergent"];
    const lines = [0, 1 + (state.orderCounter % 2), 2]
        .map((offset) => productIds[(state.orderCounter + offset) % productIds.length])
        .filter((value, index, values) => values.indexOf(value) === index)
        .map((productId) => ({
        productId,
        quantity: 1 + ((state.orderCounter + productId.length) % 2)
    }));
    const basketValue = lines.reduce((sum, line) => sum + (catalog.get(line.productId)?.basePrice ?? 2) * line.quantity, 0);
    const order = {
        id: `ord-${state.orderCounter}`,
        zone,
        createdAt: new Date().toISOString(),
        promisedMinutes: 10 + (state.orderCounter % 6),
        status: "queued",
        lines,
        basketValue: Number(basketValue.toFixed(2))
    };
    state.orders = [order, ...state.orders].slice(0, 14);
    state.orderCounter += 1;
};
const metricCards = () => {
    const activeOrders = state.orders.filter((order) => order.status !== "delivered").length;
    const etaOrders = state.orders.filter((order) => order.estimatedMinutes !== undefined);
    const avgEta = etaOrders.reduce((sum, order) => sum + (order.estimatedMinutes ?? 0), 0) / Math.max(1, etaOrders.length);
    const totalMargin = state.orders.reduce((sum, order) => sum + (order.margin ?? 0), 0);
    const stockRisk = state.stores
        .flatMap((store) => store.inventory)
        .filter((item) => item.currentStock <= item.reorderPoint).length;
    return [
        { label: "Active Orders", value: `${activeOrders}`, delta: "+12% vs last wave" },
        { label: "Avg ETA", value: `${avgEta.toFixed(1)} min`, delta: "-1.4 min optimized" },
        { label: "Projected Margin", value: `${totalMargin.toFixed(2)} cr`, delta: "+8.2% after batching" },
        { label: "Stock Risks", value: `${stockRisk}`, delta: "Demand agent tracking" }
    ];
};
export const tickSimulation = () => {
    createSyntheticOrder();
    orchestrate();
    for (const order of state.orders) {
        if (order.assignedStoreId && order.status !== "queued" && order.status !== "delivered") {
            decrementInventoryForOrder(order, order.assignedStoreId);
        }
    }
};
export const getSnapshot = () => {
    if (!state.recommendations.length) {
        orchestrate();
    }
    return {
        generatedAt: new Date().toISOString(),
        metrics: metricCards(),
        products: state.products,
        stores: state.stores,
        riders: state.riders,
        orders: state.orders,
        alerts: state.alerts,
        recommendations: state.recommendations,
        resolutions: state.resolutions
    };
};
