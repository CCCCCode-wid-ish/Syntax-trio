import { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { DashboardSnapshot, SimulationEvent } from "../../src/shared/types.js";

type GatewayOptions = {
  server: HttpServer;
  getSnapshot: () => DashboardSnapshot;
  subscribeToSimulationEvents: (listener: (event: SimulationEvent) => void) => () => void;
};

const mapSimulationEventToSocket = (event: SimulationEvent) => {
  const common = {
    orderId: event.payload?.orderId,
    store: event.payload?.storeId ?? event.payload?.store,
    riderId: event.payload?.riderId,
    pickerId: event.payload?.pickerId,
    log: event.message,
    timestamp: event.timestamp,
    payload: event.payload
  };

  switch (event.type) {
    case "order.created":
      return { event: "ORDER_CREATED", ...common };
    case "order.routed":
      return { event: "ORDER_ROUTED", ...common };
    case "inventory.restocked":
      return { event: "INVENTORY_UPDATED", ...common };
    case "order.picked":
      return { event: "ORDER_PICKED", ...common };
    case "order.delivered":
      return { event: "ORDER_DELIVERED", ...common };
    default:
      return { event: "AGENT_DECISION_LOG", ...common };
  }
};

export const attachWebSocketGateway = ({
  server,
  getSnapshot,
  subscribeToSimulationEvents
}: GatewayOptions) => {
  const io = new SocketIOServer(server, {
    path: "/socket.io",
    cors: {
      origin: "*"
    }
  });

  const unsubscribe = subscribeToSimulationEvents((event) => {
    const socketEvent = mapSimulationEventToSocket(event);
    io.emit(socketEvent.event, socketEvent);
  });

  io.on("connection", (socket) => {
    socket.emit("INITIAL_SNAPSHOT", getSnapshot());
    socket.on("disconnect", () => {
      // client disconnected
    });
  });

  return io;
};
