# SGTS-NH 資料來源與授權
## 科學參考、地圖、素材與開發工具紀錄

> **KOSMOS TOOLKIT｜探真拓知酷**

## Phase 2 狀態

Phase 2 加入經人工簡化重繪的 Natural Earth 海岸線，以及 CWA／JMA
公開測站位置。正式網站仍沒有第三方執行期程式碼。

## 目前紀錄

| 名稱 | 類型 | 發布者／來源 | 存取日期 | 用途 | 授權／狀態 |
|---|---|---|---|---|---|
| `SGTS-NH_MASTER_SPEC.md` 1.0.1 | 內部主規格 | KOSMOS TOOLKIT｜探真拓知酷 | 2026-07-30 | 產品與工程需求 | 專案內部來源 |
| Node.js Releases | 開發工具參考 | `https://nodejs.org/` | 2026-07-30 | 確認 Node.js 24 LTS | Node.js 官方資料；不部署至網站 |
| ESLint | 開發工具 | `https://eslint.org/` | 2026-07-30 | JavaScript 靜態檢查 | MIT；僅 devDependency |
| Natural Earth 1:50m coastline | 地圖向量參考 | `https://www.naturalearthdata.com/downloads/50m-physical-vectors/` | 2026-07-30 | 西北太平洋陸地輪廓參考 | Public domain；人工大幅簡化並重繪，非導航資料 |
| Natural Earth Terms of Use | 地圖授權 | `https://www.naturalearthdata.com/about/terms-of-use/` | 2026-07-30 | 確認地圖資料可修改及散布 | Public domain |
| 臺灣氣象觀測要素排序集／附錄測站表 | 測站位置 | `https://www.cwa.gov.tw/Data/service/notice/download/Publish_20241021111320.pdf` | 2026-07-30 | 臺北、臺中、日月潭、花蓮、澎湖站碼、座標與高度 | 中央氣象署；專案註明出處 |
| JMA GAW station table | 測站位置 | `https://www.data.jma.go.jp/env/ozonehp/en/nmhs/station.html` | 2026-07-30 | 那霸站座標、高度與 WMO station number | Japan Meteorological Agency；專案註明出處 |

本地衍生檔案：`assets/maps/northwest-pacific.json`。其 metadata 記錄
來源、Public Domain 授權、手工簡化方式、產生日期、座標順序及精度限制。

## 後續資料登錄格式

每筆外部資料需記錄：

- 名稱、發布者及原始網址。
- 存取日期及資料版本。
- 授權或使用條款。
- 實際使用欄位或概念。
- 簡化、重新繪製或衍生方式。
- 本地檔案路徑及完整性摘要。

無法確認授權或來源的素材不得提交或部署。歷史關卡初始值若是遊戲化模型設定，必須標為模型設定，不得冒充官方逐時觀測。
