# SGTS-NH 系統架構
## GitHub Pages 靜態教育模擬架構

> **KOSMOS TOOLKIT｜探真拓知酷**

## 文件狀態

- 適用主規格：`SGTS-NH_MASTER_SPEC.md` 1.0.1。
- 目前 Phase：Phase 2 completed，待使用者批准。
- Phase 2 已加入版本化地圖、座標純函式、海陸／線段判定、測站位置、
  Canvas 分層渲染及點選查詢；尚未實作颱風實體與物理。

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

## 模組邊界

目前資料流及後續 Phase 應維持：

```text
DOM Controls
  ↓ 發送受驗證的控制意圖
GameEngine／StateMachine／EventBus
  ↓ 排程固定步進
SimulationClock
  ↓ 每步固定 10 模擬分鐘
Update callback
  ↓ 產生新的模擬狀態與事件
Render callback
  ↓ 只讀狀態並繪製
CanvasViewport／DOM diagnostics
```

依賴規則：

- `simulation` 不得依賴 DOM 或 Canvas。
- `rendering` 不得寫回物理狀態。
- `ui` 不得直接修改颱風座標、風速或環境網格。
- `data` 只提供受 schema 驗證的資料。
- `utils` 不得隱藏可變的全域模擬狀態。
- 所有可調常數集中於 `js/config.js` 或後續明確拆分的設定模組。

## Phase 2 檔案責任

| 檔案 | 責任 |
|---|---|
| `index.html` | 三區介面、地圖查詢、控制項、診斷資料、品牌與聲明 |
| `js/config.js` | 不可變的專案身份、版本及引擎常數 |
| `js/app.js` | DOM 綁定、引擎／地圖組裝、查詢呈現、錯誤與可見性 |
| `js/core/GameEngine.js` | requestAnimationFrame loop、update/render 分離與生命週期 |
| `js/core/SimulationClock.js` | 累積器、固定步進、倍速、截斷與補算上限 |
| `js/core/StateMachine.js` | 八種遊戲狀態及合法轉換 |
| `js/core/EventBus.js` | 具順序 ID、同一步順序與 dedupe 的事件傳遞 |
| `js/ui/CanvasViewport.js` | 高 DPI backing store 與 resize |
| `js/rendering/CanvasRenderer.js` | Canvas 圖層編排、診斷 overlay 與 pointer 轉換 |
| `js/rendering/FieldRenderer.js` | 海洋背景與每 5 度經緯線 |
| `js/rendering/MapRenderer.js` | land polygon、coastSide、測站及查詢游標 |
| `js/data/geography.js` | JSON 載入、驗證、海陸與位置描述 |
| `js/data/stations.js` | 六站不可變位置與來源 |
| `js/utils/geo.js` | 座標、測地線、polygon、segment 與最近站純函式 |
| `assets/maps/northwest-pacific.json` | 來源／授權完整的簡化地圖資料 |
| `css/*.css` | tokens、桌面三區、平板／手機斷點、元件及無障礙 |
| `scripts/serve.mjs` | 僅供本機的靜態伺服器 |
| `tests/*.test.js` | 狀態、時鐘、事件、Canvas、文件及 workflow 單元測試 |
| `tests/integration/*.test.js` | 引擎固定步進事件及 Pages 子路徑整合測試 |
| `tests/engine-tests.html` | 可由純靜態網站載入的瀏覽器測試 harness |
| `tests/e2e/*.spec.js` | 實際 Chrome 互動及響應式 E2E |

## 固定步進契約

- 單一步進固定代表 10 模擬分鐘，倍速只改變累積速度。
- 真實畫格差上限 250 ms，避免切回分頁後吃入巨大 delta。
- 單畫格最多補算 8 步；超過的完整步數明確記為 dropped steps。
- 分頁隱藏時 update 與 render 都停止，累積器清空；切回後第一幀 delta
  歸零，不補算隱藏期間。
- update 只在完整步進發生；render 可使用 interpolation alpha，但不得推進物理。

## 地理資料流

```text
northwest-pacific.json
  ↓ fetch + validateMapData
geography.js（權威 bounds／海陸）
  ├─ describeGeographicPoint → DOM 查詢結果
  └─ read-only map data → CanvasRenderer
       ├─ FieldRenderer（背景／經緯線）
       └─ MapRenderer（陸地／岸段／測站／選取）
```

- 渲染器不決定海陸；它只讀受驗證的資料。
- 所有公開經度欄位只使用 `lon`。
- pointer 使用 CSS pixel rect 反轉座標，與 Canvas backing-store DPR 分離。
- Phase 2 採地理經緯度的線性 equirectangular 顯示；測地距離另用
  Haversine，不以 Canvas pixel 距離代替。

## GitHub Pages 路徑

- 正式 base path：`/classroom-sgts-nh-tzk/`。
- HTML、CSS、JavaScript 使用相對路徑。
- 第一版採單一 `index.html` 入口。
- Phase 1 建立測試 workflow，不建立 Pages 部署 workflow，也不部署。

## 尚未實作

下列均屬 Phase 3 以後，Phase 2 不提供假實作：

- 颱風實體、強度模型與導引氣流。
- 海陸、地形、降雨、測站、關卡、沙盒、儲存及匯出。
