const STATUS_LABELS = Object.freeze({
  completed: "完成",
  failed: "失敗",
  in_progress: "進行中",
  pending: "未完成"
});

const UNIT_LABELS = Object.freeze({
  "": "",
  "hPa": "百帕",
  "km": "公里",
  "m/s": "公尺／秒",
  "min": "分鐘",
  "mm": "毫米",
  entries: "次進入",
  landfalls: "次登陸",
  stations: "個測站"
});

const formatPlayerFacingText = (text) =>
  text
    .replaceAll("最大風速", "近中心最大風速")
    .replace(/([0-9.]+) m\/s/g, "每秒 $1 公尺")
    .replace(/([0-9.]+) hPa/g, "$1 百帕")
    .replace(/([0-9.]+) km/g, "$1 公里")
    .replace(/([0-9.]+) mm/g, "$1 毫米");

const formatValue = (value, unit) => {
  if (value === null) {
    return "尚無資料";
  }

  if (typeof value === "boolean") {
    return value ? "是" : "否";
  }

  const label = UNIT_LABELS[unit] ?? unit;
  return `${value.toFixed(unit === "km" || unit === "mm" ? 1 : 2)}${
    label ? ` ${label}` : ""
  }`;
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
        `${remainingHours} 小時 ${String(remainingRemainder).padStart(2, "0")} 分鐘`;
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
      ? "自由實驗｜不設勝敗"
      : `第 ${String(levelIndex + 1).padStart(2, "0")} 關｜任務識別 ${this.#level.id}`;
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
        : `${this.#level.durationHours} 小時 00 分鐘`;
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
      description.textContent = formatPlayerFacingText(objective.description);
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
