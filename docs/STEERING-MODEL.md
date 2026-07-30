# SGTS-NH Phase 4 環境與導引模型
## 1° 網格、反應延遲與教育型路徑

> **KOSMOS TOOLKIT｜探真拓知酷**

## 定位

本模型用可解釋的合成場示範副熱帶高壓、西南季風、大尺度導引及 β 漂移
如何影響颱風路徑。它不是作業預報、再分析資料或歷史路徑重建。行為版本為
`0.4.0-steering`，所有常數集中於 `js/config.js`。

## 環境網格

範圍 100～160°E、0～40°N，每 1° 建立一個 GridCell，含端點共：

```text
(160 - 100 + 1) × (40 - 0 + 1) = 2,501 cells
```

每格包含 SST、OHC、surfacePressure、steeringU、steeringV、風切、水氣、
通用地形高度、粗糙度、landFraction 及 coldWake。任意中心位置由相鄰四格
雙線性取樣。Phase 4 的 SST／OHC 是合成緯度梯度；陸地高度只是 120 m
placeholder，精細臺灣地形屬 Phase 5。

## 玩家控制與反應延遲

控制項只改變目標值。每個實際值以固定步進指數逼近：

```text
responseFraction = 1 - exp(-stepHours / responseHours)
actual += (target - actual) × responseFraction
```

| 控制 | 範圍 | τ |
|---|---:|---:|
| 副高強度 | 0～1 | 12 h |
| 副高西伸邊界 | 112～150°E | 18 h |
| 副高脊線緯度 | 20～34°N | 18 h |
| 西南季風強度 | 0～1 | 9 h |
| 西南季風水氣 | 0.5～0.95 | 9 h |
| 垂直風切 | 0～30 m/s | 6 h |

UI 顯示目標、實際、↑／↓／→ 趨勢及 τ。`ControlPanel` 不接收 Typhoon，
因此無法直接修改座標。

## 合成環境場

每格先計算背景風，再加入副高與季風：

```text
environmentU = backgroundU + highU + monsoonU + fixedGridNoiseU
environmentV = backgroundV + highV + monsoonV + fixedGridNoiseV
```

- 副高強且西伸、颱風位於脊線南側時，增加負 U（偏西）。
- 副高西界東退、中心位於西側缺口時，逐步增加正 U 與正 V，形成較易轉向
  的教育型場。
- 西南季風增加正 U／正 V，並依強度與水氣目標提高 relativeHumidity。
- surfacePressure 以副高橢圓與季風槽距離產生合成等壓場。

這些是平滑、單調且可測試的遊戲函式，不求解動量方程或實際壓力梯度風。

## 導引與 β 漂移

```text
targetVector =
  GridCell steering
  + betaDrift
  + seededSteeringPerturbation
```

U 正值向東、V 正值向北，單位 m/s。Phase 4 的 β drift 為
`U = -0.45 m/s`、`V = +0.65 m/s`，只提供弱西北偏移，不得掩蓋主要場。
每步 steering 擾動上限 ±0.14 m/s，來自 `steering` PRNG 子流。

目前移動向量朝 target 以 τ＝3 小時反應，避免滑桿後瞬間轉向：

```text
actualVector += (targetVector - actualVector)
                × (1 - exp(-stepHours / 3h))
```

## 速度、方向與位移

```text
speedKmh = min(hypot(U, V) × 3.6, 45)
heading = degrees(atan2(U, V)) normalized to 0～360
distanceKm = speedKmh × stepHours
```

其中 0° 為北、90° 為東。新位置使用球面 destination-point 公式，不用
Canvas pixel 推進。每步路徑再切成最多 3 km 的子段；每個子段都可和 land
polygon 交會，避免高速步進跳過狹窄島嶼。Phase 4 只回報穿越 region ID，
Phase 5 才依子段海陸比例積分並發送登陸／出海事件。

到達模擬 bounds 時端點會限制在邊界並回報 `boundaryReached`。正式離界
失敗條件屬後續關卡 Phase。

## 顯示一致性

- 白色場箭頭直接讀取 GridCell `steeringU/V`。
- 黃色 `NEXT` 箭頭直接讀取 SteeringModel 當步 `actualVector`。
- Canvas Y 軸向下，因此顯示轉換固定為 `dx = U × scale`、
  `dy = -V × scale`；不改變物理向量。

## 量化校準情境

固定種子、15°N／135°E、48 模擬小時：

| 情境 | 自動驗收 |
|---|---|
| 強副高、112°E 西伸、弱季風 | 終點經度 <126°E，末端 U <−5 m/s |
| 副高東退至 150°E | 終點 >18°N 且 >135°E，末端 U>0、V>2 m/s |
| 強季風／高水氣 | U、V 各比弱季風高 >2 m/s；RH 高 >0.1 |

另驗證控制非瞬時、45 km/h 上限、同種子及同操作同路徑 fingerprint、
β drift 非零、3 km 分段可偵測窄島及顯示向量方向一致。

## 科學概念與限制

- 大尺度環境導引與 β drift 的分離參考 Wang et al. (2004)。
- β drift 的弱西向／極向偏移概念參考 Wang et al. (2000)。
- 副高東退與西北太平洋轉向環境參考 Li & Chan (1999)。
- 西北太平洋季風槽與低層西風環境參考 Peng et al. (2012)。

詳細書目見 `docs/SOURCES.md`。

已知限制：

- 不計算垂直加權 steering layer、渦旋大小對 β drift 的回饋或中緯度槽。
- 副高與季風槽是解析型圖形，不是觀測或數值模式資料。
- 不含 Fujiwhara interaction、陸地事件、地形偏折或海氣耦合。
- 同版本／種子／操作可重現不等於對真實颱風有預報能力。
