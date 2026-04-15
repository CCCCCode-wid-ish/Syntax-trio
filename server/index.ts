import { createServer } from "node:http";
import fs from "node:fs";
import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import {
  getSnapshot,
  pauseSimulation,
  setSimulationSpeed,
  setSimulationScenario,
  startSimulation,
  subscribeToSimulationEvents,
  tickSimulation
} from "./simulation.js";
import { attachWebSocketGateway } from "./realtime/websocket-gateway.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const server = createServer(app);

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "AutoFulfill AI API", timestamp: new Date().toISOString() });
});

app.get("/api/dashboard", (_req, res) => {
  res.json(getSnapshot());
});

app.get("/api/orchestrator", (_req, res) => {
  res.json(getSnapshot().orchestrator);
});

app.post("/api/simulate/tick", (_req, res) => {
  tickSimulation();
  res.json(getSnapshot());
});

app.post("/api/simulate/start", (_req, res) => {
  startSimulation();
  res.json(getSnapshot());
});

app.post("/api/simulate/pause", (_req, res) => {
  pauseSimulation();
  res.json(getSnapshot());
});

app.post("/api/simulate/config", (req, res) => {
  const tickIntervalMs = Number(req.body?.tickIntervalMs ?? 6000);
  const scenario = req.body?.scenario;
  setSimulationSpeed(tickIntervalMs);
  if (scenario) {
    setSimulationScenario(scenario);
  }
  res.json(getSnapshot());
});

app.post("/api/simulate/scenario", (req, res) => {
  const scenario = req.body?.scenario;
  if (!scenario) {
    return res.status(400).json({ error: "scenario is required" });
  }
  setSimulationScenario(scenario);
  res.json(getSnapshot());
});

app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  res.write(`data: ${JSON.stringify({ type: "snapshot", payload: getSnapshot() })}\n\n`);

  const unsubscribe = subscribeToSimulationEvents((event) => {
    res.write(`data: ${JSON.stringify({ type: "event", payload: event })}\n\n`);
  });

  req.on("close", () => {
    unsubscribe();
    res.end();
  });
});

const clientDir = path.resolve(process.cwd(), "dist/client");
if (fs.existsSync(clientDir)) {
  app.use(express.static(clientDir));
  app.get("/*", (_req, res) => {
    res.sendFile(path.join(clientDir, "index.html"));
  });
}

attachWebSocketGateway({
  server,
  getSnapshot,
  subscribeToSimulationEvents
});

startSimulation();

server.listen(port, () => {
  console.log(`AutoFulfill AI server listening on http://localhost:${port}`);
});
