# SGTS-NH 資料 Schema
## 版本、單位與驗證規則

> **KOSMOS TOOLKIT｜探真拓知酷**

## 版本

- `schemaVersion`：資料形狀版本，第一版起始值為整數 `1`。
- `modelVersion`：模型行為版本；Phase 3 為 `0.3.0-intensity`。
- PRNG 演算法版本：`mulberry32-v1`。
- 外部匯入資料必須先驗證，再轉換成新的內部物件。

Phase 3 已建立地圖、測站、Typhoon、GridCell 與 Environment 執行期契約。
Level 或儲存 JSON Schema 仍應於其指定 Phase 建立並加入負面測試。

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

正式氣象觀測值尚未在 Phase 2 建立，測站資料不得包含寫死風雨數值。

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
| `translationSpeed` | 0～150 km/h；Phase 3 示範值為 0 |
| `organization`、`symmetry`、`moisture` | 0～1 |
| `structureStage` | `cluster`、`spiral`、`comma`、`eye`、`decaying` |
| `isOverLand`、`active` | boolean |
| `trackHistory` | 只含座標、風壓與權威時間索引的有界陣列 |
| `eventHistory` | 結構變更等具 `simulationMinutes`、`stepIndex` 的事件陣列 |

## `GridCell`

Phase 3 單一示範 cell 欄位固定為 `lat`、`lon`、`SST`、`OHC`、
`surfacePressure`、`steeringU`、`steeringV`、`verticalWindShear`、
`relativeHumidity`、`terrainHeight`、`surfaceRoughness`、`landFraction`
及 `coldWake`。數值需為有限值，比例欄位限制 0～1。Phase 3 不建立正式網格。

## `Environment`

欄位固定為 `bounds`、`gridResolution`、`cells`、`subtropicalHigh`、
`southwestMonsoon`、`controls`、`targetControls`。`cells` 只能包含
`GridCell`；Phase 3 僅用一個固定位置示範 cell，Phase 4 才建立環境網格。

## 決定性與 fingerprint

- 種子可為字串或 32-bit 整數，先經固定 FNV-1a 雜湊，再衍生
  `intensity`、`steering`、`environment`、`visual` 四子流。
- `visual` 的消耗量不得改變三個物理子流。
- 物理 fingerprint 使用排序鍵的穩定序列化與 32-bit FNV-1a，屬重現性
  識別碼，不是密碼學雜湊，也不作安全用途。

## Schema 最低要求

每份 schema 需定義：

- `required`。
- 型別、上下限及 enum。
- 最大字串、陣列及物件大小。
- 未知欄位策略。
- `additionalProperties` 或明確 `extensions`。
- 重啟、匯入及版本遷移的預設值。

未知、過大、過深、含原型污染欄位或版本不相容的輸入必須安全拒絕，不得使用 `eval`、`Function` 或任意 HTML 執行。
