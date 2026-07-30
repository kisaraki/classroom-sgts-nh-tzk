# SGTS-NH 系統架構
## GitHub Pages 靜態教育模擬架構

> **KOSMOS TOOLKIT｜探真拓知酷**

## 文件狀態

- 適用主規格：`SGTS-NH_MASTER_SPEC.md` 1.0.1。
- 目前 Phase：Phase 9 in progress；本機發布準備已完成，外部發布待授權。
- Phase 9 不改物理模型；加入可觀測效能、靜態地圖快取、無障礙與
  可重現 Pages artifact／deployment workflow。

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
  ↓ Environment 目標→實際→GridCell
SteeringModel 移動 Typhoon
  ↓ LandInteractionModel 依路徑積分
OceanCoolingModel 更新全網格尾流
  ↓ 新位置及分段地形取樣
IntensityModel 更新強度
  ↓
ObservationModel 更新六站風雨
  ↓ LevelState 記錄正式模型統計
ObjectiveEvaluator／FailureEvaluator
  ↓ 勝利或失敗只結算一次
GameEngine VICTORY／FAILURE
Render callback
  ↓ 只讀 snapshot
CanvasViewport／TyphoonRenderer／TrackRenderer／ParticleRenderer／DOM dashboard
```

依賴規則：

- `simulation` 不得依賴 DOM 或 Canvas。
- `rendering` 不得寫回物理狀態。
- `ui` 不得直接修改颱風座標、風速或環境網格。
- `data` 只提供受 schema 驗證的資料。
- `utils` 不得隱藏可變的全域模擬狀態。
- 所有可調常數集中於 `js/config.js` 或後續明確拆分的設定模組。
- `ParticleRenderer` 只能取用 `visual` PRNG 子流；物理 fingerprint 排除該子流。
- `ControlPanel` 只能改 `Environment.targetControls`，不得持有或修改 Typhoon。

## Phase 9 檔案責任

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
| `js/model/Typhoon.js` | 颱風完整欄位、結構 enum、路徑／事件歷史及物理 snapshot |
| `js/model/GridCell.js` | 單一環境取樣點的數值範圍與單位契約 |
| `js/model/Environment.js` | 1° 網格、雙線性取樣、目標／實際控制與場更新 |
| `js/data/terrain.js` | 海陸後的臺灣解析式地形分區、高度、粗糙度及坡向 |
| `js/model/WeatherStation.js` | 六站執行期 schema、風雨狀態、10 分鐘累積及 reset |
| `js/simulation/IntensityModel.js` | 因子、發展潛勢、時間反應、上下限、遲滯與 fingerprint |
| `js/simulation/SteeringModel.js` | 向量合成、平滑、球面位移、速度上限及路徑分段 |
| `js/simulation/LandInteractionModel.js` | 0.5 km 再取樣、海陸事件、地形／摩擦積分及再組織延遲 |
| `js/simulation/OceanCoolingModel.js` | 暴風半徑內尾流累積、OHC／移速效應及全網格恢復 |
| `js/simulation/RainfallModel.js` | 徑向雨率、季風、迎風抬升、雨影及尾流降雨回饋 |
| `js/simulation/ObservationModel.js` | 測站距離風場、陣風、降雨計算與 snapshot |
| `js/utils/geo.js` | 座標、測地線、polygon、segment 與最近站純函式 |
| `js/utils/random.js` | `mulberry32-v1`、種子衍生、四子流及穩定 fingerprint |
| `js/rendering/TyphoonRenderer.js` | 五種颱風結構的 Canvas 表現 |
| `js/rendering/TrackRenderer.js` | 只讀 trackHistory 的路徑線 |
| `js/rendering/ParticleRenderer.js` | 可關閉的純視覺粒子，不回寫物理 |
| `js/rendering/FieldRenderer.js` | SST 底圖、等壓線、副高、季風槽及導引箭頭 |
| `js/ui/ControlPanel.js` | 目標滑桿、實際值、趨勢文字及反應時間 |
| `js/data/levels.js` | Level 等效 schema、DSL 白名單、站群／警戒區及三關資料 |
| `js/data/sandbox.js` | 沙盒 preset schema、預設值及無勝敗 Level adapter |
| `js/persistence/StorageManager.js` | localStorage v1 驗證、遷移入口與損壞回復 |
| `js/io/SimulationIO.js` | 安全 JSON 匯入、重播資料及 CSV／JSON／PNG／文字匯出 |
| `js/model/LevelState.js` | 目標／失敗、岸側／山脈／警戒事件、計分與不可變結果 |
| `js/core/ObjectiveEvaluator.js` | 只以白名單 metric 計算目標及單次事件 |
| `js/core/FailureEvaluator.js` | 邊界、消散、超時及區域順序失敗判定 |
| `js/ui/Dashboard.js` | 關卡時間與四狀態目標面板 |
| `js/ui/Tutorial.js` | 依固定步數顯示資料驅動提示 |
| `js/ui/ResultDialog.js` | 單次結算、模型統計、分數明細與重啟 |
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

## Phase 3 強度資料流

```text
PROJECT_CONFIG + seed
  ├─ intensity / steering / environment PRNG（物理）
  └─ visual PRNG（只供 ParticleRenderer）

GridCell + Typhoon + 固定 10 分鐘 step
  ↓ calculateEnvironmentalFactors
發展潛勢（各 0～1 因子相乘）
  ↓ targetWind + responseHours + per-step clamp
風速／組織／對稱／水氣
  ↓ bounded mappings + hysteresis
氣壓／暴風半徑／structureStage
  ↓ snapshot
