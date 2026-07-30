export class Tutorial {
  #activeMessageId = null;
  #level;
  #root;

  constructor(root, { level }) {
    if (!root || typeof root.querySelector !== "function") {
      throw new TypeError("Tutorial requires a DOM root.");
    }

    if (!level?.tutorialMessages) {
      throw new TypeError("Tutorial requires a validated Level.");
    }

    this.#root = root;
    this.#level = level;
    this.render(0);
  }

  render(stepIndex) {
    const message =
      [...this.#level.tutorialMessages]
        .reverse()
        .find((entry) => stepIndex >= entry.triggerStep) ??
      this.#level.tutorialMessages[0];

    if (!message || message.id === this.#activeMessageId) {
      return;
    }

    this.#activeMessageId = message.id;
    this.#root.querySelector("[data-tutorial-title]").textContent =
      message.title;
    this.#root.querySelector("[data-tutorial-body]").textContent =
      message.body;
  }

  reset() {
    this.#activeMessageId = null;
    this.render(0);
  }
}
