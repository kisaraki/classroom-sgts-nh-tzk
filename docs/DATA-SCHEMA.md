# SGTS-NH 資料 Schema
## 版本、單位與驗證規則

> **KOSMOS TOOLKIT｜探真拓知酷**

## 版本

- `schemaVersion`：資料形狀版本，第一版起始值為整數 `1`。
- `modelVersion`：模型行為版本；Phase 7 為 `0.7.0-taiwan-wayne`。
- PRNG 演算法版本：`mulberry32-v1`。
- 外部匯入資料必須先驗證，再轉換成新的內部物件。

Phase 8 已建立地圖、Typhoon、GridCell、Environment、WeatherStation、
海陸事件、三關 Level、沙盒 preset、localStorage v1 與匯入匯出契約。

## 第一版單位字典

| 欄位 | 單位／範圍 | 約定 |
|---|---|---|
| `lat` | 十進位度，0～40 | 北緯為正 |
| `lon` | 十進位度，100～160 | 東經為正；禁止 `lng`、`long` |
| `heading` | 度，0～<360 | 0 北、90 東 |
| `maxWind` | m/s | 教育模型最大持續風 |
| `translationSpeed` | km/h | 中心移動速度 |
| `steeringU` | m/s | 正值向東 |
| `steeringV` | m/s | 正值向北 |
| `centralPressure`、`surfacePressure` | hPa | 遊戲化近似 |
| `galeRadius` | km | 模型暴風半徑 |
| `seaSurfaceTemperature` | °C | 有效海表溫度 |
| `oceanHeatContent` | 0～1 | 遊戲化暖水層厚度係數 |
| `verticalWindShear` | m/s | 模型環境風切 |
| `relativeHumidity` | 0～1 | 相對溼度比例 |
| `terrainHeight`、`elevation` | m | 相對海平面 |
| `surfaceRoughness` | 0～1 | 遊戲化摩擦係數 |
| `landFraction` | 0～1 | 網格陸地比例 |
| `coldWake` | °C | 自背景有效 SST 扣除的冷卻量 |
| `hourlyRainRate` | mm/h | 當前模型雨率 |
| `accumulatedRain` | mm | 本次模擬累積 |
| `simulationMinutes` | 分鐘 | 自 0 起算 |
| `stepIndex` | 無單位整數 | 權威時間索引，自 0 起算 |

## 地理資料

- 座標順序固定為 `[lon, lat]`。
- 位於海岸 polygon 邊界的點視為陸地。
- 每個區域具有穩定 `regionId`。
- 臺灣岸段需支援 `east`、`west`、`north`、`south` 的 `coastSide`。
- 地圖檔需包含格式版本、來源、授權、簡化方法與產生日期。

### `northwest-pacific.json`

頂層必要欄位：

| 欄位 | 型別／規則 |
|---|---|
| `schemaVersion` | 整數，目前為 `1` |
| `type` | 固定 `FeatureCollection` |
| `bounds` | `minLon: 100`、`maxLon: 160`、`minLat: 0`、`maxLat: 40` |
| `metadata.formatVersion` | 非空字串，目前為 `sgts-map-1` |
| `metadata.source` | 名稱、發布者及 HTTPS URL |
| `metadata.license` | 授權名稱及 URL |
| `metadata.simplification` | 具體簡化／重繪方式及精度限制 |
| `metadata.generatedAt` | `YYYY-MM-DD` |
| `features` | 非空 land Polygon 陣列 |

Feature 規則：

- `properties.regionId` 必須唯一且符合小寫 ASCII kebab-case；判定不得依
  顯示名稱。
- Phase 2 只使用無洞的 `Polygon`。
- exterior ring 採順時針、首尾座標完全相同，至少三個不同頂點。
- 所有座標均需位於地圖 bounds。
- 位於邊或頂點的座標都視為陸地。
- 若未來加入 holes，需提升資料契約並規定反向 ring；不得靜默混用。
- 臺灣 `coastSegments` 必須各有 `east`、`west`、`north`、`south`，
  coordinates 同樣使用 `[lon, lat]`。
- Phase 2 以 `validateMapData` 作為主規格允許的等效自動驗證：
  拒絕未知欄位、不支援版本、非 HTTPS 來源／授權 URL、錯誤 bounds、
  非閉合／逆向／越界 ring、重複 `regionId` 及不完整岸段。

### 測站位置

Phase 2 每站必要欄位：

