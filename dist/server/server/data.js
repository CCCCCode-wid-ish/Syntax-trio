export const products = [
    { id: "milk", name: "Fresh Milk", category: "Dairy", basePrice: 2.5, marginRate: 0.28, storageType: "cold", popularity: 0.94 },
    { id: "bread", name: "Whole Wheat Bread", category: "Bakery", basePrice: 1.8, marginRate: 0.35, storageType: "ambient", popularity: 0.81 },
    { id: "banana", name: "Bananas", category: "Produce", basePrice: 1.2, marginRate: 0.22, storageType: "ambient", popularity: 0.87 },
    { id: "eggs", name: "Farm Eggs", category: "Dairy", basePrice: 3.1, marginRate: 0.31, storageType: "cold", popularity: 0.76 },
    { id: "chips", name: "Potato Chips", category: "Snacks", basePrice: 2.2, marginRate: 0.46, storageType: "ambient", popularity: 0.68 },
    { id: "soda", name: "Sparkling Soda", category: "Beverages", basePrice: 1.6, marginRate: 0.4, storageType: "ambient", popularity: 0.72 },
    { id: "icecream", name: "Vanilla Ice Cream", category: "Frozen", basePrice: 4.2, marginRate: 0.38, storageType: "frozen", popularity: 0.63 },
    { id: "detergent", name: "Liquid Detergent", category: "Home", basePrice: 5.4, marginRate: 0.42, storageType: "ambient", popularity: 0.41 }
];
export const stores = [
    {
        id: "blr-central",
        name: "Central Dark Store",
        zone: "Central",
        utilization: 0.78,
        pickingCongestion: 0.63,
        packLoad: 0.46,
        dispatchLoad: 0.52,
        rentPerHour: 54,
        inventory: [
            { productId: "milk", currentStock: 22, reservedStock: 4, reorderPoint: 18, targetStock: 60, incomingStock: 10, avgDailyDemand: 42, leadTimeMinutes: 45 },
            { productId: "bread", currentStock: 34, reservedStock: 6, reorderPoint: 16, targetStock: 70, incomingStock: 0, avgDailyDemand: 36, leadTimeMinutes: 35 },
            { productId: "banana", currentStock: 19, reservedStock: 3, reorderPoint: 14, targetStock: 55, incomingStock: 12, avgDailyDemand: 30, leadTimeMinutes: 30 },
            { productId: "eggs", currentStock: 12, reservedStock: 2, reorderPoint: 10, targetStock: 40, incomingStock: 10, avgDailyDemand: 25, leadTimeMinutes: 50 },
            { productId: "chips", currentStock: 48, reservedStock: 3, reorderPoint: 20, targetStock: 90, incomingStock: 0, avgDailyDemand: 18, leadTimeMinutes: 25 },
            { productId: "soda", currentStock: 51, reservedStock: 5, reorderPoint: 18, targetStock: 100, incomingStock: 0, avgDailyDemand: 28, leadTimeMinutes: 30 },
            { productId: "icecream", currentStock: 9, reservedStock: 2, reorderPoint: 12, targetStock: 35, incomingStock: 6, avgDailyDemand: 21, leadTimeMinutes: 60 },
            { productId: "detergent", currentStock: 15, reservedStock: 1, reorderPoint: 10, targetStock: 40, incomingStock: 0, avgDailyDemand: 12, leadTimeMinutes: 90 }
        ]
    },
    {
        id: "blr-north",
        name: "North Dark Store",
        zone: "North",
        utilization: 0.66,
        pickingCongestion: 0.48,
        packLoad: 0.39,
        dispatchLoad: 0.43,
        rentPerHour: 46,
        inventory: [
            { productId: "milk", currentStock: 18, reservedStock: 3, reorderPoint: 15, targetStock: 52, incomingStock: 8, avgDailyDemand: 35, leadTimeMinutes: 50 },
            { productId: "bread", currentStock: 22, reservedStock: 4, reorderPoint: 12, targetStock: 58, incomingStock: 0, avgDailyDemand: 24, leadTimeMinutes: 35 },
            { productId: "banana", currentStock: 17, reservedStock: 3, reorderPoint: 12, targetStock: 50, incomingStock: 8, avgDailyDemand: 26, leadTimeMinutes: 30 },
            { productId: "eggs", currentStock: 14, reservedStock: 2, reorderPoint: 9, targetStock: 38, incomingStock: 0, avgDailyDemand: 18, leadTimeMinutes: 45 },
            { productId: "chips", currentStock: 36, reservedStock: 2, reorderPoint: 15, targetStock: 72, incomingStock: 0, avgDailyDemand: 16, leadTimeMinutes: 20 },
            { productId: "soda", currentStock: 28, reservedStock: 2, reorderPoint: 14, targetStock: 80, incomingStock: 0, avgDailyDemand: 22, leadTimeMinutes: 30 },
            { productId: "icecream", currentStock: 13, reservedStock: 1, reorderPoint: 10, targetStock: 30, incomingStock: 0, avgDailyDemand: 14, leadTimeMinutes: 55 },
            { productId: "detergent", currentStock: 21, reservedStock: 1, reorderPoint: 8, targetStock: 34, incomingStock: 0, avgDailyDemand: 9, leadTimeMinutes: 75 }
        ]
    },
    {
        id: "blr-east",
        name: "East Dark Store",
        zone: "East",
        utilization: 0.82,
        pickingCongestion: 0.71,
        packLoad: 0.54,
        dispatchLoad: 0.61,
        rentPerHour: 50,
        inventory: [
            { productId: "milk", currentStock: 11, reservedStock: 4, reorderPoint: 14, targetStock: 48, incomingStock: 20, avgDailyDemand: 33, leadTimeMinutes: 45 },
            { productId: "bread", currentStock: 16, reservedStock: 3, reorderPoint: 10, targetStock: 44, incomingStock: 0, avgDailyDemand: 20, leadTimeMinutes: 35 },
            { productId: "banana", currentStock: 9, reservedStock: 2, reorderPoint: 12, targetStock: 45, incomingStock: 16, avgDailyDemand: 24, leadTimeMinutes: 30 },
            { productId: "eggs", currentStock: 8, reservedStock: 2, reorderPoint: 8, targetStock: 32, incomingStock: 12, avgDailyDemand: 17, leadTimeMinutes: 45 },
            { productId: "chips", currentStock: 27, reservedStock: 1, reorderPoint: 12, targetStock: 65, incomingStock: 0, avgDailyDemand: 12, leadTimeMinutes: 20 },
            { productId: "soda", currentStock: 30, reservedStock: 2, reorderPoint: 14, targetStock: 78, incomingStock: 0, avgDailyDemand: 20, leadTimeMinutes: 25 },
            { productId: "icecream", currentStock: 6, reservedStock: 1, reorderPoint: 9, targetStock: 26, incomingStock: 8, avgDailyDemand: 12, leadTimeMinutes: 60 },
            { productId: "detergent", currentStock: 18, reservedStock: 1, reorderPoint: 9, targetStock: 32, incomingStock: 0, avgDailyDemand: 8, leadTimeMinutes: 80 }
        ]
    }
];
export const riders = [
    { id: "r1", name: "Aarav", zone: "Central", status: "available", batteryLevel: 88, currentLoad: 0, speedScore: 0.91, costPerKm: 0.36 },
    { id: "r2", name: "Diya", zone: "North", status: "available", batteryLevel: 72, currentLoad: 0, speedScore: 0.84, costPerKm: 0.32 },
    { id: "r3", name: "Kabir", zone: "East", status: "delivering", batteryLevel: 61, currentLoad: 2, speedScore: 0.8, costPerKm: 0.35 },
    { id: "r4", name: "Ira", zone: "Central", status: "available", batteryLevel: 95, currentLoad: 0, speedScore: 0.89, costPerKm: 0.38 },
    { id: "r5", name: "Rohan", zone: "East", status: "available", batteryLevel: 67, currentLoad: 0, speedScore: 0.82, costPerKm: 0.33 }
];
export const pickers = [
    { id: "p1", name: "Meera", storeId: "blr-central", status: "available", speedUnitsPerMinute: 2.7, queueDepth: 0 },
    { id: "p2", name: "Nikhil", storeId: "blr-central", status: "picking", speedUnitsPerMinute: 2.2, queueDepth: 1 },
    { id: "p3", name: "Sana", storeId: "blr-north", status: "available", speedUnitsPerMinute: 2.5, queueDepth: 0 },
    { id: "p4", name: "Yash", storeId: "blr-east", status: "available", speedUnitsPerMinute: 2.1, queueDepth: 0 },
    { id: "p5", name: "Ishita", storeId: "blr-east", status: "picking", speedUnitsPerMinute: 2.4, queueDepth: 1 }
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
