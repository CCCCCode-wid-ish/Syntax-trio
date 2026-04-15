import { useState, useEffect } from "react";

export default function AgentLog() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const messages = [
        "🧠 Agent received Order",
        "🔍 Checking inventory",
        "⚠️ Out of stock",
        "🔄 Substitution made",
        "🤖 Robot dispatched",
        "🚨 SLA risk",
        "✅ Order completed"
      ];

      const newLog = {
        id: Date.now(),
        text: messages[Math.floor(Math.random() * messages.length)],
        time: new Date().toLocaleTimeString()
      };

      setLogs(prev => [newLog, ...prev].slice(0, 10));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      width: "300px",
      background: "#111118",
      border: "1px solid #1E1E2E",
      borderRadius: "8px",
      padding: "12px",
      height: "400px"
    }}>
      <div style={{ color: "#F59E0B", marginBottom: "10px" }}>
        AGENT LOG
      </div>

      {logs.map(log => (
        <div key={log.id}>
          [{log.time}] {log.text}
        </div>
      ))}
    </div>
  );
}