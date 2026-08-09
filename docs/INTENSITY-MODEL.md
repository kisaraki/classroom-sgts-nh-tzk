# SGTS-NH Phase 3 強度模型
## 可解釋的教育遊戲近似

> **KOSMOS TOOLKIT｜探真拓知酷**

## 定位

本模型用固定位置的合成颱風示範環境如何限制組織與強度。它不是數值天氣
預報、統計作業模式、警報產品或歷史重建，不可用於真實決策。所有常數都在
`js/config.js`，行為版本為 `0.3.0-intensity`。

## 輸入與輸出

每個固定 10 分鐘步進輸入：

- `Typhoon`：目前風速、組織度、對稱度、水氣、結構及位置。
- `GridCell`：SST、OHC、風切、相對溼度、地形、海陸比例與冷水尾流。
- 具版本種子的 `intensity` PRNG 子流。

輸出：

- `maxWind`、`centralPressure`、`galeRadius`。
- `organization`、`symmetry`、`moisture`、`structureStage`、`active`。
- 每個環境因子、發展潛勢、目標風速與物理 fingerprint。

## 因子與發展潛勢

每個因子限制在 0～1。門檻之間採 cubic smoothstep，避免硬跳變：

```text
heat                 = smoothstep(SST_min, SST_full, SST - coldWake)
oceanDepth           = smoothstep(0, OHC_full, OHC)
coriolisOrganization = smoothstep(latitude_min, latitude_full, abs(lat))
shear                = 1 - smoothstep(shear_low, shear_full, verticalWindShear)
moisture             = smoothstep(RH_min, RH_full, relativeHumidity)
land                 = 1 - landFraction × landPenaltyMaximum
terrain              = 1 - normalizedTerrain × landFraction
coldWake             = 1 - smoothstep(0, coldWakeFull) × coldWakePenaltyMaximum
structure            = structureFloor + (1 - structureFloor) × organization

developmentPotential = clamp(product(all factors), 0, 1)
```

`coriolisOrganization` 只表示赤道附近難以建立有組織的旋轉；它和其他因子
一起限制潛勢，絕不是額外加到風速上的能量。

## 強度時間反應

```text
targetWind =
  minimumWind + (maximumWind - minimumWind) × developmentPotential

rawWindChange =
  (targetWind - currentWind) / intensityResponseHours × stepHours
  + seededSmallPerturbation × stepHours

windChange = clamp(
  rawWindChange,
  -maximumDecreasePerStep,
  +maximumIncreasePerStep
)
```

新風速再限制於 5～85 m/s。這讓暖海低風切情境逐步增強，而不是在一個步進
跳到目標；不利環境同樣逐步減弱。組織度、對稱度、水氣及暴風半徑各自用
response time 朝目標漸近。

中心氣壓是風速比率的有界非線性映射，再由組織度微調壓降，限制在
880～1010 hPa。暴風半徑由風速及結構係數產生目標，再平滑限制於
45～420 km。兩者都是遊戲化診斷值，不是觀測反演。

## 結構與遲滯

結構依序表現為 `cluster`、`spiral`、`comma`、`eye`，不利且偏弱時為
`decaying`。每個升級與降級門檻不同，例如 comma 進入 eye 所需門檻高於
eye 退回 comma 的門檻。這個遲滯區可吸收臨界值的小幅擾動，避免逐步抖動。

Canvas 對五種狀態使用不同輪廓，並在物理半徑換算後套用只讀生命史視覺
尺度：成熟結構較完整，衰減及 `active=false` 明顯縮小與淡化。這個像素
半徑不是新的物理暴風半徑，也不回寫模型。北半球粒子以負 Canvas 角速度
呈逆時針；粒子仍只是外觀。關閉粒子、改變粒子消耗量或以不同 FPS 渲染，
不得改變物理狀態。

## 校準情境

| 情境 | 36 小時內預期 |
|---|---|
| 1°N、暖海、低風切 | 不快速成熟，組織度維持低值，不進入 eye |
| 15°N、暖海、低風切 | 漸進增強，仍受 response time 與單步上限限制 |
| 15°N、高風切 | 對稱度顯著下降，不進入 eye |
| 15°N、低 SST | 逐步減弱，不瞬間歸零 |

自動測試另驗證上下限、相同種子與 fingerprint、粒子隔離、60／120 FPS
固定步數一致及遲滯不抖動。

## 科學概念與簡化

- 最大／潛在強度概念參考 Emanuel (1988)，但本專案沒有實作完整 E-PI。
- 風切抑制與渦旋傾斜概念參考 DeMaria (1996)。
- 暖海、深暖水層、離赤道數度、低風切與高溼等生成條件參考
  Sellers et al. (1998) 的整理。
- OHC／暖水深度參考 Shay, Goni & Black (2000)；SST 與冷卻負回饋概念
  參考 Schade (2000)。

詳細書目與原始連結見 `docs/SOURCES.md`。

## 已知限制

- Phase 3 中心固定，不含正式導引氣流、β drift 或環流互動。
- 使用單一 cell，沒有環境網格內插、時間變化或動態冷水尾流。
- 未計算大氣垂直剖面、CAPE、交換係數、邊界層、眼牆置換或海氣耦合。
- 風壓與半徑不對應任何官方風暴分類或作業估計法。
- PRNG 擾動刻意很小，只用來驗證可重現的遊戲變化，不代表預報不確定度。
