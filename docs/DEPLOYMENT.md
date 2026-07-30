# SGTS-NH 部署規格
## GitHub Pages 靜態發布與回復

> **KOSMOS TOOLKIT｜探真拓知酷**

## 目標

| 項目 | 值 |
|---|---|
| Repository | `kisaraki/classroom-sgts-nh-tzk` |
| 正式網址 | `https://kisaraki.github.io/classroom-sgts-nh-tzk/` |
| Base path | `/classroom-sgts-nh-tzk/` |
| 執行方式 | GitHub Pages 靜態檔案 |
| 正式部署 Phase | Phase 9 |

## Phase 1 狀態

- 公開 GitHub 倉庫已建立，remote 已設定。
- 不 push。
- 不建立或修改 Pages 設定。
- 已建立 `.github/workflows/test.yml` 測試 workflow，但未推送，因此
  GitHub Actions 未執行。
- 不建立部署 workflow。
- 不部署。

## 靜態 artifact

正式 artifact 可包含：

- `index.html`。
- `css/`、`js/`。
- 公開執行所需的 `assets/` 與 JSON。
- 必要的授權及 attribution 文件。

不得包含：

- `.git/`、`node_modules/`。
- tests、coverage、Playwright 報告。
- `.env`、Secrets、本機路徑或編輯器設定。
- 未授權素材。

## 路徑規則

- HTML、CSS、JavaScript 及資料使用相對路徑。
- JavaScript 動態資源使用可在子目錄解析的 URL。
- 自動 smoke test 同時驗證 `/` 與 `/classroom-sgts-nh-tzk/`。
- 第一版只有 `index.html` 入口，不依賴伺服器 rewrite。

## 本機預覽

```sh
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
npm run serve
```

開啟：

```text
http://127.0.0.1:4173/classroom-sgts-nh-tzk/
```

## Phase 9 發布要求

- 測試 job 通過後才可部署。
- workflow 使用最小 GitHub 權限。
- 記錄 source commit、workflow run、deployment ID 及驗證時間。
- 驗證 Console、ES Modules、JSON、下載、localStorage、品牌與非預報聲明。
- 正式批准後建立 `v1.0.0` annotated tag；push 仍需明確授權。

## 回復

Phase 9 應以 Git commit 為發布單位。回復時選擇上一個已知良好 commit，重新執行完整測試並部署該 commit，不以手動刪改 production artifact 取代版本化回復。
