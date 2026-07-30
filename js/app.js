import { PROJECT_CONFIG } from "./config.js";
import { GameEngine } from "./core/GameEngine.js";
import { GameState } from "./core/StateMachine.js";
import { SimulationClock } from "./core/SimulationClock.js";
import {
  CanvasViewport,
  formatSimulationTime
} from "./ui/CanvasViewport.js";

const requireElement = (selector) => {
  const element = document.querySelector(selector);

  if (!element) {
    throw new Error(`Required element is missing: ${selector}`);
  }

  return element;
};

const bootstrap = () => {
  const elements = {
    canvas: requireElement("#simulation-canvas"),
    currentSpeed: requireElement("#current-speed"),
    engineState: requireElement("#engine-state"),
    error: requireElement("#app-error"),
    fps: requireElement("#fps-readout"),
    pauseButton: requireElement("#pause-button"),
    simulationTime: requireElement("#sim-time"),
    speedButtons: [...document.querySelectorAll("[data-speed]")],
    startButton: requireElement("#start-button"),
    stepCount: requireElement("#step-count"),
    updateCount: requireElement("#update-count"),
    visibility: requireElement("#visibility-status")
  };

  if (elements.speedButtons.length !== PROJECT_CONFIG.simulation.speeds.length) {
    throw new Error("Simulation speed controls are incomplete.");
  }

  const viewport = new CanvasViewport(elements.canvas);
  let updateCount = 0;

  const clock = new SimulationClock({
    maxCatchUpSteps: PROJECT_CONFIG.simulation.maxCatchUpSteps,
    maxFrameDeltaMs: PROJECT_CONFIG.simulation.maxFrameDeltaMs,
    realStepMs: PROJECT_CONFIG.simulation.realStepMs,
    stepMinutes: PROJECT_CONFIG.simulation.stepMinutes
  });

  const render = ({ clock: clockState, fps, state }) => {
    document.documentElement.dataset.appState = state.toLowerCase();
    elements.engineState.textContent = state;
    elements.simulationTime.textContent = formatSimulationTime(
      clockState.simulationMinutes
    );
    elements.stepCount.textContent = String(clockState.stepIndex);
    elements.currentSpeed.textContent = `${clockState.speed}×`;
    elements.fps.textContent = Number.isFinite(fps) ? fps.toFixed(0) : "0";
    elements.updateCount.textContent = String(updateCount);
    elements.visibility.textContent = clockState.isHidden
      ? "頁面隱藏｜停止累積"
      : "頁面可見";

    elements.startButton.disabled = ![
      GameState.MENU,
      GameState.TUTORIAL
    ].includes(state);
    elements.pauseButton.disabled = ![
      GameState.RUNNING,
      GameState.PAUSED
    ].includes(state);
    elements.pauseButton.textContent =
      state === GameState.PAUSED ? "繼續" : "暫停";

    for (const button of elements.speedButtons) {
      button.setAttribute(
        "aria-pressed",
        String(Number(button.dataset.speed) === clockState.speed)
      );
    }

    viewport.draw({
      fps,
      simulationMinutes: clockState.simulationMinutes,
      speed: clockState.speed,
      state,
      stepIndex: clockState.stepIndex
    });
  };

  const engine = new GameEngine({
    clock,
    render,
    update: () => {
      updateCount += 1;
    }
  });

  const handleError = (error) => {
    const message = error instanceof Error ? error.message : String(error);
    elements.error.hidden = false;
    elements.error.textContent = `模擬器發生錯誤：${message}`;
    engine.enterError(error);
  };

  elements.startButton.addEventListener("click", () => {
    try {
      elements.error.hidden = true;
      updateCount = 0;
      engine.startSimulation();
    } catch (error) {
      handleError(error);
    }
  });

  elements.pauseButton.addEventListener("click", () => {
    try {
      if (engine.state === GameState.RUNNING) {
        engine.pauseSimulation();
      } else if (engine.state === GameState.PAUSED) {
        engine.resumeSimulation();
      }
    } catch (error) {
      handleError(error);
    }
  });

  for (const button of elements.speedButtons) {
    button.addEventListener("click", () => {
      try {
        engine.setSpeed(Number(button.dataset.speed));
      } catch (error) {
        handleError(error);
      }
    });
  }

  document.addEventListener("visibilitychange", () => {
    engine.setVisibilityHidden(document.hidden);
  });

  window.addEventListener("error", (event) => {
    handleError(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleError(event.reason);
  });

  window.addEventListener(
    "pagehide",
    () => {
      viewport.destroy();
      engine.destroy();
    },
    { once: true }
  );

  engine.setVisibilityHidden(document.hidden);
  engine.boot();
};

try {
  bootstrap();
} catch (error) {
  document.documentElement.dataset.appState = "error";
  const errorMessage = document.querySelector("#app-error");

  if (errorMessage) {
    errorMessage.hidden = false;
    errorMessage.textContent = `模擬器無法啟動：${
      error instanceof Error ? error.message : String(error)
    }`;
  }

  throw error;
}
