# SGTS-NH 系統架構
## GitHub Pages 靜態教育模擬架構

> **KOSMOS TOOLKIT｜探真拓知酷**

## 文件狀態

- 適用主規格：`SGTS-NH_MASTER_SPEC.md` 1.0.1。
- 目前 Phase：Phase 0。
- Phase 0 只建立基礎頁面、文件與測試入口，尚未實作模擬引擎。

## 正式執行邊界

正式應用程式由 GitHub Pages 提供靜態檔案，執行於使用者瀏覽器：

```text
GitHub Pages
  └─ index.html
     ├─ CSS
     ├─ ES Modules
     ├─ JSON／地圖資料
     └─ 公開靜態素材
```

Node.js、npm、ESLint、測試 runner 與本機伺服器只用於開發及 CI，不屬正式網站執行環境。正式功能不得依賴伺服器端 API、資料庫、登入、秘密金鑰或 Node.js API。

## 目標模組邊界

後續 Phase 應維持：

```text
UI
  ↓ 發送受驗證的控制意圖
Core／State
  ↓ 排程固定步進
Simulation
  ↓ 產生新的物理狀態與事件
Rendering
  ↓ 只讀狀態並繪製
Canvas／DOM
```

依賴規則：

- `simulation` 不得依賴 DOM 或 Canvas。
- `rendering` 不得寫回物理狀態。
- `ui` 不得直接修改颱風座標、風速或環境網格。
- `data` 只提供受 schema 驗證的資料。
- `utils` 不得隱藏可變的全域模擬狀態。
- 所有可調常數集中於 `js/config.js` 或後續明確拆分的設定模組。

## Phase 0 檔案責任

| 檔案 | 責任 |
|---|---|
| `index.html` | 最小可啟動頁面、品牌與非預報聲明 |
| `js/config.js` | 不可變的專案身份與版本基礎 |
| `js/app.js` | Phase 0 啟動與可讀狀態 |
| `css/*.css` | reset、tokens、版面、元件與無障礙基礎 |
| `scripts/serve.mjs` | 僅供本機的靜態伺服器 |
| `tests/foundation.test.js` | 文件、身份與相對路徑測試 |
| `tests/integration/foundation-smoke.test.js` | 根目錄及 Pages 子路徑 HTTP smoke test |

## GitHub Pages 路徑

- 正式 base path：`/classroom-sgts-nh-tzk/`。
- HTML、CSS、JavaScript 使用相對路徑。
- 第一版採單一 `index.html` 入口。
- Phase 0 不建立 Pages workflow，也不部署。

## 尚未實作

下列均屬 Phase 1 以後，Phase 0 不提供假實作：

- GameEngine、SimulationClock、StateMachine、EventBus。
- Canvas 模擬介面與固定時間步進。
- 地圖、座標、颱風實體、物理模型與導引氣流。
- 海陸、地形、降雨、測站、關卡、沙盒、儲存及匯出。