| 欄位 | 規則 |
|---|---|
| `id` | 唯一、穩定 kebab-case |
| `name` | 繁體中文顯示名稱 |
| `lat`、`lon` | 位於 Phase 2 bounds |
| `elevation` | m |
| `exposure` | 教育模型 0～1 係數；Phase 5 才參與觀測模型 |
| `region` | 穩定區域分類 |
| `isVirtual` | 布林；目前六站均為 `false` |
| `source` | authority、stationCode、URL |

正式氣象觀測值尚未建立，測站資料不得包含寫死風雨答案。Phase 5 的
風雨欄位是模擬執行期輸出，不得標示為官方觀測。

### `WeatherStation`

Phase 5 由靜態測站定義建立執行期物件；拒絕未知欄位。

| 欄位 | 型別／規則 |
|---|---|
| 靜態欄位 | `id`、`name`、`lat`、`lon`、`elevation`、`exposure`、`region`、`isVirtual`、`source` |
| `sustainedWind` | 0～150 m/s；Phase 5 模型輸出上限 75 m/s |
| `gust` | 0～180 m/s；Phase 5 模型輸出上限 95 m/s |
| `hourlyRainRate` | 0～500 mm/h；Phase 5 模型輸出上限 60 mm/h |
| `accumulatedRain` | 0～100,000 mm；每步依 `rate × minutes / 60` 積分 |
| `terrainCorrection` | 0～5；目前迎風／背風降雨因子 |
| `updateSimulationMinutes` | 0～安全整數；最後更新的權威模擬時間 |

### 地形分區

`TerrainZone` 固定 enum：`ocean`、`generic-land`、`west-plain`、
`central-mountains`、`east-rift-valley`、`coast-range`。每個 profile
固定輸出 `zone`、`isLand`、`regionId`、`elevation`、`roughness` 與
`slopeAspect`。

## `Typhoon`

| 欄位 | 型別／規則 |
|---|---|
| `id` | 1～64 字元 kebab-case |
| `name` | 1～64 字元 |
| `lat`、`lon` | 位於地圖 bounds |
| `maxWind` | 有限數，執行期模型限制 5～85 m/s |
| `centralPressure` | 有限數，執行期模型限制 880～1010 hPa |
| `galeRadius` | 有限數，執行期模型限制 45～420 km |
| `heading` | 0～<360° |
| `translationSpeed` | Phase 4 模型限制 0～45 km/h |
| `organization`、`symmetry`、`moisture` | 0～1 |
| `structureStage` | `cluster`、`spiral`、`comma`、`eye`、`decaying` |
| `isOverLand`、`active` | boolean |
| `trackHistory` | 只含座標、風壓與權威時間索引的有界陣列 |
| `eventHistory` | 結構變更等具 `simulationMinutes`、`stepIndex` 的事件陣列 |

Phase 5 海陸事件 `type` 固定為 `LANDFALL` 或 `SEA_REENTRY`，並保存
`simulationMinutes`、`stepIndex`、`lat`、`lon`、`regionId`、
`coastSide`、`maxWind`、`centralPressure`、`galeRadius`、`heading`、
`translationSpeed`。同一表面轉換只記錄一次。

## `GridCell`

Phase 5 每個 1° cell 欄位固定為 `lat`、`lon`、`SST`、`OHC`、
`surfacePressure`、`steeringU`、`steeringV`、`verticalWindShear`、
`relativeHumidity`、`terrainHeight`、`surfaceRoughness`、`landFraction`
及 `coldWake`。數值需為有限值，比例欄位限制 0～1。U 正值向東、V 正值
向北，兩者單位為 m/s。

`coldWake` 是 0～5°C 的執行期可變狀態；`resetMutableState()` 必須把
全部 cell 歸零。其餘環境欄位仍由受控的固定步進更新。

## `Environment`

欄位固定為 `bounds`、`gridResolution`、`cells`、`subtropicalHigh`、
`southwestMonsoon`、`controls`、`targetControls`。`cells` 只能包含
`GridCell`。Phase 5 延用固定 `gridResolution = 1`，含 41×61＝2,501 cells；
任意位置採四角雙線性取樣。

`controls` 與 `targetControls` 固定包含：

- `subtropicalHighIntensity`：0～1。
- `subtropicalHighWestwardExtent`：112～150°E。
- `subtropicalHighRidgeLatitude`：20～34°N。
- `southwestMonsoonIntensity`：0～1。
- `southwestMonsoonMoisture`：0.5～0.95。
- `verticalWindShear`：0～30 m/s。

