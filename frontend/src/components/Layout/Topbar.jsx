export default function Topbar({ currentPageLabel, onLogout, userPhone }) {
  return (
    <header className="topbar">
      <div className="topbar-title-group">
        <p className="topbar-label">Realtime Operations</p>
        <strong>{currentPageLabel}</strong>
      </div>

      <div className="topbar-actions">
        <div className="topbar-status">
          <span className="banner-dot" />
          <span>Agent stream connected</span>
        </div>
        <div className="topbar-user">
          <div className="topbar-avatar">DS</div>
          <span>{userPhone}</span>
          <button className="ghost-button" onClick={onLogout} type="button">
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
