# SGTS-NH 資料來源與授權
## 科學參考、地圖、素材與開發工具紀錄

> **KOSMOS TOOLKIT｜探真拓知酷**

## Phase 9 狀態

Phase 7 延續既有來源，加入 JMA 2015 與 1986 最佳路徑資料，分別作為
「護國神山」與「韋恩三進」的歷史情境參考。
公式是可解釋、可測試的教育遊戲近似，並非重現任何作業預報模型。
正式網站仍沒有第三方執行期程式碼。
Phase 8 的 localStorage 與檔案匯入匯出只使用瀏覽器標準 API，沒有新增
外部資料來源或第三方執行期套件。

Phase 9 沒有新增第三方執行期程式碼、字型或圖示。2026-08-06 依使用者
指示新增 Natural Earth II 公眾領域地形影像與 Natural Earth 1:10m 陸地
遮罩的本機衍生 WebP；網站不在執行期連線至外部圖磚服務。效能量測使用
既有 Playwright／Chrome；Safari 驗收使用系統 Safari。GitHub 官方 Actions
僅用於 CI／Pages，不進入網站 artifact。

## 目前紀錄

| 名稱 | 類型 | 發布者／來源 | 存取日期 | 用途 | 授權／狀態 |
|---|---|---|---|---|---|
| `SGTS-NH_MASTER_SPEC.md` 1.0.5 | 內部主規格 | KOSMOS TOOLKIT｜探真拓知酷 | 2026-08-06 | 產品與工程需求 | 專案內部來源 |
| Node.js Releases | 開發工具參考 | `https://nodejs.org/` | 2026-07-30 | 確認 Node.js 24 LTS | Node.js 官方資料；不部署至網站 |
| ESLint | 開發工具 | `https://eslint.org/` | 2026-07-30 | JavaScript 靜態檢查 | MIT；僅 devDependency |
| Natural Earth 1:50m coastline | 地圖向量參考 | `https://www.naturalearthdata.com/downloads/50m-physical-vectors/` | 2026-07-30 | 西北太平洋陸地輪廓參考 | Public domain；人工大幅簡化並重繪，非導航資料 |
| Natural Earth Terms of Use | 地圖授權 | `https://www.naturalearthdata.com/about/terms-of-use/` | 2026-07-30 | 確認地圖資料可修改及散布 | Public domain |
| Natural Earth II with Shaded Relief and Water 1:10m | 真實地形柵格 | `https://www.naturalearthdata.com/downloads/10m-raster-data/10m-natural-earth-2/` | 2026-08-06 | 西北太平洋島嶼與陸地地形陰影 | Public domain；下載包內版本 2.0.0；ZIP SHA-256 `d724cb6718d506e4c63c829a635bbdc88872eadfc186131c6ce252aff4beb1c7` |
| Natural Earth 1:10m Land | 真實海岸透明遮罩 | `https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-land/` | 2026-08-06 | 只保留陸地貼圖、避免遮蔽動態海洋層 | Public domain；5.1.1；ZIP SHA-256 `e547d749445eaa0964aba76738090ec88f5e63c4585122170f98c67a7ea922dc` |
| 臺灣氣象觀測要素排序集／附錄測站表 | 測站位置 | `https://www.cwa.gov.tw/Data/service/notice/download/Publish_20241021111320.pdf` | 2026-07-30 | 臺北、臺中、日月潭、花蓮、澎湖站碼、座標與高度 | 中央氣象署；專案註明出處 |
| JMA GAW station table | 測站位置 | `https://www.data.jma.go.jp/env/ozonehp/en/nmhs/station.html` | 2026-07-30 | 那霸站座標、高度與 WMO station number | Japan Meteorological Agency；專案註明出處 |
| JMA RSMC Tokyo 2018 Annual Report | 歷史情境參考 | `https://www.jma.go.jp/jma/jma-eng/jma-center/rsmc-hp-pub-eg/AnnualReport/2018/Text/Text2018.pdf` | 2026-07-30 | 確認 2018 潭美及西北太平洋歷史脈絡 | JMA 官方報告；只作靈感與來源註記 |
| JMA 2018 Trami Himawari summary | 歷史情境參考 | `https://www.jma.go.jp/jma/jma-eng/satellite/introduction/image.html` | 2026-07-30 | 確認潭美於 9 月 29～30 日接近沖繩群島 | JMA 官方資料；不匯入逐時觀測 |
| JMA RSMC Tokyo 2015 best-track graphics／annual report | 歷史情境參考 | `https://www.jma.go.jp/jma/jma-eng/jma-center/rsmc-hp-pub-eg/bstve_2015_m.html` | 2026-07-30 | 確認 2015 蘇迪勒的歷史脈絡 | JMA 官方資料；只作靈感，不匯入逐時答案 |
| JMA RSMC Tokyo 1986 best-track graphics | 歷史情境參考 | `https://www.jma.go.jp/jma/jma-eng/jma-center/rsmc-hp-pub-eg/bstve_1986_m.html` | 2026-07-30 | 確認 1986 韋恩的歷史脈絡 | JMA 官方資料；只作靈感，不宣稱三次登陸 |
| Emanuel (1988), *The Maximum Intensity of Hurricanes* | 同行評審論文 | `https://doi.org/10.1175/1520-0469(1988)045%3C1143:TMIOH%3E2.0.CO;2` | 2026-07-30 | 目標／潛在強度是環境條件上限的概念 | 僅引用科學概念；本專案未實作 E-PI 方程 |
| DeMaria (1996), *The Effect of Vertical Shear on Tropical Cyclone Intensity Change* | 同行評審論文 | `https://doi.org/10.1175/1520-0469(1996)053%3C2076:TEOVSO%3E2.0.CO;2` | 2026-07-30 | 風切抑制強度並破壞渦旋垂直結構的概念 | 僅引用科學概念 |
| Sellers et al. (1998), *The Tropical Cyclone of the Global Weather Experiment* | 同行評審綜述／觀測 | `https://www.aoml.noaa.gov/hrd/Landsea/Sellersetal_bulletinAMSJan1998.pdf` | 2026-07-30 | 生成有利條件：離赤道數度、暖海、深暖水、低風切與高溼 | NOAA/AOML 公開 PDF；僅引用概念 |
| Shay, Goni & Black (2000), *Effects of a Warm Oceanic Feature on Hurricane Opal* | 同行評審論文 | `https://www.aoml.noaa.gov/ftp/phod/goni/web/Publications/Shay.pdf` | 2026-07-30 | 海洋熱含量／暖水深度會影響增強潛勢的概念 | NOAA/AOML 公開 PDF；僅引用概念 |
| Schade (2000), *Tropical Cyclone Intensity and Sea Surface Temperature* | 同行評審論文 | `https://doi.org/10.1175/1520-0469(2000)057%3C3122:TCIASS%3E2.0.CO;2` | 2026-07-30 | 海溫供能與風暴引發冷卻形成負回饋的概念 | 僅引用科學概念 |
| Wang et al. (2004), *Assessing Impacts of Global Warming on Tropical Cyclone Tracks* | 同行評審論文 | `https://doi.org/10.1175/1520-0442(2004)017%3C1686:AIOGWO%3E2.0.CO;2` | 2026-07-30 | 颱風移動由大尺度導引與 β drift 組成 | 僅引用概念；未使用氣候預測結果 |
| Wang et al. (2000), *A Potential Vorticity Tendency Diagnostic Approach for Tropical Cyclone Motion* | 同行評審論文 | `https://doi.org/10.1175/1520-0493(2000)128%3C1899:APVTDA%3E2.0.CO;2` | 2026-07-30 | β 漂移相對導引流提供弱西向／極向偏移 | 僅引用方向與尺度概念 |
| Li & Chan (1999), *Momentum Transports Associated with Tropical Cyclone Recurvature* | 同行評審論文 | `https://doi.org/10.1175/1520-0493(1999)127%3C1021:MTAWTC%3E2.0.CO;2` | 2026-07-30 | 西北太平洋副高東退與轉向環境 | 僅引用概念 |
| Peng et al. (2012), *Developing versus Nondeveloping Disturbances for Tropical Cyclone Formation. Part II: Western North Pacific* | 同行評審論文 | `https://doi.org/10.1175/2011MWR3618.1` | 2026-07-30 | 西北太平洋季風槽、西風與信風匯流的環境概念 | 僅引用概念 |
| Tsai et al. (2009), *Maximum Covariance Analysis of Typhoon Surface Wind and Rainfall Relationships in Taiwan* | 同行評審論文 | `https://doi.org/10.1175/2008JAMC1963.1` | 2026-07-30 | 臺灣地形、風向與迎風／背風降雨差異 | 僅引用方向性概念；未使用其統計模型 |
| Huang et al. (2012), *Impacts of Typhoon Track and Island Topography on Heavy Rainfalls in Taiwan Associated with Morakot (2009)* | 同行評審論文 | `https://doi.org/10.1175/MWR-D-11-00240.1` | 2026-07-30 | 中央山脈、颱風路徑及環境流共同影響臺灣豪雨 | 僅引用概念；不重建莫拉克個案 |
| Vincent et al. (2012), *Processes Setting the Characteristics of Sea Surface Cooling Induced by Tropical Cyclones* | 同行評審論文 | `https://doi.org/10.1029/2011JC007396` | 2026-07-30 | 強度、移速與海洋狀態控制冷水尾流的方向性關係 | 僅引用概念；240 小時恢復時間為本專案遊戲參數 |
| Ma et al. (2020), *Modulation of Clouds and Rainfall by Tropical Cyclone's Cold Wakes* | 同行評審論文 | `https://doi.org/10.1029/2020GL088873` | 2026-07-30 | 冷水尾流可減少其上方雲與降雨 | 僅引用概念；雨量抑制係數為教育近似 |

