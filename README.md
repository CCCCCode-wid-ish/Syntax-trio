# AutoFulfill AI

AutoFulfill AI is a simulation-driven, event-driven backend system for quick-commerce dark stores. It models continuous order inflow, inventory pressure, dark-store routing, picker assignment, rider dispatch, profitability control, and anomaly detection through a multi-agent orchestration layer.

## Backend features

- Real-time simulation engine with continuous synthetic order generation
- Independent AI agents for demand forecasting, inventory, routing, picking, dispatch, profitability, and anomaly detection
- Central orchestrator that resolves conflicts between speed, cost, and inventory health
- Event log and Server-Sent Events stream for live backend activity
- Operational state for dark stores, inventory, pickers, riders, orders, restock signals, batches, and dispatch plans

## API

- `GET /api/health`: service health
- `GET /api/dashboard`: full backend snapshot
- `POST /api/simulate/tick`: run one simulation cycle
- `POST /api/simulate/start`: start auto-running simulation
- `POST /api/simulate/pause`: pause auto-running simulation
- `POST /api/simulate/config`: update `tickIntervalMs`
- `GET /api/events`: live SSE stream of backend events

## Run

```bash
npm.cmd install
npm.cmd run dev
```

Build for production:

```bash
npm.cmd run build
npm.cmd start
```
