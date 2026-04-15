export const products = [
    { id: "milk", name: "Fresh Milk", category: "Dairy", basePrice: 2.5, storageType: "cold" },
    { id: "bread", name: "Whole Wheat Bread", category: "Bakery", basePrice: 1.8, storageType: "ambient" },
    { id: "banana", name: "Bananas", category: "Produce", basePrice: 1.2, storageType: "ambient" },
    { id: "eggs", name: "Farm Eggs", category: "Dairy", basePrice: 3.1, storageType: "cold" },
    { id: "chips", name: "Potato Chips", category: "Snacks", basePrice: 2.2, storageType: "ambient" },
    { id: "soda", name: "Sparkling Soda", category: "Beverages", basePrice: 1.6, storageType: "ambient" },
    { id: "icecream", name: "Vanilla Ice Cream", category: "Frozen", basePrice: 4.2, storageType: "cold" },
    { id: "detergent", name: "Liquid Detergent", category: "Home", basePrice: 5.4, storageType: "ambient" }
];
export const stores = [
    {
        id: "blr-central",
        name: "Central Dark Store",
        zone: "Central",
        utilization: 0.78,
        pickingCongestion: 0.63,
        rentPerHour: 54,
        inventory: [
            { productId: "milk", currentStock: 22, reorderPoint: 18, targetStock: 60, incomingStock: 10, avgDailyDemand: 42 },
            { productId: "bread", currentStock: 34, reorderPoint: 16, targetStock: 70, incomingStock: 0, avgDailyDemand: 36 },
            { productId: "banana", currentStock: 19, reorderPoint: 14, targetStock: 55, incomingStock: 12, avgDailyDemand: 30 },
            { productId: "eggs", currentStock: 12, reorderPoint: 10, targetStock: 40, incomingStock: 10, avgDailyDemand: 25 },
            { productId: "chips", currentStock: 48, reorderPoint: 20, targetStock: 90, incomingStock: 0, avgDailyDemand: 18 },
            { productId: "soda", currentStock: 51, reorderPoint: 18, targetStock: 100, incomingStock: 0, avgDailyDemand: 28 },
            { productId: "icecream", currentStock: 9, reorderPoint: 12, targetStock: 35, incomingStock: 6, avgDailyDemand: 21 },
            { productId: "detergent", currentStock: 15, reorderPoint: 10, targetStock: 40, incomingStock: 0, avgDailyDemand: 12 }
        ]
    },
    {
        id: "blr-north",
        name: "North Dark Store",
        zone: "North",
        utilization: 0.66,
        pickingCongestion: 0.48,
        rentPerHour: 46,
        inventory: [
            { productId: "milk", currentStock: 18, reorderPoint: 15, targetStock: 52, incomingStock: 8, avgDailyDemand: 35 },
            { productId: "bread", currentStock: 22, reorderPoint: 12, targetStock: 58, incomingStock: 0, avgDailyDemand: 24 },
            { productId: "banana", currentStock: 17, reorderPoint: 12, targetStock: 50, incomingStock: 8, avgDailyDemand: 26 },
            { productId: "eggs", currentStock: 14, reorderPoint: 9, targetStock: 38, incomingStock: 0, avgDailyDemand: 18 },
            { productId: "chips", currentStock: 36, reorderPoint: 15, targetStock: 72, incomingStock: 0, avgDailyDemand: 16 },
            { productId: "soda", currentStock: 28, reorderPoint: 14, targetStock: 80, incomingStock: 0, avgDailyDemand: 22 },
            { productId: "icecream", currentStock: 13, reorderPoint: 10, targetStock: 30, incomingStock: 0, avgDailyDemand: 14 },
            { productId: "detergent", currentStock: 21, reorderPoint: 8, targetStock: 34, incomingStock: 0, avgDailyDemand: 9 }
        ]
    },
    {
        id: "blr-east",
        name: "East Dark Store",
        zone: "East",
        utilization: 0.82,
        pickingCongestion: 0.71,
        rentPerHour: 50,
        inventory: [
            { productId: "milk", currentStock: 11, reorderPoint: 14, targetStock: 48, incomingStock: 20, avgDailyDemand: 33 },
            { productId: "bread", currentStock: 16, reorderPoint: 10, targetStock: 44, incomingStock: 0, avgDailyDemand: 20 },
            { productId: "banana", currentStock: 9, reorderPoint: 12, targetStock: 45, incomingStock: 16, avgDailyDemand: 24 },
            { productId: "eggs", currentStock: 8, reorderPoint: 8, targetStock: 32, incomingStock: 12, avgDailyDemand: 17 },
            { productId: "chips", currentStock: 27, reorderPoint: 12, targetStock: 65, incomingStock: 0, avgDailyDemand: 12 },
            { productId: "soda", currentStock: 30, reorderPoint: 14, targetStock: 78, incomingStock: 0, avgDailyDemand: 20 },
            { productId: "icecream", currentStock: 6, reorderPoint: 9, targetStock: 26, incomingStock: 8, avgDailyDemand: 12 },
            { productId: "detergent", currentStock: 18, reorderPoint: 9, targetStock: 32, incomingStock: 0, avgDailyDemand: 8 }
        ]
    }
];
export const riders = [
    { id: "r1", name: "Aarav", zone: "Central", status: "available", batteryLevel: 88, currentLoad: 0, speedScore: 0.91 },
    { id: "r2", name: "Diya", zone: "North", status: "available", batteryLevel: 72, currentLoad: 0, speedScore: 0.84 },
    { id: "r3", name: "Kabir", zone: "East", status: "delivering", batteryLevel: 61, currentLoad: 2, speedScore: 0.8 },
    { id: "r4", name: "Ira", zone: "Central", status: "available", batteryLevel: 95, currentLoad: 0, speedScore: 0.89 },
    { id: "r5", name: "Rohan", zone: "East", status: "available", batteryLevel: 67, currentLoad: 0, speedScore: 0.82 }
];
export const seedOrders = [
    {
        id: "ord-201",
        zone: "Central",
        createdAt: new Date(Date.now() - 7 * 60000).toISOString(),
        promisedMinutes: 12,
        status: "queued",
        lines: [
            { productId: "milk", quantity: 2 },
            { productId: "bread", quantity: 1 }
        ],
        basketValue: 6.8
    },
    {
        id: "ord-202",
        zone: "East",
        createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
        promisedMinutes: 15,
        status: "routed",
        lines: [
            { productId: "banana", quantity: 4 },
            { productId: "eggs", quantity: 1 },
            { productId: "chips", quantity: 2 }
        ],
        basketValue: 12.3
    },
    {
        id: "ord-203",
        zone: "North",
        createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
        promisedMinutes: 10,
        status: "dispatching",
        lines: [
            { productId: "icecream", quantity: 1 },
            { productId: "soda", quantity: 2 }
        ],
        basketValue: 7.4
    }
];
