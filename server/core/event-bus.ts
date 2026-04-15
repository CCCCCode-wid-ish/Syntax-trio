import { EventEmitter } from "node:events";
import { SimulationEvent } from "../../src/shared/types.js";
import { SimulationState } from "./state.js";

export class SimulationEventBus {
  private readonly emitter = new EventEmitter();

  publish(state: SimulationState, event: Omit<SimulationEvent, "id" | "timestamp">) {
    const fullEvent: SimulationEvent = {
      id: `evt-${state.idCounter++}`,
      timestamp: new Date().toISOString(),
      ...event
    };
    state.eventLog = [fullEvent, ...state.eventLog].slice(0, 120);
    this.emitter.emit("event", fullEvent);
  }

  subscribe(listener: (event: SimulationEvent) => void) {
    this.emitter.on("event", listener);
    return () => this.emitter.off("event", listener);
  }
}
