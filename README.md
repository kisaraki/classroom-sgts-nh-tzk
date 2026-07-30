# 風暴創世神：北半球颱風模擬器
## Storm Genesis: Northern Hemisphere Typhoon Simulator（SGTS-NH）

> **KOSMOS TOOLKIT｜探真拓知酷**

SGTS-NH 是以西北太平洋熱帶氣旋為題材的互動式科學教育模擬器。它以
固定時間步進、具種子的可重現模型與資料驅動關卡，呈現環境導引、海溫、
風切、地形、冷水尾流及測站風雨之間的關係。

> 本系統只供科學教育與遊戲化模擬，不適用於真實天氣預報、防災決策、
> 航海、航空或任何安全關鍵用途。實際資訊請以官方氣象機構發布為準。

## 專案與正式網址

| 項目 | 內容 |
|---|---|
| GitHub owner | `kisaraki` |
| Repository | `classroom-sgts-nh-tzk` |
| Repository URL | `https://github.com/kisaraki/classroom-sgts-nh-tzk` |
| GitHub Pages URL | `https://kisaraki.github.io/classroom-sgts-nh-tzk/` |
| 主規格 | `SGTS-NH_MASTER_SPEC.md` 1.0.1 |
| 第一版 | 西北太平洋篇 |
| 目前階段 | Phase 9 本機發布準備；尚未 push、部署或公開驗證 |

正式網站是純靜態 GitHub Pages 應用，只使用 HTML、CSS、原生 ES
Modules、Canvas 2D、JSON、localStorage 與瀏覽器下載 API。正式執行不需要
Node.js 後端、資料庫、登入或秘密 API 金鑰，所有資源均支援
`/classroom-sgts-nh-tzk/` 子路徑。

## 第一版功能

- 三個資料驅動關卡：「那霸風雨」、「護國神山」、「韋恩三進」。
- 無勝敗沙盒，可自訂生成點、強度、海洋與環境初始條件。
- 10 模擬分鐘固定步進及 1×／4×／12×／24×；畫格率不改變物理公式。
- 具種子的 PRNG、操作紀錄、fingerprint 與三關黃金重播。
- 1° 環境網格、副高、西南季風、風切、β 漂移與平滑導引。
- 臺灣地形、分段海陸作用、登陸／再出海事件及再組織延遲。
- 動態冷水尾流、六測站持續風／陣風／雨率／累積雨量。
- localStorage v1 安全回復，以及嚴格驗證的 JSON 匯入與重播。
- CSV、模擬 JSON、沙盒 preset JSON、Canvas PNG 與文字摘要匯出。
- 300／700／1200 粒子層級、即時效能診斷與減少動態模式。
- 鍵盤操作、可見焦點、文字狀態、Canvas 文字摘要及錯誤 live region。

模型刻意簡化；關卡是歷史靈感的教育情境，不是歷史重建。公式、參數與
限制請見 [物理模型](docs/PHYSICS-MODEL.md)、
[強度模型](docs/INTENSITY-MODEL.md)、
[導引模型](docs/STEERING-MODEL.md)及
[地形與雨量模型](docs/LAND-RAIN-MODEL.md)。

## 本機執行

本專案固定使用 Node.js 24 LTS 與 npm 11。macOS 依專案治理使用
Homebrew 的 `node@24`：

```sh
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
npm ci
npm run serve
```

開啟：

```text
http://127.0.0.1:4173/classroom-sgts-nh-tzk/
```

常用驗證：

```sh
npm run lint
npm run test:unit
npm run test:integration
npm run test:scenario
npm run test:e2e
npm run test:performance
npm run build
npm run test:artifact
npm run check
```

`npm run build` 只把 `index.html`、`css/`、`js/`、`assets/` 與 `LICENSE`
放入未追蹤的 `dist/`。測試、規格、開發依賴、本機設定及 Secrets 不進入
Pages artifact。

## 架構與資料

```text
DOM controls
  → GameEngine / SimulationClock（固定步進）
  → Environment → Steering → Land → Ocean → Intensity → Observation
  → Level evaluators
  → Canvas 與 DOM 唯讀呈現
```

渲染與粒子不能回寫物理狀態；玩家只能設定有反應時間的環境目標，不能
直接拖動颱風。靜態地圖只載入／驗證一次，固定地理圖層快取於離屏 Canvas。
隱藏分頁停止更新與渲染，回到頁面時不補算隱藏期間。

延伸文件：

- [系統架構](docs/ARCHITECTURE.md)
- [資料契約](docs/DATA-SCHEMA.md)
- [關卡與計分](docs/LEVEL-SYSTEM.md)
- [沙盒與匯出](docs/SANDBOX-EXPORT.md)
- [測試與相容性](docs/TESTING.md)
- [第一版逐項驗收](docs/RELEASE-ACCEPTANCE.md)
- [部署、artifact 與回復](docs/DEPLOYMENT.md)
- [資料來源與授權](docs/SOURCES.md)
- [設計決策](docs/DECISIONS.md)
- [Phase 狀態](docs/PHASE-STATUS.md)

## 發布治理

`.github/workflows/test.yml` 是最小權限的測試 workflow；
`.github/workflows/pages.yml` 將測試、artifact 建置與部署分成相依 job，
測試失敗時不能部署。Phase 9 的本機工作不等於 GitHub Actions 或 Pages
已執行；遠端 push、Pages 設定與部署必須另有明確授權。

正式發布結果獲批准後才會建立 `v1.0.0` annotated tag 與 release notes。
完整程序及回復方法見 [部署文件](docs/DEPLOYMENT.md)。

## 授權

程式碼採 [MIT License](LICENSE)。地理與科學參考資料的來源、授權及
使用限制記錄於 [docs/SOURCES.md](docs/SOURCES.md)；無法確認授權的素材
不得進入 repository 或發布 artifact。

---

© KOSMOS TOOLKIT｜探真拓知酷<br>
SGTS-NH · Educational Simulation · Not for Forecasting
