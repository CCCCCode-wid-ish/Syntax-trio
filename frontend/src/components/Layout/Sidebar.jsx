export default function Sidebar({ currentPage, items, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-mark">DS</span>
        <div>
          <strong>DarkStore OS</strong>
          <p>Micro-fulfillment cockpit</p>
        </div>
      </div>

      <div className="sidebar-section-label">Navigation</div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            className={`sidebar-link ${currentPage === item.key ? "active" : ""}`}
            key={item.key}
            onClick={() => onNavigate(item.key)}
            type="button"
          >
            <span>{item.label}</span>
            <small>{item.meta}</small>
          </button>
        ))}
      </nav>

      <div className="sidebar-footnote">
        <span className="sidebar-footnote-dot" />
        Demo mode active
      </div>
    </aside>
  );
}
