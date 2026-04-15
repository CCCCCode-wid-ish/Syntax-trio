import { SimulationEngine } from "./services/simulation-engine.js";
const engine = new SimulationEngine();
export const getSnapshot = () => engine.getSnapshot();
export const tickSimulation = () => engine.tick();
export const startSimulation = () => engine.start();
export const pauseSimulation = () => engine.pause();
export const setSimulationSpeed = (tickIntervalMs) => engine.setSpeed(tickIntervalMs);
export const setSimulationScenario = (scenario) => engine.setScenario(scenario);
export const subscribeToSimulationEvents = (listener) => engine.subscribe(listener);
