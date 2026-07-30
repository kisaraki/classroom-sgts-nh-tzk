const STATUS_LABELS = Object.freeze({
  completed: "完成",
  failed: "失敗",
  in_progress: "進行中",
  pending: "未完成"
});

const formatValue = (value, unit) => {
  if (value === null) {
    return "尚無資料";
  }

  if (typeof value === "boolean") {
    return value ? "是" : "否";
  }

  return `${value.toFixed(unit === "km" || unit === "mm" ? 1 : 2)} ${unit}`;
};

export class Dashboard {
  #level;
  #objectiveRows = new Map();
  #root;

  constructor(root, { level }) {
    if (!root || typeof root.append !== "function") {
      throw new TypeError("Dashboard requires a DOM root.");
    }

    if (!level?.objectives) {
      throw new TypeError("Dashboard requires a validated Level.");
    }

    this.#root = root;
    this.#level = level;
    this.#build();
  }

  render({ levelState, simulationMinutes }) {
    const remainingElement = this.#root.querySelector(
      "[data-level-remaining]"
    );

    if (this.#level.id === "sandbox") {
      remainingElement.textContent = "無勝敗";
    } else {
      const remainingMinutes = Math.max(
        0,
        this.#level.durationHours * 60 - simulationMinutes
      );
      const remainingHours = Math.floor(remainingMinutes / 60);
      const remainingRemainder = remainingMinutes % 60;
      remainingElement.textContent =
        `${remainingHours}h ${String(remainingRemainder).padStart(2, "0")}m`;
    }

    for (const objective of levelState.objectivesSnapshot()) {
      const row = this.#objectiveRows.get(objective.id);
      row.dataset.status = objective.status;
      row.querySelector("[data-objective-status]").textContent =
        STATUS_LABELS[objective.status];
      row.querySelector("[data-objective-value]").textContent =
        `${formatValue(objective.aggregatedValue, objective.unit)} / ` +
        `${formatValue(objective.threshold, objective.unit)}`;
      row.querySelector("progress").value = objective.progress;
    }
  }

  setLevel(level) {
    if (!level?.objectives) {
      throw new TypeError("Dashboard requires a validated Level.");
    }

    this.#level = level;
    this.#objectiveRows.clear();
    this.#build();
  }

  #build() {
    this.#root.replaceChildren();
    const heading = document.createElement("div");
    heading.className = "level-heading";
    const eyebrow = document.createElement("p");
    const title = document.createElement("h2");
    const context = document.createElement("p");
    const remaining = document.createElement("p");
    const remainingValue = document.createElement("strong");
    eyebrow.className = "eyebrow";
    const levelIndex = LEVELS.indexOf(this.#level);
    eyebrow.textContent = this.#level.id === "sandbox"
      ? "SANDBOX · NO WIN / LOSS"
      : `LEVEL ${String(levelIndex + 1).padStart(2, "0")} · ${this.#level.id}`;
    title.textContent = this.#level.title;
    context.textContent =
      `${this.#level.historicalInspiration}｜${this.#level.disclaimer}`;
    remaining.className = "level-time";
    remaining.append(
      this.#level.id === "sandbox" ? "模式 " : "剩餘時間 "
    );
    remainingValue.dataset.levelRemaining = "";
    remainingValue.textContent =
      this.#level.id === "sandbox"
        ? "無勝敗"
        : `${this.#level.durationHours}h 00m`;
    remaining.append(remainingValue);
    heading.append(eyebrow, title, context, remaining);
    const list = document.createElement("ol");
    list.className = "objective-list";

    for (const objective of this.#level.objectives) {
      const item = document.createElement("li");
      const rowHeading = document.createElement("div");
      const label = document.createElement("strong");
      const status = document.createElement("span");
      const description = document.createElement("p");
      const value = document.createElement("p");
      const progress = document.createElement("progress");
      item.dataset.objectiveId = objective.id;
      item.dataset.status = "pending";
      label.textContent = objective.label;
      status.dataset.objectiveStatus = "";
      status.textContent = "未完成";
      rowHeading.append(label, status);
      description.textContent = objective.description;
      value.dataset.objectiveValue = "";
      value.textContent =
        `尚無資料 / ${formatValue(objective.threshold, objective.unit)}`;
      progress.max = 1;
      progress.value = 0;
      progress.setAttribute("aria-label", `${objective.label}完成進度`);
      item.append(rowHeading, description, value, progress);
      list.append(item);
      this.#objectiveRows.set(objective.id, item);
    }

    this.#root.append(heading, list);
  }
}
import { LEVELS } from "../data/levels.js";