本地衍生檔案：`assets/maps/northwest-pacific.json`。其 metadata 記錄
來源、Public Domain 授權、手工簡化方式、產生日期、座標順序及精度限制。

本地地形衍生檔案：`assets/maps/northwest-pacific-terrain-v1.webp` 及
`assets/maps/northwest-pacific-terrain-v1.json`。處理方式為從 16,200×8,100
等距圓柱柵格裁切東經 100°～160°、北緯 0°～40°，縮放為 2,400×1,600，
再以 2 倍解析度繪製的 1:10m 陸地多邊形建立反鋸齒透明遮罩；沒有加入國界、
行政界、地名或外部圖磚。成品 SHA-256 為
`5dcdff02060a26c87646f0c8f16b778dbcfa2eac9190fd143837d89e86d1230d`，
以 `scripts/build-terrain-raster.py`、Homebrew `uv`、Pillow 與 pyshp 重建。
影像只供視覺呈現，既有地理 JSON 仍為模擬海陸與地形判定依據。

## 後續資料登錄格式

每筆外部資料需記錄：

- 名稱、發布者及原始網址。
- 存取日期及資料版本。
- 授權或使用條款。
- 實際使用欄位或概念。
- 簡化、重新繪製或衍生方式。
- 本地檔案路徑及完整性摘要。

無法確認授權或來源的素材不得提交或部署。歷史關卡初始值若是遊戲化模型設定，必須標為模型設定，不得冒充官方逐時觀測。
