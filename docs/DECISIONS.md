# SGTS-NH 架構決策紀錄
## Phase 0～1 架構決策

> **KOSMOS TOOLKIT｜探真拓知酷**

## DEC-0001｜GitHub Pages 純靜態執行

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：正式網站只使用 HTML、CSS、ES Modules、Canvas 2D、JSON 與公開靜態素材。
- 理由：符合主規格、無後端及 GitHub Pages 子路徑需求。
- 影響：Node.js 只屬開發工具；正式程式不得依賴 Node.js API。

## DEC-0002｜Node.js 24 LTS 與 npm

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：專案固定 Node.js 24 LTS（本機 24.18.1）、npm 11（本機 11.16.0），提交 `package-lock.json`。
- macOS：以 Homebrew keg-only `node@24` 使用，不覆寫全域 Node.js 26 連結。
- 理由：主規格要求本機、CI 與文件使用一致且仍受支援的 LTS major。

## DEC-0003｜測試工具

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：ESLint 10.8.0、Node.js `node:test`、自有 Node 靜態伺服器，
  以及 Phase 1 的 Playwright 1.62.0。
- 理由：Phase 0 可在無執行期相依的情況驗證文件、相對路徑及 Pages 子路徑。
- Phase 1：本機指定實際 Chrome，CI 定義使用 Playwright Chromium；兩者
  不得冒充 Safari 或 iPadOS 實機。

## DEC-0004｜不追蹤未來 Phase 的空檔案

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：建立規格指定目錄，但不以 `.gitkeep` 或空白模組預建 Phase 1 以後功能。
- 理由：Git 不追蹤空目錄，且主規格禁止預先建立下一 Phase 程式碼或測試。

## DEC-0005｜Phase 0 遠端邊界

- 日期：2026-07-30。
- 狀態：accepted。
- 使用者授權建立公開 `kisaraki/classroom-sgts-nh-tzk`。
- Phase 0 不 push、不建立 Pages 設定、不部署。
- GitHub Actions 因 workflow 尚屬 Phase 1 且未 push，標記為未執行。

## DEC-0006｜固定時間步進與分頁可見性

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：每個完整步進固定為 10 模擬分鐘；倍速只縮短累積到下一步所需的
  真實時間，不改變步長。
- 安全界線：真實 delta 上限 250 ms、單畫格最多 8 步；隱藏分頁清空累積器，
  update/render 停止，切回第一幀 delta 歸零。
- 理由：維持不同 FPS 的決定性，並避免背景分頁造成大量補算。

## DEC-0007｜Canvas 與響應式介面

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：Canvas backing store 依 CSS 尺寸與 DPR 建立，DPR 上限 2；桌面採
  控制／視窗／診斷三區，低於 1100 px 改為上下堆疊，低於 600 px 顯示提示。
- 理由：兼顧清晰度、效能、平板可用性及 44 px 觸控目標。

## DEC-0008｜Phase 1 測試 workflow 與遠端邊界

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：`.github/workflows/test.yml` 使用唯讀 contents 權限、Node 24、
  `npm ci`、Playwright Chromium 及 `npm run check`。
- 遠端狀態：workflow 只完成本機定義與測試；因未獲 push 授權，
  GitHub Actions 為未執行，Pages 仍未設定及未部署。
