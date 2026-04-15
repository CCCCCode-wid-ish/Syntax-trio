import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { getSnapshot, tickSimulation } from "./simulation.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "AutoFulfill AI API", timestamp: new Date().toISOString() });
});

app.get("/api/dashboard", (_req, res) => {
  res.json(getSnapshot());
});

app.post("/api/simulate/tick", (_req, res) => {
  tickSimulation();
  res.json(getSnapshot());
});

const clientDir = path.resolve(__dirname, "../client");
app.use(express.static(clientDir));
app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(clientDir, "index.html"));
});

app.listen(port, () => {
  console.log(`AutoFulfill AI server listening on http://localhost:${port}`);
});
