# SGTS-NH 測試策略
## 需求追蹤、測試分類與驗收證據

> **KOSMOS TOOLKIT｜探真拓知酷**

## 工具鏈

- Node.js 24 LTS。
- npm 11。
- ESLint。
- Node.js 內建 `node:test`。
- Playwright 1.62.0，以本機實際 Google Chrome 執行 Phase 1～2 E2E；CI
  定義使用 Chromium。
- WebKit 模擬不得冒充實際 Safari 或 iPadOS。

## 指令

```sh
npm run lint
npm run test:unit
npm run test:integration
npm run test:scenario
npm run test:e2e
npm run check
npm run serve
```

Phase 2：

- `test:unit` 除既有基礎外，驗證座標、測地線、polygon、segment、
  地圖 metadata／負面驗證、海陸、測站及 resize click。
- `test:integration` 驗證引擎固定步進、Pages 子路徑靜態服務，以及
  地圖 JSON MIME／版本。
- `test:scenario` 尚不適用，指令會明確回報。
- `test:e2e` 驗證實際 Chrome 操作、平板／窄螢幕、靜態 browser
  harness、地圖載入、臺灣海陸查詢及 resize 後座標穩定。

## Phase 0 需求追蹤

| Requirement ID | 需求 | Phase | 測試／證據 | 狀態 |
|---|---|---|---|---|
| GOV-PHASE-001 | 一次只執行一個 Phase | 0 | `PHASE-STATUS.md`、完成報告 | passed |
| GOV-BRAND-001 | 品牌字串完全一致 | 0 | `foundation.test.js` | passed |
| GOV-REPO-001 | owner/repository 正確 | 0 | `foundation.test.js`、remote 查詢 | passed |
| WEB-FOUNDATION-001 | 最小頁面顯示身份與聲明 | 0 | `foundation.test.js`、browser smoke | passed |
| DEPLOY-PAGES-001 | 支援 Pages 子路徑 | 0 | `foundation-smoke.test.js` | passed |
| TOOL-NODE-001 | Node 24 LTS、npm lock 可重現 | 0 | 版本輸出、`npm ci` | passed |
| DOC-FOUNDATION-001 | 主要文件存在且一致 | 0 | `foundation.test.js`、人工檢查 | passed |
| GIT-HYGIENE-001 | AppleDouble 等不得提交 | 0 | `.gitignore`、`git check-ignore` | passed |

完成 Phase 0 時將狀態更新為 `passed`、`failed`、`not_run` 或 `not_applicable`。

## Phase 1 需求追蹤

| Requirement ID | 需求 | 測試／證據 | 狀態 |
|---|---|---|---|
| ENG-STATE-001 | 八種狀態及合法／非法轉換 | `state-machine.test.js` | passed |
| ENG-CLOCK-001 | 10 分鐘固定步進、60／120 Hz 一致 | `simulation-clock.test.js` | passed |
| ENG-CLOCK-002 | 暫停、倍速、delta 截斷及補算上限 | clock／engine tests | passed |
| ENG-VIS-001 | 隱藏時停止 update/render，切回不補算 | clock／engine tests | passed |
| ENG-EVENT-001 | 同一步操作及事件順序穩定 | event／integration tests | passed |
| UI-CANVAS-001 | Canvas resize 與 DPR 上限 2 | `canvas-viewport.test.js` | passed |
| UI-RESPONSIVE-001 | 桌面三區、平板堆疊、窄螢幕提示 | Chrome E2E、Browser smoke | passed |
| UI-TOUCH-001 | 觸控目標至少 44 px | Chrome E2E | passed |
| DEPLOY-PAGES-001 | 相對路徑及 Pages 子路徑 | foundation／integration／E2E | passed |
| CI-TEST-001 | 最小權限 test workflow 定義 | `workflow.test.js` | passed locally |

## 瀏覽器與外部環境矩陣

| 環境 | Phase 2 狀態 | 說明 |
|---|---|---|
| Node HTTP smoke | passed | Pages 子路徑、ES Module 及 map JSON MIME／版本正確 |
| Codex in-app Browser | passed | 16 regions、測站、臺灣／海洋查詢、Canvas 目視 |
| 實際 Chrome | passed | 150.0.7871.187；4 個 Playwright E2E、Console error 0 |
| 自動 Chromium | not_run | workflow 已定義但未 push；本機 E2E 指定實際 Chrome |
| 實際 Edge | not_verified | 本機未安裝 |
| 實際 macOS Safari | not_run | Phase 9 必要實機驗證 |
| 實際 iPadOS Safari | not_verified | 目前無實體裝置證據 |
| GitHub Actions | not_run | test workflow 已建立；未獲 push 授權 |
| GitHub Pages | not_deployed | Phase 9 前不得部署 |
| 公開網站 | not_verified | Pages 尚未部署 |

