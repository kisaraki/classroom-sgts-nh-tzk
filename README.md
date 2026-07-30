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
| 目前階段 | Phase 0：基礎建置 |

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
