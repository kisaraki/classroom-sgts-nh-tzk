# SGTS-NH 海陸、冷水尾流與降雨模型
## Phase 5 教育模型契約與限制

> **KOSMOS TOOLKIT｜探真拓知酷**

## 模型定位

本文件記錄 `0.5.0-land-rain` 的海陸分段、臺灣地形、冷水尾流、降雨及
測站觀測模型。這些公式是為了讓因果關係可見、可測試的教育遊戲近似，
不是數值天氣預報、地形解析或測站預報產品。

每一固定步代表 10 模擬分鐘，單步執行順序固定為：

```text
Environment.update
  → SteeringModel（移動及 ≤3 km pathPoints）
  → LandInteractionModel（0.5 km 再取樣、事件、陸地損耗）
  → OceanCoolingModel（全網格恢復及尾流累積）
  → IntensityModel（使用分段海陸 cell 及再組織係數）
  → ObservationModel（六站風、陣風、雨率及累積雨量）
```

## 臺灣教學地形

`getTerrainProfile` 先以地圖 polygon 判定海陸，再以相對於一條解析式
臺灣山脊線的經度差分區。它不是 DEM，不能推論真實山高或局地風雨。

| 區域 enum | 高度 | 粗糙度 | 雨量坡向 |
|---|---:|---:|---|
| `west-plain` | 120 m | 0.58 | west |
| `central-mountains` | 2,600 m | 0.82 | west／east |
| `east-rift-valley` | 350 m | 0.48 | valley |
| `coast-range` | 1,200 m | 0.68 | east |
| `generic-land` | 120 m | 0.42 | flat |
| `ocean` | 0 m | 0.03 | flat |

## 海陸分段與事件

移動路徑每 0.5 km 取樣，最多 96 點；相鄰點的中點決定該小段地形。

```text
landFraction = landDistance / totalDistance
landHours = stepHours × landFraction
terrainHeight = Σ(height × landDistance) / landDistance
surfaceRoughness = Σ(roughness × landDistance) / landDistance
```

因此同一個 10 分鐘步進可同時包含海洋與陸地，不會把整步粗略地歸到終點。
海陸狀態改變時只記錄一次 `LANDFALL` 或 `SEA_REENTRY`；事件含
`simulationMinutes`、`stepIndex`、`lat`、`lon`、`regionId`、
`coastSide`、風速、氣壓、半徑、移向及移速。模型本身的轉換序號與
EventBus dedupe key 防止同一轉換重複發送。

## 陸地損耗與出海再組織

先定義：

```text
terrainSeverity = clamp(terrainHeight / 2600, 0, 1)
roughnessSeverity = clamp(surfaceRoughness, 0, 1)

windLoss =
  1.65 m/s/h × landHours
  × (0.35 + 0.65 × terrainSeverity)
  × (0.65 + 0.35 × roughnessSeverity)

organizationLoss =
  0.055 /h × landHours × (0.4 + 0.6 × terrainSeverity)

symmetryLoss =
  0.08 /h × landHours × (0.4 + 0.6 × terrainSeverity)
```

出海後的強度發展因子由 0.35 線性恢復，9 小時回到 1：

```text
reorganizationFactor =
  0.35 + 0.65 × clamp(hoursSinceSeaReentry / 9, 0, 1)
```

## 冷水尾流

每個海洋 `GridCell` 先以 240 小時時間常數指數恢復，再對中心周圍施加
冷卻。作用半徑為 `max(70 km, galeRadius)`，不是只改中心格。

```text
intensity = clamp((maxWind - 5) / (50 - 5), 0, 1)
slowMotion = 1 / (1 + translationSpeed / 12)
shallowOcean = 1 - 0.65 × OHC
thermalHeadroom = clamp((SST - 22) / 8, 0, 1)
radial = 1 - (distance / coverageRadius)²

coolingPotential =
  intensity² × slowMotion × shallowOcean
  × (0.5 + 0.5 × thermalHeadroom)

ΔcoldWake =
  0.34 °C/h × stepHours × coolingPotential × radial
```

`coldWake` 限制在 0～5°C，有效 SST 不低於 22°C。較強、較慢的風暴在
相同海洋條件下必須產生較大的尾流；高 OHC 則降低冷卻。240 小時為遊戲
時間尺度，並非宣稱所有真實尾流都以相同速度恢復。

## 降雨與地形

測站雨率由颱風距離、環境溼度、強度、季風、結構對稱、冷水尾流及地形
共同決定：

```text
rainRate =
  clamp(
    60 mm/h
    × radial × moisture × intensity × monsoon
    × terrain × asymmetry × coldWake,
    0,
    60 mm/h
  )
```

- 雨區半徑為 `max(120 km, galeRadius × 2.2)`。
- `steeringU > 0` 的偏東風使西坡為迎風面；`steeringU < 0` 的偏西風使
  東坡為迎風面。
- 中央山脈迎風增幅上限 2.2，背風雨影下限 0.42；東部縱谷只有小幅修正。
- 西南季風最多加成 45%；冷水尾流最多抑制 35% 雨率。

這套坡向判斷只用低層 U／V 與解析式地形，未解析環流、對流胞、颱風移向
四象限、垂直運動或實際地形。

## 測站觀測與積分

六個 `WeatherStation` 執行期物件由 Phase 2 的位置、海拔與 exposure
建立。持續風依中心距離、暴風半徑、最大風速、暴露度及地形遮蔽計算；
陣風為持續風乘 1.32 及小幅粗糙度修正。輸出上限分別為 75 m/s 與
95 m/s。

累積雨量只依固定模擬時間積分：

```text
accumulatedRain(next) =
  accumulatedRain(current) + hourlyRainRate × stepMinutes / 60
```

因此 10 分鐘步進精確使用當步雨率的六分之一，不依 FPS 或倍速改變。

## 重啟契約

「重啟」會重建整個模擬 session，回到 `MENU`、step 0，並清除：

- 所有網格的 `coldWake`。
- 六站持續風、陣風、當前雨率與累積雨量。
- LANDFALL／SEA_REENTRY 歷史與 dedupe 狀態。
- 模擬時鐘、颱風歷史、粒子及診斷值。

## 校準與驗收情境

- 相同路徑跨越狹島時只產生一組登陸／出海事件。
- 同一小時內，完整陸地步進的風速、組織與對稱損失大於部分陸地步進。
- 出海後再組織係數由 0.35 單調回復至 1。
- 相同 OHC 下，強且慢的風暴尾流大於弱且快的風暴。
- 迎風坡雨量因子大於背風坡；10 分鐘雨量積分等於雨率除以 6。
- 重啟後所有可變尾流、測站與事件狀態皆為零。

## 科學依據與已知限制

臺灣中央山脈與風場可造成迎風／背風降雨差異；強度、移速與海洋上層熱
狀態會影響風暴冷卻海洋的幅度，而冷水尾流也可調制後續雲雨。Phase 5
只保留這些方向性概念；係數、解析式地形、1° 網格、單層 OHC、尾流恢復
及測站換算均是專案自己的教學近似。

科學參考與連結統一登錄於 `docs/SOURCES.md`。本模型不可用來重建歷史
個案、預測單站雨量、發布警報，或與官方觀測做作業級比較。
