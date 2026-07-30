# SGTS-NH 架構決策紀錄
## Phase 0 基礎決策

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

## DEC-0003｜Phase 0 測試工具

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：ESLint 10.8.0、Node.js `node:test` 與自有 Node 靜態伺服器。
- 理由：Phase 0 可在無執行期相依的情況驗證文件、相對路徑及 Pages 子路徑。
- 延後：Playwright 及瀏覽器 E2E 於 Phase 1 依實際介面需求加入。

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
