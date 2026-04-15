import { SimulationEngine } from "./services/simulation-engine.js";
import { SimulationScenario } from "../src/shared/types.js";

const engine = new SimulationEngine();

export const getSnapshot = () => engine.getSnapshot();
export const tickSimulation = () => engine.tick();
export const startSimulation = () => engine.start();
export const pauseSimulation = () => engine.pause();
export const setSimulationSpeed = (tickIntervalMs: number) => engine.setSpeed(tickIntervalMs);
export const setSimulationScenario = (scenario: SimulationScenario) => engine.setScenario(scenario);
export const subscribeToSimulationEvents = (listener: Parameters<SimulationEngine["subscribe"]>[0]) =>
  engine.subscribe(listener);
