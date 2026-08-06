const formatSimulationMinutes = (minutes) => {
  const hours = Math.floor(minutes / 60);
  return `${Math.floor(hours / 24)} 日 ${String(hours % 24).padStart(2, "0")} 小時`;
};

export class ResultDialog {
  #isOpen = false;
  #onRestart;
  #restartButton;
  #root;

  constructor(root, { onRestart }) {
    if (!root || typeof root.querySelector !== "function") {
      throw new TypeError("ResultDialog requires a DOM root.");
    }

    if (typeof onRestart !== "function") {
      throw new TypeError("ResultDialog onRestart must be a function.");
    }

    this.#root = root;
    this.#onRestart = onRestart;
    this.#restartButton = root.querySelector("[data-result-restart]");

    if (!this.#restartButton) {
      throw new Error("ResultDialog restart control is missing.");
    }

    this.#restartButton.addEventListener("click", this.#onRestart);
  }

  open(result, level) {
    if (this.#isOpen) {
      return false;
    }

    this.#isOpen = true;
    this.#root.hidden = false;
    this.#root.dataset.outcome = result.outcome;
    this.#root.querySelector("[data-result-title]").textContent =
      result.outcome === "victory" ? "任務完成" : "任務失敗";
    this.#root.querySelector("[data-result-summary]").textContent =
      result.outcome === "victory"
        ? `${level.title}全部主要目標已在時限內完成。`
        : `${level.title}因「${result.failureId}」結束。`;
    this.#root.querySelector("[data-result-time]").textContent =
      formatSimulationMinutes(result.simulationMinutes);
    this.#root.querySelector("[data-result-wind]").textContent =
      `每秒 ${result.statistics.maximumWind.toFixed(1)} 公尺`;
    this.#root.querySelector("[data-result-pressure]").textContent =
      `${result.statistics.minimumPressure.toFixed(0)} 百帕`;
    this.#root.querySelector("[data-result-path]").textContent =
      `${result.path.length} 個路徑點 · ` +
      `${result.statistics.pathLengthKm.toFixed(0)} 公里`;
    this.#root.querySelector("[data-result-score]").textContent =
      `${result.score.total} / ${result.score.maximum}`;
    const stations = Object.values(result.statistics.stations);
    const maximumGust = stations.reduce(
      (maximum, station) => Math.max(maximum, station.maximumGust),
      0
    );
    const maximumRain = stations.reduce(
      (maximum, station) => Math.max(maximum, station.accumulatedRain),
      0
    );
    this.#root.querySelector("[data-result-station]").textContent =
      stations.length > 0
        ? `全站最大陣風每秒 ${maximumGust.toFixed(1)} 公尺 · ` +
          `單站最高累積雨量 ${maximumRain.toFixed(1)} 毫米`
        : "尚無測站資料";
    this.#restartButton.textContent = `重啟「${level.title}」`;
    const scoreList = this.#root.querySelector("[data-result-breakdown]");
    scoreList.replaceChildren();

    for (const item of result.score.items) {
      const row = document.createElement("li");
      row.textContent =
        `${item.label}｜${item.points >= 0 ? "+" : ""}${item.points}`;
      scoreList.append(row);
    }

    this.#restartButton.focus();
    return true;
  }

  reset() {
    this.#isOpen = false;
    this.#root.hidden = true;
    delete this.#root.dataset.outcome;
  }

  destroy() {
    this.#restartButton.removeEventListener("click", this.#onRestart);
  }
}
