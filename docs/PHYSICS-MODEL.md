# SGTS-NH 簡化物理模型
## 教育模型原則與實作契約

> **KOSMOS TOOLKIT｜探真拓知酷**

## Phase 8 狀態

Phase 7 沿用完整物理管線，於測站觀測後才記錄關卡統計與判定勝敗。
三關共用相同模型與規則 resolver，不複製關卡專屬模擬器。關卡資料可
明示調整海洋冷卻倍率與非季風南北導引倍率；西南季風分量仍完整保留。
這些是可驗證的遊戲校準，不是歷史物理常數。強度公式見
`docs/INTENSITY-MODEL.md`；環境、控制延遲、導引、β 漂移、座標位移及
分段限制見 `docs/STEERING-MODEL.md`；Phase 5 完整公式、積分順序及限制
見 `docs/LAND-RAIN-MODEL.md`；關卡契約見 `docs/LEVEL-SYSTEM.md`。

Phase 8 沙盒不另建物理模型。SST、OHC 與地形倍率從受驗證 preset 注入
既有 Environment／LandInteractionModel；預設參數為原值，因此三關
黃金重播不變。新增的是可設定介面與 I/O 契約，模型行為版本仍為
`0.7.0-taiwan-wayne`。

## 模型定位

SGTS-NH 是可解釋的科學教育模型，不是作業級數值天氣預報模式。模型結果不得用於真實天氣預報、防災、航海、航空或其他安全關鍵決策。

第一版需說明但不宣稱完整求解：

- 低緯度科氏組織效率。
- 海表溫度與遊戲化海洋熱含量。
- 垂直風切、水氣及結構。
- 太平洋副熱帶高壓、西南季風與 β 漂移。
- 海陸、臺灣地形、冷水尾流、降雨及測站觀測。

## 參數分類

常數分為：

```text
physicalConstants
modelParameters
gameBalance
renderingConfig
performanceConfig
```

Phase 5 已依上述分類集中在 `js/config.js`，並新增
`landInteractionConfig`、`oceanCoolingConfig`、`rainfallConfig` 與
`observationConfig`。不得為讓單一關卡通過而直接
修改 `physicalConstants`。

## 每個模型的必要記錄

| 項目 | 必要內容 |
|---|---|
| 輸入 | 欄位、單位、合法範圍 |
| 輸出 | 欄位、單位、合法範圍 |
| 公式 | 完整公式或可追蹤偽程式碼 |
| 常數 | 名稱、預設值、最小值、最大值 |
| 時間尺度 | 反應時間與 10 分鐘步進換算 |
| 氣象概念 | 欲呈現的教育概念 |
| 遊戲化簡化 | 與真實大氣的差異 |
| 校準情境 | 種子、初始條件、時長、預期範圍 |
| 已知限制 | 不可用於何種推論 |

## 強制不變量

- 科氏效應不得直接當作風速加成。
- 海溫不得單獨決定強度。
- 強度不得以每步固定增量實作。
- 所有因子及輸出必須限制於 schema 範圍。
- 物理模組不得直接使用 `Math.random()`。
- 粒子、畫質、FPS 與 Canvas resize 不得改變物理結果。
- 地形作用、雨量及冷水尾流必須依固定模擬時間積分。

## 實作 Phase

| 模型 | 預定 Phase |
|---|---|
| 固定時間步進 | Phase 1 |
| 座標及海陸幾何 | Phase 2 |
| 強度、氣壓、半徑及結構 | Phase 3 |
| 環境網格及導引 | Phase 4 |
| 地形、冷水尾流、降雨及測站 | Phase 5 |
| 通用關卡統計、目標／失敗與結算 | Phase 6 |
| 護國神山、韋恩三進及事件狀態校準 | Phase 7 |

已實作模型文件：

- `docs/INTENSITY-MODEL.md`
- `docs/STEERING-MODEL.md`
- `docs/LAND-RAIN-MODEL.md`
- `docs/LEVEL-SYSTEM.md`
