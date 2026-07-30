import { PROJECT_CONFIG } from "./config.js";

const setApplicationStatus = (message, state) => {
  const status = document.querySelector("#app-status");

  if (!status) {
    throw new Error("Required #app-status element is missing.");
  }

  status.textContent = message;
  document.documentElement.dataset.appState = state;
};

const bootstrap = () => {
  setApplicationStatus(
    `${PROJECT_CONFIG.edition}基礎頁面已就緒`,
    "foundation-ready"
  );
};

try {
  bootstrap();
} catch (error) {
  document.documentElement.dataset.appState = "foundation-error";
  const status = document.querySelector("#app-status");

  if (status) {
    status.textContent = "基礎頁面載入失敗";
  }

  throw error;
}
