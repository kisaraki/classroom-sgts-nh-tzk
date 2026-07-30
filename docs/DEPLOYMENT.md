# SGTS-NH 部署規格
## GitHub Pages 靜態發布與回復

> **KOSMOS TOOLKIT｜探真拓知酷**

| 項目 | 值 |
|---|---|
| Owner／repository | `kisaraki/classroom-sgts-nh-tzk` |
| 正式網址 | `https://kisaraki.github.io/classroom-sgts-nh-tzk/` |
| Base path | `/classroom-sgts-nh-tzk/` |
| 執行方式 | GitHub Pages 靜態檔案 |
| 正式部署 Phase | Phase 9 |

## 發布狀態

Phase 9 已完成本機 workflow 與 artifact 準備，但目前未獲 push、Pages
設定或部署的明確外部操作授權。因此 GitHub Actions、Pages API、deployment
與公開網站驗證均不可標示為已執行。

已用唯讀檢查確認：

- `origin` 指向 `https://github.com/kisaraki/classroom-sgts-nh-tzk.git`。
- GitHub CLI 目前登入 `kisaraki`。
- 同名公開 repository 存在且遠端尚無 branch／tag／既有內容。

這些唯讀結果只說明未來操作目標安全，不構成寫入授權。

## 靜態 artifact

```sh
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
npm ci
npm run build
npm run test:artifact
```

`scripts/build-pages.mjs` 每次先重建 `dist/`，明確只複製：

- `index.html`
- `css/`
- `js/`
- `assets/`
- `LICENSE`

它會移除外接 macOS 磁碟可能產生的 `._*` AppleDouble 檔。artifact 測試
拒絕意外根層項目，並確認必要地圖、ES Module 與 CSS 存在。
建置時把 source 的 `local-development` 替換成當前 Git commit；本機髒
worktree 加 `-dirty`，GitHub Actions artifact 則記錄精確 source commit。

不得包含 `.git/`、`.github/`、`node_modules/`、tests、規格、來源 PDF、
coverage／Playwright 報告、`.env`、Secrets、本機路徑、編輯器設定或
未授權素材。

## 路徑契約

- HTML、CSS、JavaScript 及公開資料均使用相對路徑。
- 地圖 URL 使用 `new URL(relativePath, import.meta.url)`。
- 第一版只有 `index.html` 入口，不依賴伺服器 rewrite。
- 本機整合與 Chrome E2E 以 `/classroom-sgts-nh-tzk/` 驗證 ES Modules、
  JSON MIME、Canvas、下載與 localStorage。

## Workflows

`.github/workflows/test.yml`：

- `contents: read`。
- Node 版本由 `.node-version` 決定。
- `npm ci`、Chromium 安裝及 `npm run check`。

`.github/workflows/pages.yml`：

1. `test` job 完整執行 `npm run check`。
2. `build` job 只在 test 通過後建立 `dist/`，再上傳 Pages artifact。
3. `deploy` job 只在 build 通過後執行，僅在該 job 授予
   `pages: write` 與 `id-token: write`。
4. deployment 使用 `github-pages` environment 與 `pages` concurrency。

Actions major 版本已於 2026-07-30 以 GitHub API 對照最新 release：
`checkout@v7`、`setup-node@v7`、`configure-pages@v6`、
`upload-pages-artifact@v5`、`deploy-pages@v5`。選擇理由見
`docs/DECISIONS.md`。

## 經授權後的發布程序

1. 再次執行 `gh auth status`，確認 active account 是 `kisaraki`。
2. 重新檢查 remote、遠端 heads／tags 與 repository 內容，避免覆寫。
3. 完整執行 `npm ci` 與 `npm run check`。
4. 建立可追蹤的 release-candidate commit。
5. 僅在明確授權範圍內 push 所需 branch／`main`。
6. 確認 test workflow 成功。
7. 由 Pages workflow 建置並部署同一 source commit。
8. 記錄 source commit、workflow run ID、deployment ID、正式 URL 與
   Asia/Taipei 驗證時間。
9. 公開驗證首頁、ES Modules、JSON、Console、品牌、聲明、關卡、沙盒、
   localStorage、觸控／鍵盤及五種匯出。

`v1.0.0` annotated tag 與 release notes 只能在 Phase 9 第一版發布結果
另獲正式批准後建立，且 tag push 仍須明確授權。

## 回復程序

不直接手改 production artifact，也不刪除歷史：

1. 找出上一個已知良好的 source commit，記錄目前失敗 deployment。
2. 在乾淨 checkout 執行 `npm ci`、`npm run check` 與 `npm run build`。
3. 以 `workflow_dispatch` 從該 commit／臨時回復 branch 重新觸發同一
   Pages workflow；若 workflow UI 無法指定 commit，建立只還原發布內容
   的新 commit，保留完整歷史後 push。
4. 等待 test、build、deploy 三個 job 全部成功。
5. 重新執行公開 smoke test，記錄新 workflow run、deployment ID 與時間。
6. 建立 issue／release note 說明回復原因與後續修正。

需要刪除 Pages、改可見性或強制改寫歷史時，必須另取得具體授權。
