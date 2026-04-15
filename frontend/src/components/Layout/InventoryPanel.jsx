export default function InventoryPanel({ inventory }) {
  const lowStockCount = inventory.filter((item) => item.stock <= item.reorderPoint).length;

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">Inventory Panel</p>
          <h2>Live warehouse stock</h2>
        </div>
        <span className="panel-chip warning">{lowStockCount} alerts</span>
      </div>

      <div className="inventory-list">
        {inventory.map((item) => {
          const fill = (item.stock / item.capacity) * 100;
          const isLow = item.stock <= item.reorderPoint;

          return (
            <div className="inventory-item" key={item.id}>
              <div className="inventory-copy">
                <strong>{item.name}</strong>
                <p>
                  {item.stock} / {item.capacity} units
                </p>
              </div>
              <div className="inventory-meter">
                <div className="inventory-track">
                  <div
                    className={`inventory-fill ${isLow ? "danger" : "safe"}`}
                    style={{ width: `${fill}%` }}
                  />
                </div>
                <span className={`status-pill ${isLow ? "danger" : "success"}`}>
                  {isLow ? "Reorder" : "Healthy"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
