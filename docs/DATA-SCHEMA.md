# SGTS-NH 資料 Schema
## 版本、單位與驗證規則

> **KOSMOS TOOLKIT｜探真拓知酷**

## 版本

- `schemaVersion`：資料形狀版本，第一版起始值為整數 `1`。
- `modelVersion`：模型行為版本；Phase 0 為 `0.0.0-foundation`。
- PRNG 演算法版本：自 Phase 3 起記錄。
- 外部匯入資料必須先驗證，再轉換成新的內部物件。

Phase 0 尚未建立正式 Typhoon、Environment、Level 或儲存 JSON Schema；各模型於其指定 Phase 建立時必須同步加入 schema 與負面測試。

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

## Schema 最低要求

每份 schema 需定義：

- `required`。
- 型別、上下限及 enum。
- 最大字串、陣列及物件大小。
- 未知欄位策略。
- `additionalProperties` 或明確 `extensions`。
- 重啟、匯入及版本遷移的預設值。

未知、過大、過深、含原型污染欄位或版本不相容的輸入必須安全拒絕，不得使用 `eval`、`Function` 或任意 HTML 執行。