Canvas 與 DOM 儀表板（唯讀）
```

- 科氏項命名為 `coriolisOrganization`，只代表低緯度渦旋組織限制，
  並非風速加成。
- 模型位置在 Phase 3 固定；不得從 `steeringU/V` 推進中心。
- fingerprint 包含模型版本、PRNG 版本、種子、步數、物理子流狀態與
  Typhoon 物理欄位，不含畫格、Canvas 或粒子狀態。
- 公式、校準情境及限制詳見 `docs/INTENSITY-MODEL.md`。

## Phase 4 環境與移動資料流

```text
玩家滑桿
  ↓ 僅更新 targetControls
Environment.update（指數反應延遲）
  ↓ 刷新 2,501 個 GridCell
sampleAt(current position)
  ↓ background + high + monsoon
SteeringModel
  ├─ + beta drift
  ├─ + steering seeded perturbation
  ├─ vector response smoothing
  ├─ 45 km/h cap
  └─ great-circle displacement / ≤3 km subsegments
       ↓
Typhoon.applyMovement
  ↓ 新位置再次 sampleAt
IntensityModel
```

- `steeringU > 0` 為向東，`steeringV > 0` 為向北，單位固定 m/s。
- Canvas 場箭頭讀取 GridCell 的 U／V；黃色 `NEXT` 箭頭直接讀取本步
  `actualVector`，不另算一套視覺方向。
- Phase 4 只回報線段穿越的 region ID，不發送 LANDFALL／SEA_REENTRY；
  Phase 5 的 `LandInteractionModel` 取用這些路徑點後正式發送事件並做
  分段時間積分。
- 公式、控制範圍與限制詳見 `docs/STEERING-MODEL.md`。

## Phase 5 海陸、尾流與觀測資料流

```text
SteeringModel.pathPoints
  ↓ 0.5 km sampling / terrain profile
LandInteractionModel
  ├─ LANDFALL / SEA_REENTRY → EventBus + Typhoon.eventHistory
  ├─ land fraction / roughness / terrain loss → Typhoon
  └─ reorganization factor → IntensityModel

Environment.cells + Typhoon
  ↓
OceanCoolingModel → each GridCell.coldWake
  ↓
RainfallModel + ObservationModel
  └─ six WeatherStation snapshots → Canvas + DOM dashboard
```

- 更新順序為正式物理契約；UI 不得另算或寫回風雨值。
- 冷水尾流保存於 2,501 個既有 cell，重啟時全部歸零。
- 測站累積雨量只使用 10 分鐘固定步進；倍速與 FPS 不改變積分。
- 公式、常數、校準情境及限制詳見 `docs/LAND-RAIN-MODEL.md`。

## Phase 6～7 關卡資料流

```text
validated Level + official model snapshots
  ↓
LevelState.recordStep
  ├─ model-derived statistics
  ├─ reference-zone、岸側、山脈與 warning-zone history
  └─ ordered control operations
       ↓
ObjectiveEvaluator + FailureEvaluator
  ├─ fixed metric resolver tables
  ├─ EventBus dedupe
  └─ failure-priority terminal arbitration
       ↓
one frozen result
  ├─ GameEngine VICTORY / FAILURE
  ├─ Dashboard / ResultDialog / Tutorial
  └─ Canvas target zones
```

- 規則資料不得包含函式，也不得由字串執行程式碼。
- UI 不自行判斷勝敗、重算測站值或計分。
- 終端步進會立即暫停時鐘，不繼續執行同畫格剩餘補算。
- `LevelState.finalize` 與結果 dialog 都是 idempotent。
- 詳細契約、三關與黃金重播見 `docs/LEVEL-SYSTEM.md`。

## Phase 8 沙盒與 I/O 資料流

```text
validated SandboxPreset
  ↓ createSandboxLevel + common createLevelSession
same Environment → Steering → Land → Ocean → Intensity → Observation
  ↓ no Objective/Failure terminal evaluation
track + operations + seed + versions
  ├─ localStorage v1（設定／進度）
  ├─ CSV／JSON／summary download
  ├─ rendered Canvas → branded PNG
  └─ safe JSON import → validate → deterministic replay
```

- 匯入資料永遠先通過大小、深度、原型污染與 exact-field 驗證。
- 外部 JSON 不直接建構 HTML，也不寫入 DOM `innerHTML`。
- 詳細格式與安全界線見 `docs/SANDBOX-EXPORT.md`。

## GitHub Pages 路徑

- 正式 base path：`/classroom-sgts-nh-tzk/`。
- HTML、CSS、JavaScript 使用相對路徑。
- 第一版採單一 `index.html` 入口。
- Phase 1 建立測試 workflow，不建立 Pages 部署 workflow，也不部署。

## Phase 9 效能與發布資料流

```text
requestAnimationFrame
  ├─ PerformanceMonitor：frame / update / render / longtask
  ├─ fixed update：正式物理，不受粒子層級影響
  └─ render
      ├─ cached GeoJSON object
      ├─ offscreen static map canvas
      ├─ dynamic environment / storm / stations
      └─ deterministic 300 / 700 / 1200 visual particles

source tree
  → build-pages allowlist
  → dist: index + css + js + assets + LICENSE
  → test job → build job → deploy job
```

- `PerformanceMonitor` 的 bounded window 最多保存 600 筆；百分位與摘要
  每 30 次 snapshot 才重算，避免每幀排序與大量短命配置。
- `loadGeography` 共用 Promise／已驗證資料，失敗時清除 cache 以便重試。
- `MapRenderer` 只在 geography identity 或 viewport 尺寸改變時重畫固定
  地圖離屏 Canvas；測站、選取、環境、風暴與目標仍為動態圖層。
- `prefers-reduced-motion` 只停用動畫粒子，不更動物理或使用者已保存偏好。
- 正式 Pages deployment 尚未執行；架構定義不等於線上狀態。
