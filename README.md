# 風暴創世神：北半球颱風模擬器
## Storm Genesis: Northern Hemisphere Typhoon Simulator（SGTS-NH）

> **KOSMOS TOOLKIT｜探真拓知酷**

SGTS-NH 是以西北太平洋熱帶氣旋為第一版場景的互動式科學教育模擬專案。正式成品將以純靜態 HTML、CSS、ES Modules、Canvas 2D 與 JSON 在 GitHub Pages 執行。

## 專案資訊

| 項目 | 內容 |
|---|---|
| 第一版 | 西北太平洋篇 |
| GitHub owner | `kisaraki` |
| Repository | `classroom-sgts-nh-tzk` |
| Repository URL | `https://github.com/kisaraki/classroom-sgts-nh-tzk` |
| GitHub Pages 預定網址 | `https://kisaraki.github.io/classroom-sgts-nh-tzk/` |
| 主規格 | `SGTS-NH_MASTER_SPEC.md` 1.0.1 |
| 目前階段 | Phase 4：環境網格與導引氣流（completed，待批准） |

> 本系統為科學教育與遊戲化模擬工具，使用簡化模型呈現熱帶氣旋概念，不適用於真實天氣預報、防災決策、航海、航空或任何安全關鍵用途。實際颱風資訊請以官方氣象機構發布為準。

## 正式執行環境

- GitHub Pages 靜態網站。
- 現代桌面與平板瀏覽器。
- 不使用 Node.js 後端、資料庫、登入或秘密 API 金鑰。
- 所有正式資源支援 `/classroom-sgts-nh-tzk/` 子路徑。

Node.js 與 npm 只用於本機開發、測試及未來 GitHub Actions；正式網站不依賴 Node.js。

## 本機工具

本專案固定使用 Node.js 24 LTS 與 npm 11。macOS 以 Homebrew 提供 keg-only `node@24`：

```sh
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
npm ci
```

常用指令：

```sh
npm run lint
npm run test:unit
npm run test:integration
npm run test:scenario
npm run test:e2e
npm run check
npm run serve
```

Phase 1 已提供：

- BOOT、MENU、TUTORIAL、RUNNING、PAUSED、VICTORY、FAILURE、ERROR 狀態。
- 每步 10 模擬分鐘的累積器固定步進，支援暫停及 1×／4×／12×／24×。
- 畫格時間截斷、單畫格補算上限及隱藏分頁停止累積。
- 高 DPI Canvas 診斷視窗（devicePixelRatio 上限 2）。
- 桌面三區、平板上下排列及窄螢幕提示。
- Node 單元／整合測試、瀏覽器 harness、實際 Chrome E2E 與 GitHub Actions
  測試 workflow。

Phase 1 當時尚未實作地圖、座標、颱風物理、導引氣流、關卡及沙盒。

Phase 2 新增：

- 100°E～160°E、0°N～40°N 西北太平洋教育用簡化地圖。
- 經緯度／Canvas 雙向轉換、Haversine、方位角、目的地推算。
- polygon 海陸判定、邊界視為陸地及移動線段跨陸地檢查。
- 臺灣四岸 `coastSide` 與 16 個穩定 `regionId`。
- 那霸、臺北、臺中、日月潭、花蓮及澎湖測站位置。
- 點選／觸控地圖查詢座標、海陸、最近測站與距離。

Phase 3 新增：

- 完整 `Typhoon`、`GridCell`、`Environment` 資料契約與歷史紀錄。
- 固定版本 `mulberry32-v1` PRNG，以及物理／視覺隔離子流。
- 海溫、海洋熱含量、低緯度組織限制、風切、水氣、海陸、地形與冷水尾流因子。
- 有時間反應與單步上限的強度、氣壓、暴風半徑與結構遲滯。
- cluster、spiral、comma、eye、decaying 五種 Canvas 表現。
- 強度／環境因子儀表板及可獨立關閉的純視覺粒子。

Phase 4 新增：

- 覆蓋 100°E～160°E、0°N～40°N 的 2,501 個 1° `GridCell`。
- SST、OHC、氣壓、U／V 導引、風切、水氣、海陸、粗糙度及冷水尾流欄位。
- 背景風、副高、西南季風、β 漂移與具種子微擾的向量合成。
- 副高強度／西伸／脊線、季風強度／水氣及風切的目標控制與反應延遲。
- 0～45 km/h 平滑移動、球面座標換算及每段至多 3 km 的路徑分割。
- 海溫底圖、等壓線、副高範圍、季風槽、環境箭頭與短期方向箭頭。

精細地形、登陸／出海事件、動態冷水尾流、降雨、關卡及沙盒尚未實作。

本機預覽：

```text
http://127.0.0.1:4173/
http://127.0.0.1:4173/classroom-sgts-nh-tzk/
```

## Phase 制度

- 一次只能執行一個 Phase。
- Phase 完成後狀態為 `completed`，不等於使用者批准。
- 未取得使用者明確批准，不得進入下一 Phase。
- Push、GitHub 設定及 Pages 部署另受主規格的外部操作授權約束。

詳情請閱讀 `SGTS-NH_MASTER_SPEC.md` 與 `docs/PHASE-STATUS.md`。

## 授權與來源

專案程式碼預定採 MIT License。外部資料、地圖、圖示、字型及素材依各自授權記錄於 `docs/SOURCES.md`。

---

© KOSMOS TOOLKIT｜探真拓知酷<br>
SGTS-NH · Educational Simulation · Not for Forecasting