## Phase 2 需求追蹤

| Requirement ID | 需求 | 測試／證據 | 狀態 |
|---|---|---|---|
| GEO-BOUNDS-001 | 100°E～160°E、0°N～40°N 及四角 | geo／data tests | passed |
| GEO-CONVERT-001 | 經緯度／Canvas 雙向與 round trip | `geo.test.js` | passed |
| GEO-GEODESY-001 | Haversine、方位角、目的地推算 | `geo.test.js`、browser harness | passed |
| GEO-POLYGON-001 | point、邊界、頂點、segment 交會 | geo／data tests | passed |
| GEO-LAND-001 | 臺灣內部為陸、東側海面為海 | `geography-data.test.js`、E2E | passed |
| GEO-DATA-001 | 來源、授權、版本、簡化及唯一 regionId | data／negative tests | passed |
| GEO-COAST-001 | 臺灣 east／west／north／south | `geography-data.test.js` | passed |
| GEO-STATION-001 | 六站唯一且在範圍內 | `geography-data.test.js` | passed |
| GEO-POINTER-001 | resize 後點選位置不偏移 | renderer／geo tests、Chrome E2E | passed |
| DEPLOY-PAGES-002 | map JSON 可由 Pages 子路徑載入 | integration／Chrome E2E | passed |

## Phase 2 實際結果

- 完成時間：2026-07-30T19:25:29+08:00。
- Node.js：24.18.1 LTS；npm：11.16.0。
- `npm ci`：通過；audit 74 個套件，0 vulnerabilities。
- ESLint：通過，0 errors、0 warnings。
- 單元測試：44 passed、0 failed。
- 整合測試：2 passed、0 failed。
- 情境測試：Phase 2 不適用。
- 實際 Chrome E2E：4 passed、0 failed；包含 Pages 子路徑 map fetch、
  臺灣點選及 390 px resize 後座標。
- Browser harness：4/4 passed。
- Browser smoke：16 regions 與 6 測站可見；預設臺灣查詢為
  `taiwan-main`、最近日月潭 22.2 km；點選中央海域切換為海洋並重算最近站。
- GitHub Actions：未執行。
- GitHub Pages API／部署：未執行／未部署。
- 公開網站：未驗證。

## Phase 1 實際結果

- 完成時間：2026-07-30T19:06:41+08:00。
- Node.js：24.18.1 LTS；npm：11.16.0。
- `npm install`：通過；audit 74 個套件，0 vulnerabilities。
- ESLint：通過，0 errors、0 warnings。
- 單元測試：25 passed、0 failed。
- 整合測試：2 passed、0 failed。
- 情境測試：Phase 1 不適用。
- 實際 Chrome E2E：3 passed、0 failed。
- Browser harness：3/3 passed。
- Browser smoke：MENU、RUNNING、PAUSED 狀態正確；暫停前後 step 均為
  248；桌面三區及 Canvas 診斷資訊可見。
- GitHub Actions：未執行。
- GitHub Pages API／部署：未執行／未部署。
- 公開網站：未驗證。

## Phase 0 實際結果

- 完成時間：2026-07-30T18:44:39+08:00。
- Node.js：24.18.1 LTS。
- npm：11.16.0。
- `npm ci`：通過；安裝 69 個套件，audit 70 個套件，0 vulnerabilities。
- ESLint：通過，0 errors、0 warnings。
- 單元測試：4 passed、0 failed。
- 整合測試：1 passed、0 failed。
- 情境測試：Phase 0 不適用。
- 瀏覽器 E2E：Phase 0 不適用。
- Browser smoke：`foundation-ready`，6 份 CSS、1 個 ES Module、Console 0 warning／error。
- 1280×720：`scrollWidth = clientWidth = 1280`，頁尾在首屏內。
- 1024×768 與 390×844：無水平 overflow；窄螢幕內容改為單欄。
- GitHub Actions：未執行。
- GitHub Pages：未部署。
- 公開網站：未驗證。

## 測試誠信

- 本機、GitHub Actions、Pages 及公開網站結果分開記錄。
- 未執行不等於失敗，也不得標為通過。
- 手動檢查不得冒充要求的自動測試。
- 不得註解失敗測試或硬編碼結果取得綠燈。
- `.DS_Store`、`._*`、測試輸出及 `node_modules` 不得提交。
