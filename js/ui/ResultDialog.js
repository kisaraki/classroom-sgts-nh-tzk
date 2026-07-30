const formatSimulationMinutes = (minutes) => {
  const hours = Math.floor(minutes / 60);
  return `${Math.floor(hours / 24)}d ${String(hours % 24).padStart(2, "0")}h`;
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
      `${result.statistics.maximumWind.toFixed(1)} m/s`;
    this.#root.querySelector("[data-result-pressure]").textContent =
      `${result.statistics.minimumPressure.toFixed(0)} hPa`;
    this.#root.querySelector("[data-result-path]").textContent =
      `${result.path.length} points · ` +
      `${result.statistics.pathLengthKm.toFixed(0)} km`;
    this.#root.querySelector("[data-result-score]").textContent =
      `${result.score.total} / ${result.score.maximum}`;
    const station = result.statistics.stations.naha;
    this.#root.querySelector("[data-result-station]").textContent = station
      ? `最大陣風 ${station.maximumGust.toFixed(1)} m/s · ` +
        `累積雨量 ${station.accumulatedRain.toFixed(1)} mm`
      : "尚無那霸測站資料";
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
