# SGTS-NH 關卡系統
## Phase 6 資料契約、判定、計分與黃金重播

> **KOSMOS TOOLKIT｜探真拓知酷**

## 定位

Phase 6 提供第一個可完整遊玩的資料驅動關卡「那霸風雨」。關卡資料、
目標、失敗條件與計分均與物理模型分離；正式執行仍是 GitHub Pages 上的
純靜態 ES Modules，不載入遠端程式碼。

歷史靈感為 2018 年潭美，但關卡不是歷史重建，所有模型輸出也不是官方
觀測或預報。

## 關卡資料

`js/data/levels.js` 目前只匯出一關：

| 欄位 | 那霸風雨 |
|---|---|
| `id` | `naha-storm` |
| 生成點 | 14°N、145°E |
| 初始最大風速 | 15 m/s |
| 初始中心氣壓 | 1005 hPa |
| 時限 | 168 小時 |
| seed | `naha-storm-201809` |
| 模型版本 | `0.6.0-level-naha` |

通用 `Level` 必須具有：

- 身份與說明：`schemaVersion`、`id`、`title`、
  `historicalInspiration`、`disclaimer`、`durationHours`、`seed`。
- 初始條件：`spawn`、`environmentPreset`、`allowedControls`。
- 規則：`objectives`、`bonusObjectives`、`failureConditions`、
  `referenceZones`。
- 呈現：`scoring`、`tutorialMessages`。

`validateLevel` 採完全欄位白名單、有限數值、字串／陣列大小限制、
唯一 ID、enum、地圖 bounds 與控制範圍驗證。未知欄位、未知 metric、
不支援版本及可執行內容均拒絕。

## 白名單規則 DSL

規則只保存資料，不保存函式或程式碼。共同欄位包括 `metric`、
`operator`、`aggregation`、`threshold`、`durationSteps`、`subject`、
`radiusKm`、`reference`、`prerequisite` 及 `once`。

允許的運算子：

```text
<  <=  ==  >=  >
```

允許的聚合：

```text
current  minimum  maximum  any
```

目標 metric 白名單：

- `storm.distanceToStation`
- `station.gust`
- `station.accumulatedRain`
- `storm.maxWindWithinStationRadius`

失敗 metric 白名單：

- `simulation.boundaryReached`
- `storm.maxWind`
- `simulation.minutes`
- `event.regionEnteredBeforeZone`

`ObjectiveEvaluator` 與 `FailureEvaluator` 以固定 resolver table 取值，
不得使用 `eval`、`Function`、動態 import 或把字串轉為任意屬性路徑。
事件 dedupe key 與 `LevelState` 的終端狀態共同保證目標、失敗及結算只發生
一次。

## 第一關規則

主要目標：

1. 中心進入那霸測站 50 km。
2. 那霸模型最大陣風達 45 m/s。
3. 那霸模型累積雨量達 250 mm。
4. 中心進入那霸 150 km 時，模型最大風速至少 33 m/s。

失敗條件：

- 中心碰到 100°E～160°E、0°N～40°N 模擬邊界。
- 最大風速低於 8 m/s 連續 72 步，即 12 模擬小時。
- 168 小時後仍未完成所有主要目標。
- 在進入琉球參考區前先進入 `china-mainland`。

琉球參考區是通用 `referenceZones` 資料：進入 `ryukyu-` region，或進入
那霸 150 km，均視為已抵達。失敗優先於同一步的勝利，以避免終端狀態
含糊。

## 固定更新與結算

每個 10 分鐘步進順序固定為：

```text
Environment
  → Steering
  → Land interaction
  → Ocean cooling
  → Intensity
  → Station observations
  → LevelState statistics
  → Objectives
  → Failures
  → one terminal result
```

`LevelState` 保存每個規則的 pending／in_progress／completed／failed、
連續步數、聚合值、完成時間，以及最大風速、最低氣壓、路徑長度、
最大冷水尾流、控制操作與各測站極值。結果一旦建立即凍結；重複
`finalize` 會回傳同一物件。

結算顯示路徑、最大風速、最低氣壓、那霸模型陣風／累積雨量、分數明細
及重啟。重啟會建立全新 session，清除時鐘、目標、失敗、結果、事件
dedupe、控制操作、路徑、網格尾流與測站累積量。

## 計分

最高 6,250 分，最後四捨五入至整數：

| 項目 | 規則 | 上限 |
|---|---|---:|
| 四個主要目標 | 每項完成 1,000 | 4,000 |
| 時間效率 | 依剩餘時間線性計分 | 750 |
| 控制穩定度 | 24 次控制變更內線性遞減 | 500 |
| 強度管理 | 峰值風速相對 45 m/s，上限 1 | 500 |
| 路徑精度 | 那霸最近距離相對 500 km 線性計分 | 500 |
| 過度冷水尾流 | 超過 2°C 每 1°C 扣 100，最多扣 250 | -250 |

所有公式名稱、門檻及上限都存在 `Level.scoring`；UI 只呈現
`LevelState` 的計算結果，不另算分數。

## 黃金重播

`tests/fixtures/naha-storm-golden-replay.json` 記錄 schema、模型與 PRNG
版本、seed、初始環境、合法控制範圍、依序操作、期望事件、終端結果及
浮點容差。固定操作為開始前把風切設為 4 m/s、副高強度設為 85%。

目前正式基準：

| 項目 | 值 |
|---|---:|
| 勝利步數 | 861 |
| 模擬時間 | 8,610 分鐘 |
| fingerprint | `9bb637a1` |
| 分數 | 5,519 |
| 那霸最近距離 | 48.9323238690862 km |
| 那霸最大模型陣風 | 53.86922134698026 m/s |
| 那霸模型累積雨量 | 865.3074154513162 mm |

同一 JavaScript 引擎使用絕對容差 `1e-9`；跨瀏覽器浮點數可用
`1e-6`，但事件順序、勝敗、完成步數與 fingerprint 必須完全一致。

## 已知限制

- 第一版只有一個關卡；Phase 7 的關卡尚未建立。
- 歷史名稱只提供情境靈感，初始值及計分是教育遊戲設定。
- 目標使用模型測站值，不等同實際 2018 年逐時觀測。
- 目前不提供關卡 JSON 匯入；未受信任資料即使未進入正式 UI，也必須先
  通過相同驗證器。
- 沙盒、儲存、匯出與跨版本遷移不屬 Phase 6。
