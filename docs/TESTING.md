# SGTS-NH 測試策略
## 需求追蹤、測試分類與驗收證據

> **KOSMOS TOOLKIT｜探真拓知酷**

## 工具鏈

- Node.js 24 LTS。
- npm 11。
- ESLint。
- Node.js 內建 `node:test`。
- 瀏覽器 E2E 自 Phase 1 起評估 Playwright；WebKit 模擬不得冒充實際 Safari 或 iPadOS。

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

Phase 0：

- `test:unit` 驗證必要檔案、品牌、repository、規格版本及相對資源。
- `test:integration` 啟動本機伺服器，驗證 `/` 與 `/classroom-sgts-nh-tzk/`。
- `test:scenario` 不適用，指令會明確回報。
- `test:e2e` 尚不適用，指令會明確回報。

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

## 瀏覽器與外部環境矩陣

| 環境 | Phase 0 狀態 | 說明 |
|---|---|---|
| Node HTTP smoke | passed | 根目錄及 Pages 子路徑均為 200，ES Module MIME 正確 |
| Codex in-app Browser | passed | 1280×720、1024×768、390×844；DOM、版面、Console |
| 實際 Chrome | not_run | Phase 0 未要求獨立 Chrome 實機驗證 |
| 實際 Edge | not_verified | 本機未安裝 |
| 實際 macOS Safari | not_run | Phase 9 必要實機驗證 |
| 實際 iPadOS Safari | not_verified | 目前無實體裝置證據 |
| GitHub Actions | not_run | workflow 自 Phase 1 建立；目前禁止 push |
| GitHub Pages | not_deployed | Phase 9 前不得部署 |
| 公開網站 | not_verified | Pages 尚未部署 |

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
