export default function Topbar() {
  return (
    <div style={{
      height: "48px",
      background: "#0A0A0F",
      borderBottom: "1px solid #1E1E2E",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 16px"
    }}>
      <div style={{
        color: "#F59E0B",
        fontFamily: "monospace"
      }}>
        DarkStore OS
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        color: "white"
      }}>
        <div style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "#10B981"
        }} />
        AGENT LIVE
      </div>
    </div>
  );
}