`subtropicalHigh` 鏡像實際 intensity、westwardExtent、ridgeLatitude；
`southwestMonsoon` 鏡像實際 intensity、moisture 與導引效果。滑桿只更新
target，實際 controls 依固定步進延遲反應。

## 決定性與 fingerprint

- 種子可為字串或 32-bit 整數，先經固定 FNV-1a 雜湊，再衍生
  `intensity`、`steering`、`environment`、`visual` 四子流。
- `visual` 的消耗量不得改變三個物理子流。
- 物理 fingerprint 使用排序鍵的穩定序列化與 32-bit FNV-1a，屬重現性
  識別碼，不是密碼學雜湊，也不作安全用途。

## `Level` 與規則

Phase 6 以 `validateLevel` 作為主規格允許的等效 schema 驗證。頂層固定
欄位為：

```text
schemaVersion, id, title, historicalInspiration, disclaimer,
durationHours, seed, spawn, environmentPreset, allowedControls,
objectives, bonusObjectives, failureConditions, referenceZones,
stationGroups, warningZones, oceanCoolingMultiplier,
steeringMeridionalMultiplier, scoring, tutorialMessages
```

- 未知欄位一律拒絕。
- `id` 與所有規則 ID 需唯一且為 kebab-case。
- `spawn` 必須落在地圖 bounds；風壓、半徑、方向、移速與 0～1 組織
  欄位都有有限上下限。
- `environmentPreset` 必須完整包含六個已知控制，數值在既有控制範圍內。
- `allowedControls` 只能引用六個白名單控制且不得重複。
- 所有陣列、字串及數值均有最大大小；`schemaVersion` 必須為 `1`。

Objective／Failure 規則固定欄位包含：

```text
id, label, description, metric, operator, aggregation, threshold,
subject, reference, prerequisite, duringEvent, radiusKm,
durationSteps, windowSteps, unit, once
```

metric、operator 與 aggregation 均為 enum；不得加入函式、任意屬性路徑
或可執行內容。Objective metric 與 Failure metric 白名單、第一關數值、
計分 schema 及黃金 fixture 契約詳見 `docs/LEVEL-SYSTEM.md`。

## `LevelState`

`LevelState` 保存：

- 每個目標／失敗的 current、aggregated value、progress、streak、
  completed／triggered step 及狀態。
- elapsed minutes、steps、maximum wind、minimum pressure、path length、
  maximum cold wake、各站極值與已抵達 reference zones。
- 臺灣登陸／出海岸側、登陸次數、中央山脈穿越、事件風雨與登陸前後
  強度統計。
- 各警戒區 `OUTSIDE`／`ENTERING`／`INSIDE`／`EXITING` 狀態、連續步數、
  有效進圈次數、每次峰值及事件期間站群風雨。
- 具 sequence、stepIndex、simulationMinutes 的合法控制操作。
- 最多一份不可變 result；包含 outcome、failureId、fingerprint、path、
  observations、statistics 及 score。

重啟不遷移舊 instance 的可變狀態，而是建立全新 `LevelState` 與模型
session。

## `SandboxPreset`、儲存與匯出

`SandboxPreset` 固定 18 欄，涵蓋名稱、種子、生成座標、風壓、組織／
對稱／水氣、SST、OHC、地形倍率及六個環境控制。所有數值使用既有
Typhoon、Environment 與地圖 bounds 範圍。

localStorage 固定為 version 1，頂層只能有 `version`、
`unlockedLevels`、`bestScores`、`settings`、`lastSandboxPreset` 與
`tutorialCompleted`。模擬 JSON schemaVersion 為 1，並固定記錄目前
modelVersion、PRNG 版本及 build commit。完整欄位、安全限制及 CSV／PNG
契約見 `docs/SANDBOX-EXPORT.md`。

## Schema 最低要求

每份 schema 需定義：

- `required`。
- 型別、上下限及 enum。
- 最大字串、陣列及物件大小。
- 未知欄位策略。
- `additionalProperties` 或明確 `extensions`。
- 重啟、匯入及版本遷移的預設值。

未知、過大、過深、含原型污染欄位或版本不相容的輸入必須安全拒絕，不得使用 `eval`、`Function` 或任意 HTML 執行。
