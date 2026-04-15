import { useEffect, useState } from "react";

const initialInventory = [
  { name: "Amul Milk", stock: 2 },
  { name: "Coca Cola", stock: 0 },
  { name: "Bread", stock: 8 },
  { name: "Eggs", stock: 5 },
  { name: "Paneer", stock: 1 },
];

export default function InventoryPanel() {
  const [inventory, setInventory] = useState(initialInventory);

  useEffect(() => {
    const interval = setInterval(() => {
      setInventory(prev =>
        prev.map(item => ({
          ...item,
          stock: Math.max(0, item.stock + (Math.random() > 0.5 ? -1 : 1))
        }))
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        background: "#111118",
        border: "1px solid #1E1E2E",
        borderRadius: "8px",
        padding: "16px",
        marginTop: "16px"
      }}
    >
      <h3 style={{ marginBottom: "12px" }}>Inventory</h3>

      {inventory.map((item, i) => {
        const isLow = item.stock <= 2;

        return (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 0",
              color: isLow ? "#EF4444" : "#ccc"
            }}
          >
            <span>{item.name}</span>
            <span style={{ fontFamily: "monospace" }}>
              {item.stock}
            </span>
          </div>
        );
      })}
    </div>
  );
}