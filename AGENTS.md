# SGTS-NH Codex 工作指示
## Phase、環境與發布治理

> **KOSMOS TOOLKIT｜探真拓知酷**

1. 每次工作前完整閱讀 `SGTS-NH_MASTER_SPEC.md`、本文件及 `docs/PHASE-STATUS.md`。
2. 一次只能執行目前獲准的 Phase；完成後停止，不得預建下一 Phase 功能。
3. `completed` 不等於 `approved`；只有使用者明確批准後才可記錄 `approved`。
4. 本機 commit、遠端建立、merge、push、GitHub 設定及 Pages 部署依主規格第 0.4 節分開授權。
5. 未取得 push 或部署授權時，不得執行或暗示已執行。
6. 正式網站必須是 GitHub Pages 可執行的靜態網站，不得加入 Node.js 後端。
7. 禁止將未執行的測試、GitHub Actions、Safari、iPadOS 或 Pages 驗證宣稱為通過。
8. 品牌固定為 `KOSMOS TOOLKIT｜探真拓知酷`。
9. GitHub owner 固定為 `kisaraki`，repository 固定為 `classroom-sgts-nh-tzk`。
10. `.DS_Store`、`._*` AppleDouble、金鑰、個資、快取及測試產物不得提交。

## 本機軟體與套件管理

- Windows：最新 PowerShell／Winget 優先。
- macOS：最新 Homebrew／brew 優先。
- Linux：最新 apt 優先。
- Python 版本與套件：最新 uv 優先。
- Node.js 套件：最新 npm 優先。
- 本專案固定使用 Node.js 24 LTS；macOS 使用 Homebrew keg-only `node@24`，不得為本專案覆寫使用者的全域 Node.js 連結。

## 實作原則

- 使用 `lon`，不得混用 `lng` 或 `long`。
- 模擬模組不得直接操作 DOM。
- 渲染不得修改物理狀態。
- UI 不得直接修改颱風座標或風速。
- 物理模組不得直接使用 `Math.random()`。
- 正式資源不得使用 `/assets/...` 等網域根絕對路徑。
- 發現規格矛盾時記錄於 `docs/DECISIONS.md`，不得自行改變核心範圍。
