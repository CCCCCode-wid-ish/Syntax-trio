export default function AgentLog({ logs }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">Agent Log</p>
          <h2>Operational event stream</h2>
        </div>
        <span className="panel-chip success">Live feed</span>
      </div>

      <div className="log-list">
        {logs.map((log) => (
          <div className="log-row" key={log.id}>
            <span>{log.time}</span>
            <p>{log.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
