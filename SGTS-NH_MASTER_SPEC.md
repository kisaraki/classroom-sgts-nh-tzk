# 風暴創世神：北半球颱風模擬器
## Storm Genesis: Northern Hemisphere Typhoon Simulator（SGTS-NH）
### 完整開發規格書暨 Codex Phase 執行指令

> **KOSMOS TOOLKIT｜探真拓知酷**

---

## 文件資訊

| 項目 | 內容 |
|---|---|
| 中文名稱 | 風暴創世神：北半球颱風模擬器 |
| 英文名稱 | Storm Genesis: Northern Hemisphere Typhoon Simulator |
| 專案縮寫 | SGTS-NH |
| 第一版篇章 | 西北太平洋篇（Northwest Pacific Chapter） |
| GitHub 帳號 | `kisaraki` |
| GitHub 倉庫 | `classroom-sgts-nh-tzk` |
| GitHub 倉庫網址 | `https://github.com/kisaraki/classroom-sgts-nh-tzk` |
| GitHub Pages | `https://kisaraki.github.io/classroom-sgts-nh-tzk/` |
| 創作團隊 | KOSMOS TOOLKIT｜探真拓知酷 |
| 文件定位 | 專案唯一主規格、Codex 長期指令與分階段驗收依據 |
| 文件版本 | 1.0.3 |
| 預定授權 | MIT License；第三方資料與素材依各自授權標示 |
| 主要執行環境 | GitHub Pages 靜態網站、現代桌面與平板瀏覽器 |
| 文件建議位置 | 倉庫根目錄：`SGTS-NH_MASTER_SPEC.md` |

---

# 0. Codex 使用與階段批准制度

本文件同時是：

1. 產品需求文件（PRD）。
2. 技術架構規格。
3. 模擬模型說明。
4. UI／UX 規格。
5. 測試與驗收規格。
6. Codex 各 Phase 的執行指令。
7. GitHub Pages 發布規格。
8. 專案品牌與識別規格。

Codex 每次開始工作前，都必須先閱讀本文件，再檢查專案現況、Git 狀態、目前分支及既有測試結果。不得只憑對話片段推測專案已完成哪些內容。

## 0.1 最重要的階段控制規則

Codex **一次只能執行一個 Phase**。

每個 Phase 完成後，Codex 必須：

1. 停止所有開發工作。
2. 不得自動進入下一 Phase。
3. 不得預先建立下一 Phase 的程式碼、檔案或測試。
4. 提交該 Phase 的完成報告。
5. 明確詢問使用者是否批准進入下一 Phase。
6. 等待使用者以明確文字批准。
7. 沒有明確批准時，不得將沉默、模糊回覆或一般稱讚視為批准。

可接受的批准文字包括：

```text
批准進入 Phase 1
Phase 0 通過，繼續 Phase 1
同意，進入下一階段
本階段驗收通過
```

下列文字不得視為批准：

```text
看起來不錯
先這樣
我再看看
可以說明下一階段嗎
請列出下一階段內容
```

如果使用者要求修正、補測、重構或重新驗收，Codex 必須留在目前 Phase，完成修正後再次停止並要求批准。

## 0.2 每個 Phase 的強制結尾

每個 Phase 的最後一則回覆必須以以下格式結束：

```text
## Phase X 完成報告

### 已完成
- ...

### 新增檔案
- ...

### 修改檔案
- ...

### 測試與建置
- 已執行：...
- 通過：...
- 失敗：...
- 未執行：...

### 驗收結果
- 通過項目：...
- 未通過項目：...

### 已知問題與風險
- ...

### Git 狀態
- 分支：...
- Commit：...
- 未提交變更：...

### GitHub 與發布狀態
- Push：已執行／未執行／不適用
- GitHub Actions：通過／失敗／未執行／不適用
- GitHub Pages：已部署／未部署／不適用
- 公開網站驗證：通過／失敗／未驗證／不適用

### 下一階段
- Phase Y：...

⛔ Phase X 已停止。未取得使用者明確批准前，不得執行 Phase Y。
請問是否批准進入 Phase Y？
```

若本階段未通過驗收，應改為：

```text
⛔ Phase X 尚未通過驗收，已停止於本階段。
請指定要優先修正的項目，或批准依本報告所列順序繼續修正 Phase X。
```

## 0.3 階段狀態紀錄

Phase 0 應建立：

```text
docs/PHASE-STATUS.md
```

內容至少記錄：

| Phase | 狀態 | 分支 | 完成 Commit | 批准 Commit | 測試 | completedAt | approvedAt | 批准原文 | 阻塞原因 |
|---|---|---|---|---|---|---|---|---|---|
| 0 | pending / in_progress / blocked / completed / approved |  |  |  |  |  |  |  |  |
| 1 | pending |  |  |  |  |  |  |  |  |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

規則：

- `completed`：Codex 已完成並回報，但尚未取得批准。
- `approved`：使用者明確批准後才可標記。
- `blocked`：本 Phase 尚未完成，且存在需由使用者或外部環境解除的明確阻塞。
- 進入新 Phase 前，上一 Phase 必須為 `approved`。
- 使用者批准後，Codex先更新狀態紀錄，再開始下一 Phase。
- 不得偽造批准時間、批准文字或使用者決定。
- 時間一律使用含時區的 ISO 8601；本專案預設以 `Asia/Taipei` 顯示。
- `批准原文` 必須逐字記錄使用者實際批准文字，不得由 Codex 改寫。
- 若欄位過長，可在表格填入摘要，並在同一文件的「批准紀錄」小節保存完整資料。

## 0.4 操作授權矩陣

Phase 執行批准只授權該 Phase 內必要的本機、可回復工作，不自動擴張為所有外部操作。

| 操作 | 預設授權規則 |
|---|---|
| 閱讀檔案、檢查環境、執行既有測試 | 可在目前 Phase 內執行 |
| 建立或修改目前 Phase 的本機檔案 | 取得該 Phase 執行批准後可執行 |
| `git init`、建立本機分支、建立本機 commit | 取得該 Phase 執行批准後可執行 |
| 建立公開或私人 GitHub 倉庫 | 必須取得明確外部建立授權 |
| 合併已批准 Phase 至本機 `main` | 使用者批准該 Phase 後可執行 |
| Push 分支、tag 或 `main` | 必須取得本次 push 明確授權，或已有使用者書面常設授權 |
| 建立或修改 GitHub 設定、Secrets、Rulesets、Pages | 必須取得相應明確授權 |
| 部署 GitHub Pages | 僅可在 Phase 9 或另行批准的部署修正中執行 |

完成報告必須分開列出：

- 本機驗證狀態。
- Git commit 狀態。
- GitHub push／Actions 狀態。
- GitHub Pages 部署狀態。
- 公開網站驗證狀態。

不得以本機通過代替 GitHub Actions 或正式 Pages 通過。

## 0.5 Phase 分支、批准與合併流程

除非使用者另有明確指示，採以下固定流程：

1. 從最新的本機 `main` 建立本 Phase 分支。
2. 將本 Phase 標記為 `in_progress`。
3. 僅實作本 Phase。
4. 通過本 Phase 驗收後，將狀態改為 `completed`。
5. 建立 Phase 完成 commit。
6. 提交完成報告並停止。
7. 使用者明確批准後，在原 Phase 分支逐字記錄批准原文及時間。
8. 建立批准紀錄 commit。
9. 合併至本機 `main`。
10. 只有取得 push 授權時才 push。
11. 從更新後的本機 `main` 建立下一 Phase 分支。

若合併、測試或批准紀錄出現問題，必須留在目前 Phase，不得建立下一 Phase 分支。

## 0.6 規範用語與優先序

本文件中的用語：

- **必須／不得**：必要要求；未符合即不通過驗收。
- **應／建議**：預設應採用；若不採用，需在 `docs/DECISIONS.md` 記錄理由與替代方案。
- **可**：選配，不影響必要驗收，除非某 Phase 另有指定。

規範衝突時的優先序：

```text
使用者最新明確指示
> SGTS-NH_MASTER_SPEC.md
> docs/DECISIONS.md 中已批准決策
> 其他 docs 文件
> 既有程式碼與註解
```

若高優先序指示改變核心範圍，仍需記錄版本與差異，不得靜默覆寫。

## 0.7 需求追蹤

Phase 0 應在 `docs/TESTING.md` 建立「需求 → Phase → 測試 → 驗收證據」追蹤表。

需求 ID 建議格式：

```text
GOV-PHASE-001
SIM-TIME-001
SIM-RNG-001
GEO-LAND-001
LEVEL-NAHA-001
STORE-IMPORT-001
DEPLOY-PAGES-001
```

每個必要驗收項目至少對應一個需求 ID；測試報告及 Phase 完成報告應引用相關 ID。

---

# 1. 專案定位

## 1.1 核心概念

《風暴創世神：北半球颱風模擬器》是一套以西北太平洋熱帶氣旋為第一版場景的互動式科學教育模擬遊戲。

玩家不直接拖曳颱風，也不直接指定路徑，而是調整：

- 太平洋副熱帶高壓。
- 西南季風。
- 垂直風切。
- 海表溫度。
- 海洋熱含量。
- 環境水氣。
- 初始擾動條件。

颱風的生成、組織、增強、減弱、移動、登陸、降雨及地形作用，均由簡化但可解釋的模型逐步計算。

## 1.2 教育目標

使用者應能透過操作理解：

1. 熱帶氣旋為何不易在赤道附近形成。
2. 暖海面與高海洋熱含量如何供應能量。
3. 垂直風切如何破壞對流對稱性。
4. 副熱帶高壓如何影響颱風路徑。
5. 西南季風如何同時影響水氣及導引氣流。
6. 慢速強颱如何造成冷水尾流並抑制自身發展。
7. 臺灣中央山脈如何破壞颱風結構並改變降雨分布。
8. 同一組環境條件如何透過具種子的微小擾動產生可重現結果。
9. 歷史颱風案例可作為關卡靈感，但模擬不等於歷史重建或預報。

## 1.3 非目標

第一版不追求：

- 作業級氣象預報。
- 真實大氣數值模式。
- 精確重現特定歷史颱風每一筆觀測。
- 與中央氣象署或其他機構預報產品競爭。
- 多層大氣動力方程完整求解。
- 多颱風交互作用。
- 南半球熱帶氣旋。
- 即時氣象資料同化。
- 伺服器端帳號、排行榜或雲端存檔。

## 1.4 教育與責任聲明

所有頁面及匯出成果應可見以下聲明：

> 本系統為科學教育與遊戲化模擬工具，使用簡化模型呈現熱帶氣旋概念，不適用於真實天氣預報、防災決策、航海、航空或任何安全關鍵用途。實際颱風資訊請以官方氣象機構發布為準。

---

# 2. 品牌、識別與署名

## 2.1 固定品牌識別

本專案創作團隊的固定識別字串為：

```text
KOSMOS TOOLKIT｜探真拓知酷
```

注意：

- 本專案依使用者本次指定採單數 `TOOLKIT`。
- 不得擅自改成 `KOSMOS TOOLKITS`。
- 中文與英文之間固定使用全形直線 `｜`。
- 不得改寫為斜線、連字號或其他團隊名稱。
- 可依版面使用粗體，但文字內容不得省略。

## 2.2 文件頁首識別

所有主要 Markdown 文件應採：

```markdown
# 文件主標題
## 文件副標題

> **KOSMOS TOOLKIT｜探真拓知酷**
```

至少包含：

- `README.md`
- `SGTS-NH_MASTER_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/PHYSICS-MODEL.md`
- `docs/TESTING.md`
- `docs/PHASE-STATUS.md`
- `docs/DEPLOYMENT.md`
- `docs/SOURCES.md`

## 2.3 網站識別

首頁或主選單必須包含：

```text
風暴創世神
北半球颱風模擬器
Storm Genesis: Northern Hemisphere Typhoon Simulator
KOSMOS TOOLKIT｜探真拓知酷
```

頁尾必須包含：

```text
© KOSMOS TOOLKIT｜探真拓知酷
SGTS-NH · Educational Simulation · Not for Forecasting
```

可使用語意化 HTML：

```html
<footer class="site-footer">
  <p class="brand-mark">KOSMOS TOOLKIT｜探真拓知酷</p>
  <p>SGTS-NH · Educational Simulation · Not for Forecasting</p>
</footer>
```

## 2.4 視覺調性

- 氣象雷達、海圖、科學儀表與策略遊戲的混合感。
- 介面必須具備任務、目標進度、指揮回饋與戰況變化，整體感受應為科學策略遊戲，不得只呈現中性的模擬器儀表。
- 專業但不冷硬。
- 可供課堂投影。
- 深色介面為預設，可提供淺色模式。
- 不以過度閃爍、粒子爆炸或災難獵奇作為主要視覺。
- 強度、風速與警戒不得只靠顏色辨識。
- 品牌識別應清楚但不遮擋主要操作。

---

# 3. 平台與技術限制

## 3.1 正式技術棧

- HTML5。
- CSS3。
- JavaScript ES2022。
- Canvas 2D API。
- ES Modules。
- JSON 資料。
- 原生 Web API。
- Git 與 GitHub。
- GitHub Pages。

## 3.2 禁止或原則上不採用

- React、Vue、Angular 等大型框架。
- Node.js 後端。
- 資料庫。
- 必須保密的 API 金鑰。
- 需要登入才能執行的正式功能。
- 依賴伺服器端計算的物理模型。
- Three.js，除非後續版本經新規格批准。
- 未經評估的大型 CDN 套件。
- 直接把全部邏輯放進單一 `app.js`。
- 直接使用絕對根路徑 `/assets/...`。
- 直接在各模組呼叫 `Math.random()`。

## 3.3 瀏覽器支援

第一版最低要求：

- 最新穩定版 Chrome。
- 最新穩定版 Edge。
- macOS Safari。
- iPadOS Safari。
- 觸控與滑鼠。
- 桌面 1280×720 以上完整介面。
- 平板橫向可完整操作。
- 窄螢幕可顯示簡化介面或橫向提示。

## 3.4 GitHub Pages 子路徑

正式網址位於：

```text
https://kisaraki.github.io/classroom-sgts-nh-tzk/
```

因此：

- 所有正式資源使用相對路徑。
- 不可假設網站部署於網域根目錄。
- 所有模組匯入、JSON、圖片、字型及下載範本均需通過子目錄部署測試。
- 若使用 GitHub Actions 部署，仍須確認產物中的路徑不指向 `/` 根目錄。
- JavaScript 動態資源優先以 `new URL(relativePath, import.meta.url)` 或明確文件基準解析。
- CSS `url(...)` 以 CSS 檔案位置為基準，不得依賴開發伺服器特殊改寫。
- 自動 smoke test 必須至少在 `/classroom-sgts-nh-tzk/` 子路徑載入一次，不得只測 `/`。
- 第一版採單一 `index.html` 入口；未建立 client-side router 前，不得假設任意子路徑重新整理可回到應用程式。

## 3.5 正式執行環境與開發工具的界線

正式網站只在瀏覽器及 GitHub Pages 靜態檔案環境執行：

- Node.js、npm、測試 runner、lint、格式化及本機靜態伺服器只屬開發工具。
- 正式網站不得要求使用者安裝 Node.js。
- 正式網站不得呼叫 Node.js API、檔案系統、子程序或伺服器端程式。
- GitHub Pages artifact 必須只包含公開執行所需的 HTML、CSS、JavaScript、JSON、圖片、字型及必要授權文件。
- 不得把 `node_modules`、測試輸出、本機路徑或開發設定部署至 Pages。

## 3.6 Node.js、npm 與測試工具鏈

- 專案使用 `package.json`，並設定 `"type": "module"`。
- Node.js 固定使用一個仍受支援的 LTS major；本機、CI 與文件需一致。
- 套件管理使用 npm。
- `package-lock.json` 必須提交；CI 使用 `npm ci`。
- JavaScript 靜態檢查使用 ESLint；設定及版本由 package-lock 固定。
- 純函式、資料模型與模擬核心優先使用 Node.js 內建 `node:test`。
- DOM、Canvas、鍵盤、觸控及下載流程使用 Playwright 或經 `docs/DECISIONS.md` 批准的等效瀏覽器測試工具。
- Playwright WebKit 通過不得冒充實際 macOS Safari 或 iPadOS Safari 通過。
- 正式執行不得引入前端框架；開發用測試套件不視為網站執行框架。

至少提供以下 npm 指令；無適用測試時需成功退出並清楚說明未執行原因，不得假造測試：

```text
npm run lint
npm run test:unit
npm run test:integration
npm run test:scenario
npm run test:e2e
npm run check
npm run serve
```

---

# 4. 建議專案結構

```text
classroom-sgts-nh-tzk/
├─ index.html
├─ README.md
├─ LICENSE
├─ AGENTS.md
├─ SGTS-NH_MASTER_SPEC.md
├─ .gitignore
├─ .editorconfig
├─ package.json
├─ package-lock.json
├─ scripts/
│  └─ serve.mjs
├─ assets/
│  ├─ icons/
│  ├─ maps/
│  │  └─ northwest-pacific.json
│  ├─ textures/
│  └─ audio/
├─ css/
│  ├─ reset.css
│  ├─ tokens.css
│  ├─ layout.css
│  ├─ components.css
│  ├─ simulation.css
│  └─ accessibility.css
├─ js/
│  ├─ app.js
│  ├─ config.js
│  ├─ core/
│  │  ├─ GameEngine.js
│  │  ├─ SimulationClock.js
│  │  ├─ StateMachine.js
│  │  ├─ EventBus.js
│  │  ├─ ObjectiveEvaluator.js
│  │  └─ FailureEvaluator.js
│  ├─ model/
│  │  ├─ Typhoon.js
│  │  ├─ Environment.js
│  │  ├─ GridCell.js
│  │  ├─ WeatherStation.js
│  │  └─ LevelState.js
│  ├─ simulation/
│  │  ├─ IntensityModel.js
│  │  ├─ SteeringModel.js
│  │  ├─ LandInteractionModel.js
│  │  ├─ OceanCoolingModel.js
│  │  ├─ RainfallModel.js
│  │  └─ ObservationModel.js
│  ├─ rendering/
│  │  ├─ CanvasRenderer.js
│  │  ├─ MapRenderer.js
│  │  ├─ FieldRenderer.js
│  │  ├─ TyphoonRenderer.js
│  │  ├─ TrackRenderer.js
│  │  └─ ParticleRenderer.js
│  ├─ ui/
│  │  ├─ ControlPanel.js
│  │  ├─ Dashboard.js
│  │  ├─ Tutorial.js
│  │  ├─ ResultDialog.js
│  │  └─ AccessibilityPanel.js
│  ├─ data/
│  │  ├─ geography.js
│  │  ├─ stations.js
│  │  └─ levels.js
│  └─ utils/
│     ├─ math.js
│     ├─ geo.js
│     ├─ random.js
│     ├─ validation.js
│     ├─ storage.js
│     └─ export.js
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ PHYSICS-MODEL.md
│  ├─ DATA-SCHEMA.md
│  ├─ TESTING.md
│  ├─ DEPLOYMENT.md
│  ├─ SOURCES.md
│  ├─ DECISIONS.md
│  └─ PHASE-STATUS.md
├─ tests/
│  ├─ foundation.test.js
│  ├─ test-runner.js
│  ├─ unit/
│  ├─ integration/
│  ├─ scenario/
│  ├─ e2e/
│  └─ fixtures/
└─ .github/
   └─ workflows/
      ├─ test.yml
      └─ deploy-pages.yml
```

原則：

- 資料、模擬、渲染及 UI 分離。
- 模擬模組不得直接操作 DOM。
- 渲染模組不得修改物理狀態。
- UI 不得直接修改颱風座標或風速。
- 所有可調常數集中於 `js/config.js`。
- 所有關卡差異透過資料驅動。
- 第一版不強制完整 ECS；使用清楚的領域物件與模組即可。

---

# 5. 系統架構

## 5.1 遊戲狀態

```js
const GameState = Object.freeze({
  BOOT: 'BOOT',
  MENU: 'MENU',
  TUTORIAL: 'TUTORIAL',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  VICTORY: 'VICTORY',
  FAILURE: 'FAILURE',
  ERROR: 'ERROR'
});
```

狀態切換必須受控，不得由任意 UI 元件直接改寫字串。

## 5.2 固定時間步進

物理模擬採固定時間步進：

```text
一個 simulation step = 10 模擬分鐘
```

`requestAnimationFrame` 只負責：

1. 計算真實時間差。
2. 累積待處理時間。
3. 按目前倍速執行固定步數。
4. 執行插值後的畫面更新。

禁止：

- 使用每畫格固定加風速。
- 以螢幕 FPS 直接決定模擬結果。
- 分頁切回後一次補算無上限時間。

需設定：

- 最大單畫格補算步數。
- 最大真實時間差截斷值。
- 隱藏分頁暫停渲染及物理；切回時不得補算隱藏期間。
- 模擬結果在 60 Hz 與 120 Hz 下保持一致。
- 累積器及插值值不得寫回物理狀態。
- 控制操作必須對齊下一個固定 simulation step 生效。

## 5.3 模擬速度

提供：

- 暫停。
- 1×。
- 4×。
- 12×。
- 24×。

倍速只改變每秒執行多少固定步數，不得改變單一步進的物理公式。

## 5.4 事件匯流排

事件至少包括：

```text
SIMULATION_STARTED
SIMULATION_PAUSED
SIMULATION_RESUMED
SIMULATION_STEP
TYPHOON_FORMED
STRUCTURE_CHANGED
LANDFALL
SEA_REENTRY
WARNING_ZONE_ENTERED
WARNING_ZONE_EXITED
OBJECTIVE_COMPLETED
FAILURE_TRIGGERED
LEVEL_COMPLETED
LEVEL_RESTARTED
```

事件需避免同一條件在每一步重複發送。

每個事件至少包含：

```js
{
  id: 'event-000001',
  type: 'LANDFALL',
  stepIndex: 720,
  simulationMinutes: 7200,
  sourceId: 'storm-001',
  payload: {}
}
```

`id` 在同一次模擬中必須唯一；事件排序先依 `stepIndex`，再依固定事件優先序，最後依建立序號。

## 5.5 單一步進更新順序

為避免同一步同時觸發目標與失敗時出現不一致，固定採：

1. 套用排定於本步的玩家操作。
2. 更新目標環境值及實際環境值。
3. 計算導引、移動路徑及子段。
4. 判定海陸、警戒區及地圖邊界轉換。
5. 更新地形、冷水尾流、強度、氣壓、半徑及結構。
6. 更新降雨及測站觀測。
7. 產生並去重事件。
8. 更新軌跡、統計及操作重播資料。
9. 評估主要目標及額外目標。
10. 評估失敗條件。
11. 執行勝敗仲裁。
12. 發送本步公開事件。

同一步勝利與失敗同時成立時，預設由失敗優先；關卡若需不同規則，必須在 Level schema 明確指定並有測試。

## 5.6 決定性與版本邊界

- 所有操作以整數 `stepIndex` 記錄，不以牆鐘時間作為重播依據。
- 同一步多個操作依操作建立序號穩定排序。
- PRNG 必須指定演算法名稱、演算法版本及初始狀態。
- 物理至少拆分 `intensity`、`steering`、`environment` 三個具名稱的亂數子流；視覺使用獨立子流。
- 新增視覺效果不得改變任何物理亂數子流的呼叫次序。
- 匯出需記錄 `schemaVersion`、`modelVersion`、PRNG 版本及建置 commit。
- 同一版本、同一瀏覽器引擎、同一輸入的結果 fingerprint 必須一致。
- 跨瀏覽器浮點結果以 `docs/TESTING.md` 定義的數值容差比較，但勝敗、事件次數及關卡狀態必須一致。

---

# 6. 核心資料模型

## 6.1 Typhoon

```js
{
  id: 'storm-001',
  name: '未命名擾動',
  lat: 14,
  lon: 145,
  maxWind: 15,
  centralPressure: 1005,
  galeRadius: 80,
  heading: 280,
  translationSpeed: 12,
  organization: 0.2,
  symmetry: 0.35,
  moisture: 0.7,
  structureStage: 'cluster',
  isOverLand: false,
  active: true,
  trackHistory: [],
  eventHistory: []
}
```

單位：

- `lat`、`lon`：十進位經緯度。
- `maxWind`：m/s。
- `centralPressure`：hPa。
- `galeRadius`：km。
- `heading`：0～360 度，0 為北、90 為東。
- `translationSpeed`：km/h。
- `organization`、`symmetry`、`moisture`：0～1。

## 6.2 Environment

```js
{
  bounds: {
    minLon: 100,
    maxLon: 160,
    minLat: 0,
    maxLat: 40
  },
  gridResolution: 1,
  cells: [],
  subtropicalHigh: {},
  southwestMonsoon: {},
  controls: {},
  targetControls: {}
}
```

## 6.3 GridCell

每個網格至少包含：

```js
{
  lat: 20,
  lon: 130,
  seaSurfaceTemperature: 29,
  oceanHeatContent: 0.8,
  surfacePressure: 1010,
  steeringU: -4,
  steeringV: 1,
  verticalWindShear: 8,
  relativeHumidity: 0.75,
  terrainHeight: 0,
  surfaceRoughness: 0.05,
  landFraction: 0,
  coldWake: 0
}
```

## 6.4 WeatherStation

```js
{
  id: 'taipei',
  name: '臺北',
  lat: 25.04,
  lon: 121.52,
  elevation: 5,
  exposure: 0.75,
  region: 'north',
  sustainedWind: 0,
  gust: 0,
  hourlyRainRate: 0,
  accumulatedRain: 0
}
```

## 6.5 Level

```js
{
  id: 'naha-storm',
  title: '那霸風雨',
  historicalInspiration: '2018 潭美',
  disclaimer: '歷史靈感關卡，非歷史重建',
  durationHours: 168,
  seed: 201809,
  spawn: {},
  environmentPreset: {},
  allowedControls: [],
  objectives: [],
  bonusObjectives: [],
  failureConditions: [],
  scoring: {},
  tutorialMessages: []
}
```

所有關卡資料必須通過 schema 驗證。

## 6.6 第一版單位字典

除非欄位另有明確定義，第一版採：

| 欄位 | 單位／範圍 | 約定 |
|---|---|---|
| `lat` | 十進位度，0～40 | 北緯為正 |
| `lon` | 十進位度，100～160 | 東經為正；禁止 `lng`、`long` |
| `heading` | 度，0～<360 | 0 北、90 東，使用 `[0, 360)` |
| `maxWind` | m/s | 教育模型最大持續風 |
| `translationSpeed` | km/h | 中心移動速度 |
| `steeringU` | m/s | 正值向東 |
| `steeringV` | m/s | 正值向北 |
| `centralPressure`、`surfacePressure` | hPa | 遊戲化近似 |
| `galeRadius` | km | 模型暴風半徑 |
| `seaSurfaceTemperature` | °C | 有效海表溫度 |
| `oceanHeatContent` | 0～1 | 第一版遊戲化暖水層厚度係數，不宣稱為實測 OHC |
| `verticalWindShear` | m/s | 模型環境風切 |
| `relativeHumidity` | 0～1 | 相對溼度比例 |
| `terrainHeight`、`elevation` | m | 相對海平面 |
| `surfaceRoughness` | 0～1 | 遊戲化摩擦係數 |
| `landFraction` | 0～1 | 網格陸地比例 |
| `coldWake` | °C | 由初始／背景有效 SST 扣除的冷卻量 |
| `hourlyRainRate` | mm/h | 當前模型雨率 |
| `accumulatedRain` | mm | 自本次模擬開始累積 |
| `simulationMinutes` | 模擬分鐘 | 自 0 起算 |
| `stepIndex` | 無單位整數 | 自 0 起算，為重播及事件的權威時間索引 |

任何新增欄位必須先加入 `docs/DATA-SCHEMA.md` 的單位字典，不得只在程式碼中猜測。

## 6.7 Schema 與資料版本

- JSON 資料採 JSON Schema Draft 2020-12，或在 `docs/DECISIONS.md` 記錄等效且可自動測試的替代方案。
- Typhoon、Environment、GridCell、WeatherStation、Level、儲存資料及匯入／匯出資料均需有明確 schema。
- Schema 必須定義 `required`、型別、上下限、列舉、最大陣列長度及未知欄位策略。
- 預設拒絕未聲明欄位；需要向前相容時以明確的 `extensions` 物件承載。
- 資料必須包含整數 `schemaVersion`。
- 模型行為改變另提升 `modelVersion`；不得只改 schemaVersion 來掩蓋模型不相容。
- 驗證後才可將外部資料轉成內部物件；不得直接合併未受信任物件。

---

# 7. 地理與座標系統

## 7.1 模擬範圍

第一版固定為：

```text
經度：100°E～160°E
緯度：0°N～40°N
```

專案品牌保留「北半球颱風模擬器」，但第一版正式內容是「西北太平洋篇」。不得宣稱第一版已完整涵蓋整個北半球。

## 7.2 地圖內容

簡化海岸線至少包含：

- 臺灣。
- 中國東南沿岸。
- 菲律賓主要島嶼。
- 海南島。
- 琉球群島。
- 日本四大島。
- 越南北部沿岸。

## 7.3 必要地理函式

- 經緯度轉 Canvas 座標。
- Canvas 座標反轉經緯度。
- Haversine 距離。
- 初始方位角。
- 由距離與方位角推算新座標。
- point-in-polygon。
- 線段與多邊形交會。
- 最近測站查找。
- 地圖邊界判定。

所有經度欄位統一使用 `lon`，不得混用 `lng`、`long`。

## 7.4 路徑線段判定

單一步進即使距離跨越狹窄島嶼，也不得漏掉登陸。需將移動路徑視為線段，必要時分割成子段檢測海陸交會。

## 7.5 地圖資料約定

- `assets/maps/northwest-pacific.json` 必須記錄格式版本、資料來源、授權、簡化方式及產生日期。
- 座標順序固定為 `[lon, lat]`。
- Polygon ring 的方向、洞與邊界判定必須在 `docs/DATA-SCHEMA.md` 定義。
- 位於海岸線邊界的點以「陸地」處理；測試需覆蓋邊界與頂點。
- 每個陸地區域具有穩定 `regionId`，不得以翻譯後顯示名稱作判定。
- 臺灣本島海岸資料需能標示 `east`、`west`、`north`、`south` 岸段，以支援關卡判定。
- 簡化地圖只供教育視覺及模型判定，不得宣稱具有測繪或導航精度。

---

# 8. 簡化物理模型

## 8.1 模型原則

本系統是教育模型，不是假裝精確的預報模式。每一項公式都需在 `docs/PHYSICS-MODEL.md` 說明：

- 對應的氣象概念。
- 遊戲化簡化方式。
- 單位。
- 數值範圍。
- 可調常數。
- 已知限制。

## 8.2 科氏組織效率

可計算：

```text
f = 2 Ω sin(φ)
```

但 `f` 不得直接當作「增加風速」的加成。

科氏效應主要用於：

- 低緯度組織效率。
- 旋轉結構形成門檻。
- β 漂移相關項。
- 赤道附近發展抑制。

建議建立 0～1 的 `coriolisFactor`，在非常低緯度接近 0，進入熱帶後平滑上升。

## 8.3 海溫因子

概念範例：

```js
heatFactor = clamp(
  (seaSurfaceTemperature - SST_MIN) /
  (SST_OPTIMAL - SST_MIN),
  0,
  1
);
```

海溫不應單獨決定強度，仍需考慮海洋熱含量、風切、水氣、結構及冷水尾流。

## 8.4 海洋熱含量

`oceanDepthFactor` 反映暖水層厚度：

- 暖水層深：較不易因攪拌快速降溫。
- 暖水層淺：慢速強颱容易產生明顯冷水尾流。

## 8.5 垂直風切因子

風切愈強：

- 對流中心愈易偏離。
- 對稱度下降。
- 組織度下降。
- 目標強度降低。

應採平滑函式，不以單一門檻突然令颱風消散。

## 8.6 水氣因子

相對溼度及西南季風共同影響：

- 對流持續性。
- 組織度。
- 降雨效率。
- 強度潛勢。

## 8.7 發展潛勢

可採：

```js
developmentPotential =
  heatFactor *
  oceanDepthFactor *
  shearFactor *
  moistureFactor *
  coriolisFactor *
  structureFactor *
  (1 - landPenalty) *
  (1 - coldWakePenalty);
```

所有因子必須限制於合理範圍，並在測試中覆蓋極端值。

## 8.8 目標強度與時間反應

禁止每一步固定寫：

```js
maxWind += 2;
```

建議：

```js
const tendency =
  (targetWind - currentWind) / intensityResponseHours;

currentWind += tendency * stepHours;
currentWind = clamp(currentWind, minWind, maxWindLimit);
```

另設定：

- 最大單步增強量。
- 最大單步減弱量。
- 快速增強仍需跨多個步進。
- 結構破壞後需時間恢復。

## 8.9 氣壓映射

中心氣壓由最大風速、組織度與緯度等簡化映射。要求：

- 風速增強時氣壓整體下降。
- 風速減弱時氣壓整體上升。
- 不出現不合理單步跳動。
- 有可設定上下限。
- 明確標示為遊戲化近似。

## 8.10 暴風半徑

受以下因素影響：

- 最大風速。
- 緯度。
- 組織度。
- 結構階段。
- 環境壓力場。
- 平滑延遲。

暴風半徑需有上下限，不得隨機劇烈抖動。

## 8.11 結構階段

```text
cluster   鬆散雲團
spiral    螺旋雨帶
comma     不對稱逗號狀
eye       颱風眼
decaying  衰減結構
```

結構切換需具門檻與遲滯，避免每一步反覆跳動。

## 8.12 模型參數目錄與校準

`docs/PHYSICS-MODEL.md` 必須為每個模型建立參數表，至少包含：

| 項目 | 必要內容 |
|---|---|
| 輸入 | 欄位、單位、合法範圍 |
| 輸出 | 欄位、單位、合法範圍 |
| 公式 | 完整公式或可追蹤的偽程式碼 |
| 常數 | 名稱、預設值、最小值、最大值 |
| 時間尺度 | 反應時間及步進換算 |
| 氣象概念 | 對應的教育概念 |
| 遊戲化簡化 | 與真實大氣的差異 |
| 校準情境 | 固定種子、初始條件、時長及預期範圍 |
| 已知限制 | 不可用於何種推論 |

常數需分為：

```text
physicalConstants
modelParameters
gameBalance
renderingConfig
performanceConfig
```

不得為了讓單一關卡通過而直接修改 `physicalConstants`；若調整模型或遊戲平衡，需記錄受影響的情境測試與黃金重播。

---

# 9. 導引氣流與移動模型

## 9.1 向量分離

不得以單一 `pressureField` 同時代表：

- 純量氣壓。
- 方向向量。
- 玩家控制值。

應分為：

```text
surfacePressure
steeringU
steeringV
```

## 9.2 導引向量組成

```js
steeringVector =
  backgroundFlow +
  subtropicalHighFlow +
  southwestMonsoonFlow +
  betaDrift +
  seededPerturbation;
```

## 9.3 太平洋副熱帶高壓

玩家可調整：

- 強度。
- 西伸邊界。
- 脊線緯度。

效果：

- 強且西伸時通常增加偏西導引。
- 東退或出現缺口時較易轉向。
- 控制值應先改變目標環境，再由環境逐步反應。

## 9.4 西南季風

同時影響：

- 西南至東北向導引分量。
- 環境水氣。
- 降雨。
- 季風槽形態。

## 9.5 β 漂移

在弱導引場時提供微弱背景漂移，不得大到掩蓋主要環境風。

## 9.6 玩家控制延遲

介面顯示：

- 玩家設定的目標值。
- 模型目前實際值。
- 估計反應時間。
- 趨勢箭頭。

玩家拖動滑桿後不得立即大幅改變颱風方向或強度。

## 9.7 移動限制

- 移動速度範圍 0～45 km/h。
- 方向及速度使用平滑處理。
- 單步位移由固定時間步進換算。
- 相同種子及輸入應產生相同路徑。
- 不得使用寫死的歷史路徑完成關卡。

---

# 10. 海陸、地形與冷水尾流

## 10.1 海陸事件

- 海洋 → 陸地：`LANDFALL`。
- 陸地 → 海洋：`SEA_REENTRY`。

每次事件記錄：

- 模擬時間。
- 經緯度。
- 地區。
- 最大風速。
- 中心氣壓。
- 暴風半徑。
- 當時移動方向及速度。

同一次穿越不得每一步重複觸發。

## 10.2 臺灣地形

至少區分：

- 西部平原。
- 中央山脈。
- 東部縱谷。
- 海岸山脈。

地形效果：

- 地表摩擦。
- 風速減弱。
- 組織度下降。
- 對稱度下降。
- 迎風坡抬升降雨。
- 背風雨影。
- 出海後重新組織延遲。

地形作用必須依時間積分，不能只因進入一個網格就瞬間扣除固定大量風速。

## 10.3 冷水尾流

冷水尾流強度受：

- 颱風強度。
- 移動速度。
- 在網格停留時間。
- 海洋熱含量。
- 初始海溫。

影響：

- 降低有效海溫與發展潛勢。
- 慢速強颱更明顯。
- 移動快速弱颱較弱。
- 隨時間逐步恢復。
- 關卡重啟時完整清除。

## 10.4 子段積分與作用範圍

- 若單一步路徑跨越海岸，必須估算各子段位於海洋及陸地的時間比例。
- 地形摩擦、結構破壞及出海恢復依子段時間積分，不得只以步進終點判定。
- 冷水尾流應作用於與暴風半徑相關的海洋網格範圍，不得只更新颱風中心所在單一網格。
- 地形抬升需考慮環境低層風向與簡化地形梯度；不得只因測站位於山區就固定加雨。
- 子段數量需有上限及最小距離規則，並納入效能測試。

---

# 11. 降雨與測站觀測

## 11.1 降雨率

```js
rainRate =
  radialRainFactor *
  moistureFactor *
  intensityFactor *
  monsoonFactor *
  terrainLiftFactor *
  asymmetryFactor;
```

雨量以時間積分：

```js
accumulatedRain +=
  hourlyRainRate *
  (SIMULATION_STEP_MINUTES / 60);
```

## 11.2 測站

第一版至少包含：

- 那霸。
- 臺北。
- 臺中。
- 日月潭。
- 花蓮。
- 澎湖。

可依關卡增加山區虛擬教學測站，但需清楚標示。

## 11.3 測站風速

由模型計算：

- 與中心距離。
- 暴風半徑。
- 最大風速。
- 風圈不對稱。
- 地形遮蔽。
- 測站暴露度。
- 持續風與陣風係數。

不得使用預先寫死的關卡數值假裝完成目標。

## 11.4 測站資料顯示

每站顯示：

- 距離颱風中心。
- 持續風。
- 最大陣風。
- 當前雨率。
- 累積雨量。
- 地形修正。
- 更新時間。

---

# 12. 關卡系統

## 12.1 歷史定位

所有關卡均為「歷史靈感」，不是精確歷史重建。

不得宣稱：

- 生成點完全等於真實生成點。
- 路徑完全等於真實路徑。
- 模型數值為官方觀測重播。
- 第三關韋恩「三次登陸」為精確歷史事實。

第三關以「三次進入臺灣近海警戒區」作為核心機制。

## 12.2 第一關：那霸風雨

```text
ID：naha-storm
歷史靈感：2018 潭美
生成點：14°N、145°E
初始最大風速：15 m/s
初始中心氣壓：1005 hPa
時限：168 模擬小時
```

主要目標：

- 颱風中心進入那霸 50 km 內。
- 那霸最大陣風達 45 m/s。
- 那霸累積雨量達 250 mm。
- 進入那霸 150 km 範圍時，最大風速至少 33 m/s。
- 在時限內完成。

失敗條件：

- 颱風離開地圖。
- 最大風速低於 8 m/s 並持續 12 小時。
- 超過時限。
- 抵達琉球前先進入中國大陸。

教學重點：

- 副高西伸。
- 暖海增強。
- 風切破壞。
- 冷水尾流。
- 控制延遲。

## 12.3 第二關：護國神山

```text
ID：mountain-shield
歷史靈感：2015 蘇迪勒
生成點：13.6°N、159.3°E
初始最大風速：16 m/s
初始中心氣壓：1004 hPa
時限：216 模擬小時
```

主要目標：

- 登陸臺灣本島。
- 首次登陸前最大風速達 48 m/s。
- 中部任一測站最大陣風達 35 m/s。
- 中部山區任一測站累積雨量達 600 mm。
- 從臺灣東側登陸。
- 從臺灣西側出海。

額外目標：

- 登陸前中心氣壓低於 940 hPa。
- 花蓮最大陣風達 45 m/s。
- 出海後重新增強至 25 m/s。
- 北部與中部同時達成豪雨門檻。

特殊機制：

- 中央山脈地形作用。
- 登陸後快速減弱。
- 西南氣流增強。
- 出海後重新組織。

## 12.4 第三關：韋恩三進

```text
ID：wayne-three-entries
歷史靈感：1986 韋恩
生成點：16°N、117°E
初始最大風速：18 m/s
初始中心氣壓：1002 hPa
時限：360 模擬小時
```

建立以 `23.70°N、120.95°E` 為中心、半徑 `400 km` 的臺灣近海教學警戒區。

狀態機：

```text
OUTSIDE
ENTERING
INSIDE
EXITING
```

一次有效進入必須：

1. 在警戒區外持續至少 6 小時。
2. 進入警戒區後持續至少 3 小時。
3. 完成後計數加一。
4. 離開警戒區至少 6 小時，才可開始下一次計數。

主要目標：

- 三次進入臺灣近海警戒區。
- 至少兩次登陸臺灣本島。
- 每次進入警戒區時最大風速至少 28 m/s。
- 三次事件期間，中部測站合計雨量達 400 mm。
- 任一次事件期間，中部最大陣風達 35 m/s。
- 在時限內完成。

失敗條件：

- 完全消散超過 18 小時。
- 深入中國內陸超過 300 km。
- 離開主要模擬範圍。
- 超過時限。

教學重點：

- 弱導引場。
- 環境場反覆改變。
- 多次進出。
- 警戒區遲滯判定。
- 冷水尾流與重新組織。

## 12.5 Objective／Failure DSL

關卡目標及失敗條件不得以顯示文字或關卡專用 `if` 散落在 UI。第一版 DSL 至少能表達：

```js
{
  id: 'naha-proximity',
  metric: 'storm.distanceToStation',
  subject: 'naha',
  operator: '<=',
  threshold: 50,
  unit: 'km',
  durationSteps: 1,
  aggregation: 'minimum',
  prerequisite: null,
  duringEvent: null,
  once: true
}
```

Schema 必須定義：

- 支援的 metric 白名單。
- `subject` 可引用的 station、region、zone 或 storm ID。
- 比較運算子。
- 聚合方式。
- 連續持續時間。
- 統計視窗。
- 前置目標。
- 事件期間限制。
- 是否一經達成即永久保留。
- 重啟、切換關卡及載入重播時的重設規則。
- 同一步勝敗仲裁規則。

Evaluator 只能解讀白名單 DSL，不得使用 `eval`、`Function` 或執行資料中的任意程式碼。

## 12.6 第一版關卡地理定義

- 韋恩關卡警戒區中心固定為 `23.70°N, 120.95°E`，半徑固定為 `400 km`。
- 此圓形區域為教育模型設定，不代表任何官方海上警戒區或警報範圍。
- 距離 `<= 400 km` 視為區內，使用 Haversine 距離。
- 警戒區狀態及停留時間以整數 step 計算；6 小時為 36 steps，3 小時為 18 steps。
- 臺灣東側登陸／西側出海依地圖 `regionId` 與岸段 `coastSide` 判定，不以單純經度門檻代替。
- 「中部測站」第一版至少包含 `taichung`、`sun-moon-lake`。
- 「中部山區測站」第一版包含 `sun-moon-lake`；若新增虛擬站，需標示 `isVirtual: true` 與教育用途。
- 「中國大陸」失敗條件需引用獨立 `china-mainland` region；海南、臺灣、香港、澳門及離島不得因共用顯示名稱而被誤判。
- 「抵達琉球」需引用明確的 `ryukyu` region 或目標 zone，不得由地名字串判斷。

## 12.7 關卡可完成性與黃金重播

每個關卡在標記 completed 前，必須保存至少一份由正式模型產生的黃金重播 fixture，包含：

- `schemaVersion`、`modelVersion`、PRNG 版本及種子。
- 初始環境及合法控制範圍。
- 以 `stepIndex` 記錄的操作序列。
- 預期關鍵事件、勝利步數及結果 fingerprint。
- 允許的跨瀏覽器數值容差。

黃金重播只作可完成性與回歸驗證，不得在正式遊戲中硬編碼路徑、數值或勝利結果。

---

# 13. 沙盒模式

沙盒模式不設勝敗，允許設定：

- 生成位置。
- 初始最大風速。
- 初始中心氣壓。
- 初始組織度。
- 初始對稱度。
- 海表溫度。
- 海洋熱含量。
- 副高強度。
- 副高西伸邊界。
- 副高脊線緯度。
- 垂直風切。
- 西南季風。
- 環境水氣。
- 地形摩擦倍率。
- 亂數種子。

沙盒支援：

- 暫停。
- 倍速。
- 重啟。
- 圖層切換。
- 後台匯出與匯入預設資料。
- 數值檢視。
- 重播資料產生。

不得允許不經驗證的 JSON 直接修改程式物件。
氣象 JSON、CSV、PNG 與資料匯入／匯出屬開發、教學備課或驗證用後台能力，
不得在第一版玩家前端顯示入口、按鈕或檔案選擇器。

---

# 14. UI／UX

## 14.1 桌面配置

- 第一、二象限：主 Canvas 擬真地圖位於上方並橫跨整個內容寬度，關卡目標、
  模擬時間與地圖說明隨地圖呈現。
- 第三象限：下方左側以戰況資訊為主，包含颱風、環境因子、測站觀測、
  地圖查詢與效能診斷。
- 第四象限：下方右側集中玩家參數輸入與操作，包含任務選擇、環境調度、
  沙盒設定及顯示設定。
- 第四象限下緣：優先保留開始、暫停、重新部署與時間推進速度等即時操作。
- 桌面及橫向小螢幕的下方兩象限等高，各自提供捲動內容，避免任一側形成
  大面積無功能空白；只有寬度不足以維持可讀性時才依地圖、戰況資訊、
  參數操作順序改為垂直排列。
- 頁首：品牌及系統狀態。

## 14.2 控制面板

每個控制項顯示：

- 名稱。
- 目標值。
- 實際值。
- 單位。
- 教育提示。
- 合理範圍。
- 是否為本關可調項目。

## 14.3 儀表板

颱風資訊：

- 名稱。
- 經緯度。
- 最大風速。
- 中心氣壓。
- 暴風半徑。
- 移動速度。
- 移動方向。
- 海溫。
- 海洋熱含量。
- 風切。
- 水氣。
- 組織度。
- 對稱度。
- 結構階段。
- 是否在陸地。
- 強度趨勢。

測站資訊：

- 持續風。
- 陣風。
- 雨率。
- 累積雨量。
- 與中心距離。

## 14.4 Canvas 圖層順序

由底至頂：

1. 海洋背景。
2. 海溫或環境底圖。
3. 經緯線。
4. 陸地與地形。
5. 壓力場及副高。
6. 導引風箭頭。
7. 冷水尾流。
8. 降雨。
9. 測站。
10. 颱風軌跡。
11. 颱風主體。
12. 粒子。
13. 目標區與警戒區。
14. 游標、提示及選取資訊。

## 14.5 高 DPI

- Canvas 內部像素依 `devicePixelRatio` 調整。
- 比例上限 2。
- CSS 尺寸與內部繪圖尺寸分離。
- 文字及線條不得因縮放模糊。
- ResizeObserver 或等效機制重算尺寸。

## 14.6 響應式與觸控

- 觸控目標至少 44×44 px。
- 平板橫向完整操作。
- 直向顯示重新排列或橫向提示。
- 不依賴 hover 才能取得重要資訊。
- 滑桿需支援鍵盤與觸控。

## 14.7 無障礙

- 所有控制項有 `label`。
- 鍵盤可操作。
- 焦點狀態清楚。
- 不只靠顏色表示狀態。
- Canvas 旁提供文字摘要。
- 支援 `prefers-reduced-motion`。
- 減少動態模式降低粒子、閃爍與旋轉。
- 錯誤訊息使用 `aria-live`。
- 重要文字具可讀對比。

## 14.8 可量化介面驗收

- 版面以可用 CSS viewport 判定，不使用 user-agent 字串決定。
- 寬度 `>= 1180 px` 且高度 `>= 650 px`：顯示完整三區桌面版面。
- 寬度 `768～1179 px`：採可操作的平板重排版面。
- 寬度 `< 768 px`：提供簡化控制或明確橫向提示；非預報聲明及暫停仍可存取。
- 一般文字與背景對比至少 4.5:1；大型文字至少 3:1；焦點與非文字控制符合 WCAG AA 對比。
- 觸控目標以實際渲染框測量，不得只以 CSS 宣告推測達到 44×44 px。
- 滑桿必須提供鍵盤步距、數值文字、單位、最小值、最大值及重設方式。
- Space 控制暫停／繼續，但焦點位於輸入元件時不得攔截瀏覽器預設輸入行為。
- Canvas 的文字摘要至少在每個模擬步或可設定節流間隔更新，重要事件立即更新。
- 第一版主要介面語言為繁體中文；英文專案名稱及必要專有名詞可並列。未實作完整多語系前不得顯示無功能的語言切換器。

---

# 15. 視覺與粒子

粒子僅作為視覺化，不得參與物理計算。

粒子可呈現：

- 雲團旋轉。
- 螺旋雨帶。
- 對流爆發。
- 颱風眼。
- 登陸後結構破壞。
- 風切造成偏心。

要求：

- 粒子數依效能分級。
- 不得每幀大量配置新物件。
- 不得因粒子亂數改變模擬結果。
- 粒子亂數與物理亂數可使用不同種子流。
- 關閉粒子後，物理結果完全一致。

---

# 16. 評分系統

每關基礎分由：

- 主要目標完成度。
- 額外目標。
- 時間效率。
- 控制穩定度。
- 強度管理。
- 路徑精度。
- 測站影響達成度。

扣分項：

- 頻繁極端調整。
- 颱風無效繞行。
- 長時間停滯造成過度冷水尾流。
- 不必要登陸。
- 超出安全數值範圍的嘗試。

評分必須可解釋，結算畫面列出各項分數，不得只顯示總分。

## 16.1 評分資料規格

每個 Level 的 `scoring` 必須明定：

- 各主要目標、額外目標的基礎分。
- 時間效率、控制穩定度、強度管理及路徑精度的公式。
- 各扣分項的門檻、曲線及上限。
- 總分下限、上限及四捨五入方式。
- 同分排序規則；第一版不設網路排行榜時仍需固定。
- 相同模型版本、種子及操作序列必須得到相同分數。

不得以未顯示的隱藏規則扣分。結算需列出每一項原始量、公式結果、加扣分及總和。

---

# 17. 具種子亂數與可重現性

## 17.1 規則

- 禁止在模擬模組直接使用 `Math.random()`。
- 建立具種子的 PRNG。
- 關卡固定預設種子。
- 沙盒可輸入種子。
- 物理亂數與視覺亂數分離。
- 相同版本、種子、初始條件及操作序列應產生相同結果。

## 17.2 操作紀錄

為支援重播與除錯，記錄：

```js
{
  stepIndex: 12,
  simulationMinutes: 120,
  sequence: 1,
  control: 'subtropicalHigh.strength',
  value: 0.8
}
```

操作紀錄可與種子一併匯出。

`stepIndex` 與 `sequence` 為重播權威排序；`simulationMinutes` 只供閱讀及匯出顯示。重播不得依事件被記錄時的牆鐘時間。

---

# 18. 儲存、匯入與匯出

本章定義後台資料能力與安全契約。第一版玩家前端不得顯示 JSON、CSV、PNG
或其他氣象資料匯入／匯出控制；自動測試、內部模組與未來經批准的教師工具
仍可使用本章能力。

## 18.1 localStorage

第一版固定使用命名空間 key：

```text
sgts-nh:state:v1
```

```js
{
  version: 1,
  unlockedLevels: [],
  bestScores: {},
  settings: {},
  lastSandboxPreset: {},
  tutorialCompleted: false
}
```

要求：

- 有版本號。
- 有 schema 驗證。
- 損壞時安全回復預設值。
- 不得因舊資料使網站無法啟動。
- 不儲存敏感個資。
- 處理容量不足、存取被拒及私人瀏覽限制。
- 寫入前建立完整可驗證的新值；失敗時保留上一份有效資料。

## 18.2 匯出格式

### 軌跡 CSV

至少包含：

- 模擬時間。
- 緯度。
- 經度。
- 最大風速。
- 中心氣壓。
- 暴風半徑。
- 移動速度。
- 移動方向。
- 組織度。
- 對稱度。
- 結構階段。
- 是否在陸地。

### 模擬 JSON

包含：

- 版本。
- schemaVersion、modelVersion、PRNG 演算法版本及建置 commit。
- 關卡或沙盒設定。
- 種子。
- 操作紀錄。
- 軌跡。
- 事件。
- 測站統計。
- 結果。

### Canvas PNG

包含：

- 地圖。
- 軌跡。
- 當前颱風。
- 關卡或沙盒名稱。
- 模擬時間。
- 品牌識別。
- 非預報用途註記。

### 文字摘要

包含：

- 模擬設定。
- 路徑概述。
- 最大強度。
- 登陸事件。
- 測站影響。
- 目標結果。
- 教育提示。

## 18.3 匯入安全

驗證：

- 版本。
- 必要欄位。
- 型別。
- 經緯度。
- 數值上下限。
- 陣列長度。
- 檔案大小及物件巢狀深度。
- 未知欄位及原型污染欄位。
- 不允許任意程式碼或 HTML 執行。
- 不使用 `eval` 或 `Function`。

額外要求：

- 匯入上限由 `config.js` 集中設定，並由後台工具顯示可接受檔案大小。
- 拒絕 `__proto__`、`prototype`、`constructor` 等可能污染原型鏈的輸入位置。
- 驗證成功後建立新的內部物件，不得直接 `Object.assign` 至既有狀態。
- CSV 符合 RFC 4180；任何可能由使用者控制的文字欄位需防止試算表公式注入。
- 下載檔名需經白名單清理並包含專案縮寫、模式及模擬日期。
- Canvas 素材必須同源或明確允許跨來源 Canvas 使用，避免污染 Canvas 導致 PNG 無法匯出。

---

# 19. 效能要求

建議粒子分級：

```text
低：300
中：700
高：1200
```

目標：

- 中階桌面裝置在中等畫質接近 60 FPS。
- iPad 在低至中等畫質保持可操作。
- 單次固定物理步進不造成長任務。
- 靜態地圖快取於離屏 Canvas。
- 不每幀重新解析 GeoJSON。
- 不每幀建立大量短命物件。
- 隱藏分頁時暫停渲染。
- 切回時不無限制補算。
- 可顯示 FPS 與效能診斷。

## 19.1 效能驗收紀錄

Phase 9 應在 `docs/TESTING.md` 記錄參考裝置、OS、瀏覽器版本、畫質、粒子數、測試關卡、模擬倍速及測量時長。

最低量化目標：

- 參考桌面裝置、中畫質、700 粒子、1×：中位 FPS 至少 55，1% low 至少 30。
- 參考平板、低畫質、300 粒子、1×：中位 FPS 至少 30，操作無持續阻塞。
- 桌面單次物理固定步進的第 95 百分位低於 4 ms。
- 正常 1× 執行期間不得持續產生超過 50 ms 的 Long Task。
- 切回隱藏分頁時，單畫格執行步數不得超過設定上限。
- 效能未達標時可降低預設粒子或視覺畫質，但不得改變物理結果。

若無法取得指定類型裝置，必須標記為未驗證，不得用桌面視窗縮放冒充平板實機。

---

# 20. 測試策略

## 20.1 單元測試

至少覆蓋：

- clamp、lerp、smoothstep。
- PRNG。
- Haversine。
- 座標轉換。
- point-in-polygon。
- 線段交會。
- 強度因子。
- 雨量積分。
- 冷水尾流恢復。
- 狀態機。
- schema 驗證。

## 20.2 整合測試

至少覆蓋：

- 固定時間步進。
- 暫停與倍速。
- 60 Hz／120 Hz 一致性。
- 海陸事件。
- 中央山脈穿越。
- 測站觀測。
- 目標與失敗條件。
- 關卡重啟。
- 關卡切換。
- localStorage 損壞恢復。
- JSON 匯入與匯出。

## 20.3 情境測試

1. 1°N、暖海、低風切：不應快速成熟。
2. 15°N、暖海、低風切：可逐步增強。
3. 高風切：對稱度及組織度下降。
4. 低海溫：逐步減弱。
5. 強副高西伸：路徑偏西。
6. 副高東退：較易轉向。
7. 強西南季風：增加東北向分量及水氣。
8. 慢速強颱：冷水尾流顯著。
9. 快速弱颱：冷水尾流較弱。
10. 穿越中央山脈：強度及對稱度下降。
11. 迎風坡雨量高於背風側。
12. 警戒區邊界抖動：不重複計數。

上述「快速」、「逐步」、「顯著」、「較弱」、「較易」等描述只代表測試意圖。每個情境實作時必須在 fixture 定義固定種子、初始狀態、操作、模擬時長、取樣點、數值上下限及容差；未量化前不得將該情境標為自動驗收通過。

## 20.4 測試誠信

Codex 不得：

- 宣稱未執行的測試已通過。
- 以手動目視代替已要求的自動測試。
- 暫時註解失敗測試來取得綠燈。
- 用固定數值避開真實模擬問題。
- 隱瞞 Safari 或 GitHub Pages 尚未驗證。

## 20.5 共通不變量測試

所有可推進模擬的測試至少檢查：

- 任何公開數值不得為 `NaN`、`Infinity` 或 `-Infinity`。
- 經緯度、風速、氣壓、半徑、溼度、組織度、對稱度及網格值不得超出 schema。
- `stepIndex` 必須單調增加；暫停時不得增加。
- 事件 ID 唯一，轉換事件不得每一步重複發送。
- 物理模組不得直接使用 `Math.random()`。
- 關閉粒子、改變畫質或 resize 不得改變物理 fingerprint。
- 重啟後不得殘留網格、測站、事件、目標、PRNG 或操作紀錄狀態。

## 20.6 靜態與內容檢查

自動檢查至少包含：

- JavaScript lint 及語法。
- JSON schema。
- 禁止絕對根資源路徑。
- 禁止未核准的遠端執行資源。
- 品牌字串完全一致。
- 非預報聲明存在。
- `lon` 命名一致。
- 不追蹤 `.DS_Store`、`._*`、測試輸出、金鑰及 `node_modules`。
- Pages artifact 不含開發檔案。

## 20.7 CI 導入時序

- Phase 0：建立 npm 指令、基礎測試及本機靜態伺服器。
- Phase 1：建立 `.github/workflows/test.yml`，執行 lint、單元測試及適用的整合測試。
- Phase 2～8：逐 Phase 擴充測試矩陣；只有取得 push 授權時才可將 workflow 推至 GitHub 執行。
- Phase 9：完成跨瀏覽器、自動化 E2E、效能、Pages artifact 與部署 workflow。

沒有 push 授權或 GitHub workflow 尚未執行時，完成報告必須標記 GitHub Actions 為「未執行」，不得用本機結果代替。

## 20.8 瀏覽器驗證矩陣

報告必須分開記錄：

| 類型 | 可證明範圍 |
|---|---|
| 自動 Chromium | Chromium 引擎與自動 E2E |
| 自動 WebKit | Playwright WebKit 或等效模擬環境 |
| 實際 Chrome | 指定 Chrome 版本的人工／自動 smoke test |
| 實際 Edge | 指定 Edge 版本的人工／自動 smoke test |
| 實際 macOS Safari | 實際 Safari |
| 實際 iPadOS Safari | 實體 iPad 或經批准的真實裝置服務 |
| GitHub Pages production | 正式 URL、子路徑、Console、下載及儲存 |

自動 WebKit 不等於實際 macOS Safari 或 iPadOS Safari。桌面視窗模擬觸控也不等於 iPadOS 實機驗證。

---

# 21. 安全、版權與資料來源

- 不收集個資。
- 不使用秘密 API 金鑰。
- 不把 `.env` 提交到 Git。
- 不加入未授權地圖、圖示、照片或音效。
- 公開資料需記錄來源與授權。
- 不直接複製官方預報圖或受保護圖像作為遊戲底圖。
- 歷史數值只作關卡靈感與背景說明時，應標示來源。
- 模型常數與玩法規則應明確標示為簡化。
- 第三方授權應整理至 README 或 attribution 文件。
- 網頁不得冒用官方氣象機構識別。

`docs/SOURCES.md` 必須為每筆外部資料或科學參考記錄：

- 名稱、發布者、原始網址。
- 存取日期及版本／發布日期。
- 授權或使用條款。
- 專案實際使用的欄位或概念。
- 是否經簡化、重新繪製或衍生。
- 本地檔案路徑及完整性摘要。

無法確認授權或來源的素材不得提交或部署。歷史關卡數值若為遊戲化初始條件，需明確標示為「模型設定」，不得暗示為官方逐時觀測。

---

# 22. Git、分支與提交規範

## 22.1 倉庫

```text
GitHub owner：kisaraki
Repository：classroom-sgts-nh-tzk
Remote：https://github.com/kisaraki/classroom-sgts-nh-tzk.git
Pages：https://kisaraki.github.io/classroom-sgts-nh-tzk/
Default branch：main
```

若本機尚未建立倉庫，Phase 0 應：

1. 建立同名資料夾。
2. `git init`。
3. 建立 `main`。
4. 連接 `origin`。
5. 不得刪除或覆蓋同名遠端倉庫內容，除非使用者另行明確授權。
6. 若遠端不存在，先回報查詢結果；取得「建立公開 GitHub 倉庫」明確授權後，才可依使用者現有權限建立。
7. 啟用 GitHub Pages 的動作留至 Phase 9。

## 22.2 Phase 分支

建議：

```text
phase/00-foundation
phase/01-engine-ui
phase/02-map-geography
phase/03-intensity
phase/04-steering
phase/05-land-rain
phase/06-level-naha
phase/07-levels-taiwan-wayne
phase/08-sandbox-export
phase/09-release
phase/10-expansion
```

每個 Phase 以獨立分支開發。使用者批准後才合併至 `main` 或進入下一 Phase。

## 22.3 Commit 格式

```text
chore(phase-0): initialize project foundation
feat(phase-1): implement fixed-step engine
feat(map): add geographic coordinate system
fix(intensity): constrain timestep response
test(levels): add warning-zone hysteresis tests
docs: update SGTS-NH master specification
```

## 22.4 禁止提交

- `.DS_Store`
- 編輯器暫存。
- 本機快取。
- 測試產出。
- 個資。
- API 金鑰。
- 未授權素材。
- 大型來源檔。
- 無用途的二進位檔。

## 22.5 Merge、Push 與 CI

- Phase 完成 commit 不等於 Phase 批准。
- Phase 批准後可依第 0.5 節記錄批准並合併至本機 `main`。
- 本機 merge 不等於 push 授權。
- 沒有明確 push 授權時，保留本機 commit 並將 GitHub Actions 標記為未執行。
- 若使用者批准「合併並 push 已批准 Phase」，只可 push 已批准內容，不得夾帶下一 Phase 或無關變更。
- 建議在每個 Phase 批准後 push `main` 並執行測試 workflow；Pages production 仍只在 Phase 9 部署。
- Push 前必須重新確認 remote URL、分支、待推 commits、工作樹及測試。

---

# 23. GitHub Pages 發布規格

正式發布採 GitHub Pages。

建議流程：

1. GitHub Actions 執行測試。
2. 建立靜態 artifact。
3. 部署 Pages。
4. 驗證子目錄資源。
5. 執行 smoke test。
6. README 加入正式網址。

部署驗收：

- 首頁可載入。
- ES Modules 無 MIME 或路徑錯誤。
- JSON 與地圖資源可載入。
- Console 無 404。
- 重新整理子頁不造成錯誤；第一版建議單頁入口。
- Safari 可操作。
- 下載匯出可運作。
- 頁首與頁尾保留 `KOSMOS TOOLKIT｜探真拓知酷`。
- 非預報用途聲明可見。

## 23.1 GitHub Actions 與發布治理

- `test.yml` 預設只需 `contents: read`。
- Pages workflow 只授予必要的 `contents: read`、`pages: write`、`id-token: write`。
- 第三方 Actions 必須使用已審查的固定 major／commit；選擇方式記錄於 `docs/DECISIONS.md`。
- 測試與部署 job 分離；測試失敗不得部署。
- 部署 artifact 不得包含 `.git`、`node_modules`、tests、本機設定、Secrets 或來源素材。
- Phase 9 正式批准後建立 `v1.0.0` annotated tag 及 release notes；tag 與 push 仍受第 0.4 節授權控制。
- `docs/DEPLOYMENT.md` 必須記錄重新部署上一個已知良好 commit 的回復程序。
- 正式驗收報告需記錄 source commit、workflow run、deployment ID、正式 URL 及驗證時間。

---

# 24. 第一版總驗收條件

第一版完成必須同時符合：

1. GitHub 倉庫名稱為 `classroom-sgts-nh-tzk`。
2. GitHub owner 為 `kisaraki`。
3. GitHub Pages 可由指定網址開啟。
4. 品牌固定為 `KOSMOS TOOLKIT｜探真拓知酷`。
5. 首頁、頁尾、README 與主要文件均有品牌識別。
6. 三個關卡均可開始、勝利、失敗及重啟。
7. 沙盒模式可使用。
8. 固定時間步進不依賴 FPS。
9. 暫停時物理完全停止。
10. 倍速不改變單步公式。
11. 相同種子及操作可重現。
12. 颱風路徑由環境導引，不是寫死。
13. 玩家不能直接拖動颱風。
14. 科氏效應不直接當作風速加成。
15. 登陸事件不重複。
16. 中央山脈作用可觀察。
17. 冷水尾流可形成與恢復。
18. 雨量依時間正確積分。
19. 測站數值由模型產生。
20. 韋恩關卡使用「三次進入警戒區」而非錯稱三次登陸。
21. localStorage 損壞不使程式崩潰。
22. 匯入資料經驗證。
23. 匯出 CSV、JSON、PNG 與摘要可用。
24. Chrome、Edge、macOS Safari、iPadOS Safari 完成驗證。
25. Console 無持續錯誤。
26. 非預報用途聲明可見。
27. 所有必要測試通過。
28. 所有 Phase 均有使用者批准紀錄。
29. 未取得使用者批准時，Codex 不得自動進入下一 Phase。
30. 最終未通過任何必要項目時，不得宣稱正式完成。
31. 本機、GitHub Actions、Pages 部署及公開網站驗證分開記錄。
32. 所有匯出包含 schemaVersion、modelVersion、PRNG 版本及可追蹤建置資訊。
33. 三關各有一份由正式模型產生並通過的黃金重播。
34. Requirement ID 與測試、Phase、驗收證據可追蹤。
35. 發布 artifact 不含測試、本機設定、Secrets 或開發依賴。

---

# 25. Codex 共通執行指令

以下指令適用於 Phase 0～10。

## 25.1 角色

你是一位資深前端遊戲工程師、JavaScript 架構師、科學教育模擬系統開發者、測試工程師與 GitHub Pages 維護者。

## 25.2 每次開始前

1. 閱讀本文件。
2. 閱讀 `AGENTS.md`。
3. 檢查 `docs/PHASE-STATUS.md`。
4. 檢查目前分支。
5. 執行 `git status`。
6. 檢查現有檔案，不得假設專案為空。
7. 執行既有測試。
8. 確認上一 Phase 是否已由使用者明確批准。
9. 若未批准，立即停止，不得開始下一 Phase。
10. 列出本次預計新增及修改的檔案。
11. 確認本次是否包含遠端建立、push、GitHub 設定或部署，並核對相應授權。
12. 記錄本機 Node.js／npm 及適用瀏覽器版本。

## 25.3 實作時

- 僅處理目前 Phase。
- 採小步、可測試、可回復的修改。
- 不提前建立後續 Phase 功能。
- 不把假資料冒充模擬結果。
- 不擅自改變品牌、倉庫、技術棧或範圍。
- 發現規格矛盾時，記錄於 `docs/DECISIONS.md`。
- 重大變更先停止並向使用者說明，不得自行重寫核心規格。

## 25.4 完成時

1. 執行本 Phase 指定測試。
2. 執行既有回歸測試。
3. 執行靜態伺服器 smoke test。
4. 檢查 Console。
5. 更新文件。
6. 更新 `docs/PHASE-STATUS.md` 為 `completed`，不可直接寫 `approved`。
7. 建立適當 commit。
8. 提交完成報告。
9. 停止。
10. 要求使用者批准下一 Phase。
11. 分開報告本機測試、GitHub Actions、Pages API／部署及公開網站驗證。
12. 沒有相應授權或環境時標記為未執行／未驗證，不得視為失敗或通過。

---

# Phase 0：倉庫初始化、規格落地與架構文件

## 目標

建立 `classroom-sgts-nh-tzk` 專案骨架、品牌識別、長期指令、文件與測試基礎。本階段不實作完整颱風模擬。

## 建議分支

```text
phase/00-foundation
```

## 貼給 Codex 的執行指令

```text
請執行 Phase 0：倉庫初始化、規格落地與架構文件。

專案身份：
- 中文名稱：風暴創世神：北半球颱風模擬器
- 英文名稱：Storm Genesis: Northern Hemisphere Typhoon Simulator
- 縮寫：SGTS-NH
- 第一版：西北太平洋篇
- GitHub owner：kisaraki
- GitHub repository：classroom-sgts-nh-tzk
- 品牌識別：KOSMOS TOOLKIT｜探真拓知酷

先閱讀 SGTS-NH_MASTER_SPEC.md。檢查本機與遠端 Git 狀態，不得覆蓋既有成果。
本 Phase 僅建立基礎、文件與最小可啟動頁面，不得實作完整地圖、颱風物理、關卡或沙盒。

若指定 GitHub 遠端不存在，必須先取得建立公開倉庫的明確授權；Phase 0 執行批准本身不自動包含遠端建立、push 或部署。
若使用者未授權建立遠端，Phase 0 仍可完成本機骨架與 commit，但 GitHub 倉庫狀態必須標為「未建立／未驗證」，且最遲須在 Phase 9 發布前解除。

請：
1. 建立或確認 Git 倉庫與 main 分支。
2. 建立 phase/00-foundation 分支。
3. 建立規格指定的目錄結構。
4. 建立 README.md、AGENTS.md、LICENSE、.gitignore、.editorconfig。
5. 建立 docs/ARCHITECTURE.md、PHYSICS-MODEL.md、DATA-SCHEMA.md、
   TESTING.md、DEPLOYMENT.md、SOURCES.md、DECISIONS.md、PHASE-STATUS.md。
6. 所有主要文件加入「KOSMOS TOOLKIT｜探真拓知酷」頁首識別。
7. README 明列 GitHub owner、repository、Pages 預定網址及非預報聲明。
8. 建立 index.html、css 基礎檔、js/app.js、js/config.js。
9. 最小頁面顯示專案名稱、第一版篇章、品牌識別與非預報聲明。
10. 建立 package.json、package-lock.json 及 scripts/serve.mjs；Node.js 只作開發工具。
11. 建立 npm scripts 與 foundation test，但不要假裝已有完整測試。
12. 在 TESTING 建立需求追蹤表、測試分類、瀏覽器矩陣及未執行標記規則。
13. 在 DATA-SCHEMA 建立單位字典及 schemaVersion／modelVersion 規則。
14. 檢查相對路徑、ES Modules 及 GitHub Pages 子路徑相容性。
15. 更新 PHASE-STATUS：Phase 0 = completed，其他 = pending。
16. 執行 lint、基礎測試及本機靜態伺服器 smoke test；檢查 Console。
17. 建立 Phase 0 commit。
18. 分開回報本機、GitHub Actions、Pages 與公開網站狀態。
19. 依完成報告格式回覆並停止。

驗收條件：
- 倉庫名稱與 owner 正確。
- 品牌識別完全正確，使用單數 TOOLKIT。
- 文件存在且彼此一致。
- index.html 可由本機靜態伺服器開啟。
- Console 無錯誤。
- npm 指令存在、package-lock 可重現，且正式頁面不依賴 Node.js 執行。
- 未提前實作 Phase 1 以後功能。
- PHASE-STATUS 不得自行把 Phase 0 標記為 approved。
- 沒有授權時不得建立遠端、push 或部署。

完成後必須停止並詢問：
「是否批准 Phase 0，並進入 Phase 1：基礎介面與固定時間步進引擎？」
未取得明確批准前不得開始 Phase 1。
```

---

# Phase 1：基礎介面與固定時間步進引擎

## 進入條件

`docs/PHASE-STATUS.md` 中 Phase 0 必須為 `approved`。

## 建議分支

```text
phase/01-engine-ui
```

## 貼給 Codex 的執行指令

```text
請執行 Phase 1：基礎介面與固定時間步進引擎。

開始前：
1. 確認 Phase 0 已由使用者批准。
2. 更新 PHASE-STATUS 的批准紀錄。
3. 檢查現有測試及 Git 狀態。
4. 建立 phase/01-engine-ui 分支。

本 Phase 只建立遊戲狀態、固定時間步進、基礎 Canvas 與響應式版面。
不得提前實作地圖、正式強度模型、導引氣流、關卡或沙盒。

建立：
- js/core/GameEngine.js
- js/core/SimulationClock.js
- js/core/StateMachine.js
- js/core/EventBus.js
- js/utils/math.js
- js/utils/validation.js
- tests/engine-tests.html
- tests/test-runner.js
- .github/workflows/test.yml

實作：
- BOOT、MENU、TUTORIAL、RUNNING、PAUSED、VICTORY、FAILURE、ERROR。
- 10 模擬分鐘固定步進。
- 累積器。
- 單畫格最大補算步數。
- 分頁切回時間差截斷。
- 暫停、1×、4×、12×、24×。
- 模擬更新與渲染分離。
- 高 DPI Canvas，devicePixelRatio 上限 2。
- 桌面三區、平板上下排列、窄螢幕提示。
- 44 px 以上觸控目標。
- Canvas 暫時顯示 FPS、模擬時間、狀態與地圖範圍文字。
- 啟動錯誤時切換 ERROR 並顯示可讀訊息。
- 頁首與頁尾保留 KOSMOS TOOLKIT｜探真拓知酷。

測試：
- 合法與非法狀態切換。
- 暫停後模擬時間不增加。
- 不同 FPS 執行相同步數結果一致。
- 倍速不改變單一步進時間。
- 最大補算步數有效。
- 切換分頁不造成大量補算。
- 分頁隱藏時物理及渲染暫停，切回不補算隱藏期間。
- Canvas resize 後尺寸正確。
- 同一步多操作及事件順序穩定。
- 本機 test workflow 定義可通過；只有取得 push 授權時才回報 GitHub Actions 實際結果。

完成後：
- 更新文件。
- 將 Phase 1 標為 completed，不得標為 approved。
- 建立 commit。
- 回報實際測試。
- 停止。

最後詢問：
「是否批准 Phase 1，並進入 Phase 2：地圖、座標與地理系統？」
未取得明確批准前不得開始 Phase 2。
```

---

# Phase 2：地圖、座標與地理系統

## 進入條件

Phase 1 已由使用者批准。

## 建議分支

```text
phase/02-map-geography
```

## 貼給 Codex的執行指令

```text
請執行 Phase 2：地圖、座標與地理系統。

本 Phase 只處理地圖、座標、測站位置及海陸判定。
不得提前完成颱風強度、導引氣流、降雨或關卡。

建立：
- js/rendering/CanvasRenderer.js
- js/rendering/MapRenderer.js
- js/rendering/FieldRenderer.js
- js/data/geography.js
- js/data/stations.js
- js/utils/geo.js
- assets/maps/northwest-pacific.json

實作：
- 地圖範圍 100°E～160°E、0°N～40°N。
- 經緯度與 Canvas 座標雙向轉換。
- Haversine 距離。
- 方位角。
- 由距離及方向推算新座標。
- point-in-polygon。
- 線段與多邊形交會。
- 簡化臺灣、中國東南沿岸、菲律賓、海南、琉球、日本與越南北部輪廓。
- 地圖檔加入格式版本、來源、授權、簡化方式及產生日期。
- 陸地使用穩定 regionId；臺灣岸段標記 coastSide。
- 每 5 度主經緯線。
- 那霸、臺北、臺中、日月潭、花蓮、澎湖測站。
- 點選或觸控地圖顯示經緯度、海陸、最近測站及距離。
- 所有經度欄位統一 lon。
- 地圖資料與渲染程式分離。

測試：
- 已知點 Haversine。
- 四個地圖角落。
- 座標 round trip。
- 臺灣內部與東側海面海陸判定。
- 線段跨越臺灣交會。
- 海岸線邊界及 polygon 頂點判定。
- 地圖來源及授權欄位完整。
- 所有測站位於範圍內。
- Canvas resize 後點選位置不偏移。

完成後更新文件、PHASE-STATUS、commit、完成報告並停止。
最後詢問：
「是否批准 Phase 2，並進入 Phase 3：颱風實體與強度模型？」
未批准不得開始 Phase 3。
```

---

# Phase 3：颱風實體與強度模型

## 進入條件

Phase 2 已由使用者批准。

## 建議分支

```text
phase/03-intensity
```

## 貼給 Codex 的執行指令

```text
請執行 Phase 3：颱風實體與強度模型。

本 Phase 的颱風可固定位置或使用簡單測試位移；不得提前建立正式導引氣流。

建立：
- js/model/Typhoon.js
- js/model/Environment.js
- js/model/GridCell.js
- js/simulation/IntensityModel.js
- js/rendering/TyphoonRenderer.js
- js/rendering/TrackRenderer.js
- js/rendering/ParticleRenderer.js
- js/utils/random.js

實作：
- Typhoon 完整欄位、trackHistory、eventHistory。
- 具種子的 PRNG；禁止物理模組直接使用 Math.random()。
- 固定 PRNG 演算法版本及 intensity、steering、environment、visual 子流。
- 海溫、海洋熱含量、科氏組織、風切、水氣、地形、冷水尾流因子。
- 發展潛勢。
- 目標強度與時間反應。
- 最大單步增強與減弱限制。
- 最大風速及最低活動風速。
- 氣壓與風速遊戲化映射。
- 暴風半徑。
- cluster、spiral、comma、eye、decaying。
- 結構切換遲滯。
- 不同結構 Canvas 表現。
- 粒子只作視覺，不參與物理。
- 儀表板顯示強度與環境因子。
- 科氏效應不得直接當風速加成。
- 所有常數集中 config.js。

測試：
- 1°N 暖海低風切不快速成熟。
- 15°N 暖海低風切逐步增強。
- 高風切造成對稱度下降。
- 低海溫逐步減弱。
- 風速與氣壓上下限。
- 相同種子相同結果。
- 相同版本、種子與操作序列得到相同 fingerprint。
- 關閉粒子不改變物理。
- 不同 FPS 執行相同步數結果一致。
- 結構不在臨界值反覆抖動。

完成後更新文件、PHASE-STATUS、commit、完成報告並停止。
最後詢問：
「是否批准 Phase 3，並進入 Phase 4：環境網格與導引氣流？」
未批准不得開始 Phase 4。
```

---

# Phase 4：環境網格與導引氣流

## 進入條件

Phase 3 已由使用者批准。

## 建議分支

```text
phase/04-steering
```

## 貼給 Codex 的執行指令

```text
請執行 Phase 4：環境網格與導引氣流。

建立：
- js/simulation/SteeringModel.js
- js/ui/ControlPanel.js
- 補強 js/rendering/FieldRenderer.js

實作：
- 1 度環境網格。
- GridCell 的 SST、OHC、surfacePressure、steeringU、steeringV、
  wind shear、humidity、terrain、roughness、landFraction、coldWake。
- steeringU 正值向東、steeringV 正值向北，單位固定為 m/s。
- 背景風、副高、西南季風、β 漂移及具種子微擾。
- 副高強度、西伸邊界、脊線緯度控制。
- 西南季風強度、水氣及導引效果。
- 垂直風切目標值與實際值。
- 所有控制具有反應延遲。
- 顯示目標值、實際值及反應趨勢。
- 導引向量換算成經緯度位移。
- 0～45 km/h 移動限制。
- 方向及速度平滑。
- 路徑線段分割，不能跳過狹窄島嶼。
- 導引箭頭、氣壓等值線、副高範圍、季風槽、短期方向箭頭。
- 禁止寫死路徑。
- 禁止 UI 直接改颱風座標。

測試：
- 強副高西伸偏西。
- 副高東退較易轉向。
- 強西南季風增加東北向分量及水氣。
- 弱導引場保留微弱 β 漂移。
- 調整滑桿不瞬間改變方向。
- 移動速度不超限。
- 相同種子及操作得到相同路徑。
- 導引顯示與運算向量一致。

完成後更新文件、PHASE-STATUS、commit、完成報告並停止。
最後詢問：
「是否批准 Phase 4，並進入 Phase 5：海陸、中央山脈、冷水尾流與降雨？」
未批准不得開始 Phase 5。
```

---

# Phase 5：海陸、中央山脈、冷水尾流與降雨

## 進入條件

Phase 4 已由使用者批准。

## 建議分支

```text
phase/05-land-rain
```

## 貼給 Codex 的執行指令

```text
請執行 Phase 5：海陸、中央山脈、冷水尾流與降雨。

建立：
- js/simulation/LandInteractionModel.js
- js/simulation/OceanCoolingModel.js
- js/simulation/RainfallModel.js
- js/simulation/ObservationModel.js
- js/model/WeatherStation.js

實作：
- LANDFALL 與 SEA_REENTRY 狀態轉換及事件紀錄。
- 事件去重。
- 臺灣西部平原、中央山脈、東部縱谷、海岸山脈。
- 地形摩擦、風速減弱、組織度與對稱度下降。
- 迎風坡抬升及背風雨影。
- 出海後重新組織延遲。
- 地形作用依時間積分。
- 跨海岸步進依海洋／陸地子段時間比例積分。
- 冷水尾流形成、累積、影響及恢復。
- 冷水尾流作用範圍與暴風半徑相關，不只更新中心網格。
- 停留時間、強度、速度及海洋熱含量影響。
- 測站持續風、陣風、雨率與累積雨量。
- 雨量依 10 分鐘步進正確積分。
- 儀表板加入地形、冷水尾流、降雨及測站資訊。
- 關卡重啟時清除所有網格狀態。

測試：
- 海洋進入臺灣只觸發一次登陸。
- 離開臺灣只觸發一次出海。
- 中央山脈穿越造成強度與對稱度下降。
- 迎風坡雨量高於背風側。
- 慢速強颱冷水尾流明顯。
- 快速弱颱冷水尾流較弱。
- 冷水尾流逐步恢復。
- 10 分鐘雨量積分正確。
- 重啟後網格、測站、事件完全重設。
- 測站值由模型產生，不是寫死。

完成後更新文件、PHASE-STATUS、commit、完成報告並停止。
最後詢問：
「是否批准 Phase 5，並進入 Phase 6：第一關『那霸風雨』？」
未批准不得開始 Phase 6。
```

---

# Phase 6：第一關「那霸風雨」

## 進入條件

Phase 5 已由使用者批准。

## 建議分支

```text
phase/06-level-naha
```

## 貼給 Codex 的執行指令

```text
請執行 Phase 6：第一關「那霸風雨」。

在第一關可完整開始、勝利、失敗、結算及重啟前，不得加入第二、三關。

建立：
- js/model/LevelState.js
- js/data/levels.js
- js/core/ObjectiveEvaluator.js
- js/core/FailureEvaluator.js
- js/ui/Dashboard.js
- js/ui/ResultDialog.js
- js/ui/Tutorial.js

建立通用資料驅動關卡格式：
- id、title、historicalInspiration、disclaimer、durationHours、seed。
- spawn、environmentPreset、allowedControls。
- objectives、bonusObjectives、failureConditions、scoring、tutorialMessages。

第一關：
- 名稱：那霸風雨。
- 歷史靈感：2018 潭美。
- 生成點：14°N、145°E。
- 初始最大風速：15 m/s。
- 初始中心氣壓：1005 hPa。
- 時限：168 小時。

主要目標：
- 中心進入那霸 50 km。
- 那霸最大陣風 45 m/s。
- 那霸累積雨量 250 mm。
- 進入那霸 150 km 時最大風速至少 33 m/s。
- 時限內完成。

失敗：
- 離開地圖。
- 最大風速低於 8 m/s 持續 12 小時。
- 超時。
- 抵達琉球前先進入中國大陸。

實作：
- 通用目標及失敗判定器。
- 通用、白名單、不可執行任意程式碼的 Objective／Failure DSL。
- 目標面板：未完成、進行中、完成、失敗。
- 結算：路徑、最大風速、最低氣壓、測站數值、分數、重啟。
- 教學提示。
- 非預報用途聲明。
- 目標與結算不得重複觸發。

測試：
- 可勝利的固定輸入情境。
- 未通過那霸。
- 強度不足。
- 雨量不足。
- 超時。
- 重啟狀態清空。
- 目標只完成一次。
- 結算不重複開啟。
- 關卡數值由模型產生。
- 產生並驗證第一關黃金重播 fixture。

完成後更新文件、PHASE-STATUS、commit、完成報告並停止。
最後詢問：
「是否批准 Phase 6，並進入 Phase 7：第二關『護國神山』與第三關『韋恩三進』？」
未批准不得開始 Phase 7。
```

---

# Phase 7：第二關與第三關

## 進入條件

Phase 6 已由使用者批准。

## 建議分支

```text
phase/07-levels-taiwan-wayne
```

## 貼給 Codex 的執行指令

```text
請執行 Phase 7：第二關「護國神山」與第三關「韋恩三進」。

必須沿用通用關卡系統，不得為每關複製一整套重複邏輯。

第二關「護國神山」：
- 歷史靈感：2015 蘇迪勒。
- 生成點：13.6°N、159.3°E。
- 初始最大風速：16 m/s。
- 初始中心氣壓：1004 hPa。
- 時限：216 小時。
- 東側登陸、西側出海。
- 登陸前 48 m/s。
- 中部陣風 35 m/s。
- 中部山區雨量 600 mm。
- 中央山脈、減弱、出海重組、西南氣流。

第三關「韋恩三進」：
- 歷史靈感：1986 韋恩。
- 生成點：16°N、117°E。
- 初始最大風速：18 m/s。
- 初始中心氣壓：1002 hPa。
- 時限：360 小時。
- 核心是三次進入以 23.70°N、120.95°E 為中心、半徑 400 km 的臺灣近海警戒區，不得宣稱三次登陸。
- 狀態：OUTSIDE、ENTERING、INSIDE、EXITING。
- 區外至少 6 小時。
- 區內至少 3 小時才計一次。
- 離區至少 6 小時才可計下一次。
- 三次進入、至少兩次登陸、每次至少 28 m/s。
- 中部合計雨量 400 mm、任一次中部陣風 35 m/s。

測試：
- 第二關可完成。
- 西側登陸不符合東側登陸。
- 未穿越中央山脈不獲得相關目標。
- 警戒區邊界抖動不重複計數。
- 未離開滿 6 小時不計下一次。
- 只有一次登陸不符合至少兩次。
- 第三次有效進入後才可勝利。
- 關卡切換無狀態污染。
- 三關皆標示歷史靈感、非歷史重建。
- 第二、三關各產生並驗證一份黃金重播 fixture。

完成後更新文件、PHASE-STATUS、commit、完成報告並停止。
最後詢問：
「是否批准 Phase 7，並進入 Phase 8：沙盒、儲存與匯出？」
未批准不得開始 Phase 8。
```

---

# Phase 8：沙盒、儲存與匯出

## 進入條件

Phase 7 已由使用者批准。

## 建議分支

```text
phase/08-sandbox-export
```

## 貼給 Codex 的執行指令

```text
請執行 Phase 8：沙盒、儲存與匯出。

本 Phase 的資料匯入／匯出實作為後台能力，不在玩家前端顯示入口。

實作沙盒設定：
- 生成位置、初始風速、氣壓、組織度、對稱度。
- SST、OHC、副高、風切、西南季風、水氣、地形倍率、種子。
- 不設勝敗。
- 暫停、倍速、重啟、圖層切換、環境檢視。

實作 localStorage：
{
  version: 1,
  unlockedLevels: [],
  bestScores: {},
  settings: {},
  lastSandboxPreset: {},
  tutorialCompleted: false
}

要求：
- schema 驗證。
- 損壞資料安全回復。
- 版本遷移入口。
- 不儲存敏感個資。

匯出：
- 軌跡 CSV。
- 模擬 JSON。
- 沙盒設定 JSON。
- Canvas PNG。
- 模擬摘要文字。
- 種子與操作紀錄。
- schemaVersion、modelVersion、PRNG 版本及建置 commit。

匯入：
- 版本、必要欄位、型別、範圍、陣列長度驗證。
- 禁止 eval、Function 或任意 HTML 執行。
- 錯誤顯示可讀訊息。

PNG 必含：
- 地圖、軌跡、目前颱風、名稱、模擬時間。
- KOSMOS TOOLKIT｜探真拓知酷。
- Not for Forecasting 註記。

測試：
- 重新整理恢復設定。
- 損壞 localStorage 不崩潰。
- CSV 欄位完整。
- JSON 匯出後可匯入。
- 非法 JSON 被拒絕。
- PNG 可建立。
- 關卡與沙盒切換完整重設。
- 相同種子及操作紀錄可重現。
- 匯入拒絕過大、過深、未知及原型污染欄位。
- CSV 文字欄位不造成試算表公式注入。

完成後更新文件、PHASE-STATUS、commit、完成報告並停止。
最後詢問：
「是否批准 Phase 8，並進入 Phase 9：效能、相容性、發布與最終驗收？」
未批准不得開始 Phase 9。
```

---

# Phase 9：效能、相容性、發布與最終驗收

## 進入條件

Phase 8 已由使用者批准。

## 建議分支

```text
phase/09-release
```

## 貼給 Codex 的執行指令

```text
請執行 Phase 9：效能、相容性、發布與最終驗收。

本 Phase 不新增大型玩法，只進行測試、修正、優化、文件與部署。
可依使用者最新明確指示修正第一版用語、資訊／操作版面、遊戲化視覺、
前後台功能邊界與地圖呈現，但不得改變物理模型或新增大型玩法。
開始 GitHub push、設定或部署前，必須再次確認本次 Phase 9 批准明確包含相應外部操作。

效能：
- 測量平均／最低 FPS、物理更新、Canvas、粒子與長任務。
- 低 300、中 700、高 1200 粒子。
- 靜態地圖快取。
- 不每幀解析地圖或大量配置物件。
- 隱藏分頁暫停渲染。
- 防止切回大量補算。

相容性：
- Chrome、Edge、macOS Safari、iPadOS Safari。
- GitHub Pages 子目錄。
- ES Modules、Canvas、下載、localStorage、觸控、滑桿。
- 無法實際驗證的環境必須誠實標為未驗證。

無障礙：
- 鍵盤、label、焦點、對比、非單靠顏色。
- prefers-reduced-motion。
- Canvas 文字摘要。
- aria-live 錯誤訊息。

文件：
- 完成 README。
- 更新 ARCHITECTURE、PHYSICS-MODEL、DATA-SCHEMA、TESTING、
  DEPLOYMENT、SOURCES、DECISIONS、PHASE-STATUS。
- 文件及網站保留 KOSMOS TOOLKIT｜探真拓知酷。
- README 明列 owner kisaraki、repository classroom-sgts-nh-tzk、
  Pages URL 及非預報聲明。

GitHub：
- 確認 remote 指向 kisaraki/classroom-sgts-nh-tzk。
- 確認並完善 Phase 1 已建立的測試 workflow。
- 建立 Pages deployment workflow。
- 推送分支與必要 commit。
- 部署 GitHub Pages。
- 驗證 https://kisaraki.github.io/classroom-sgts-nh-tzk/。
- 建立發布候選 commit；正式發布批准後建立 v1.0.0 annotated tag 與 release notes。
- 記錄 workflow run、deployment ID、source commit 及回復方式。
- 不得覆寫無關遠端內容。
- 若因權限、登入或網路無法完成，明確回報，不得假稱已部署。

最終驗收逐項檢查本文件第 24 節全部條件。
任何必要項目未通過，不得宣稱正式完成。

完成後：
- Phase 9 標記 completed，不得自行標記 approved。
- 提供最終驗收報告。
- 停止。
- 詢問使用者是否批准第一版發布結果，以及是否進入 Phase 10 選配擴充。

最後詢問：
「是否批准 Phase 9 的第一版發布結果？是否另行批准進入 Phase 10 選配擴充？」
未取得兩者中相應的明確批准，不得執行 Phase 10。
```

---

# Phase 10：選配擴充

## 性質

Phase 10 不屬第一版必要範圍。只有 Phase 9 已批准，且使用者明確選定擴充項目後才能執行。

## 可選項目

1. 模擬重播。
2. 多種子比較。
3. 路徑預測錐。
4. 生命史圖表。
5. 風速、氣壓、雨量時間序列。
6. 教師展示模式。
7. 關卡編輯器。
8. 自訂測站。
9. 自訂目標區。
10. 操作與成績匯出。
11. 多颱風互動。
12. 北大西洋篇。
13. 東北太平洋篇。
14. 北印度洋篇。
15. 南半球篇。

## 貼給 Codex 的執行指令

```text
請執行 Phase 10 選配擴充。

前置條件：
- Phase 9 已由使用者批准。
- 使用者已明確選定本次擴充項目。
- 不得把整份 Phase 10 一次全部實作。

本次獲准項目：
【由使用者填入】

開始前：
1. 為此項目建立獨立 mini-spec。
2. 定義範圍、非範圍、資料模型、UI、測試、效能與驗收。
3. 提交 mini-spec 給使用者批准。
4. mini-spec 未批准前不得開始寫程式。
5. mini-spec 批准後才建立 phase/10-... 分支實作。
6. 不破壞第一版相容性、可重現性、GitHub Pages 與品牌識別。

完成後：
- 執行完整回歸測試。
- 回報新增功能與風險。
- 將本次選配工作標記 completed。
- 停止並再次要求使用者批准。
```

---

# 26. 中斷後恢復指令

```text
剛才的開發工作可能中斷。不要重新生成整個專案。

請先：
1. 閱讀 SGTS-NH_MASTER_SPEC.md、AGENTS.md、docs/PHASE-STATUS.md。
2. 檢查 git status、目前分支、git diff 及最近 commit。
3. 執行既有測試。
4. 確認目前所在 Phase 與使用者批准狀態。
5. 比對該 Phase 工作清單。
6. 將項目分類為已完成、部分完成、未開始、失敗。
7. 保留正確成果，只補缺漏及修正錯誤。
8. 不得進入下一 Phase。
9. 完成目前 Phase 後更新為 completed，不得自行 approved。
10. 依完成報告格式回覆並停止，要求使用者批准。

目前 Phase：
【填入 Phase】
```

---

# 27. 專用除錯指令

```text
目前專案出現錯誤。只除錯，不新增功能，不進入下一 Phase。

請：
1. 閱讀主規格及目前 Phase。
2. 重現錯誤。
3. 記錄操作步驟、預期與實際結果。
4. 建立最小可重現案例。
5. 判斷屬於資料、狀態、時間步進、座標、物理、Canvas、
   UI、儲存、相容性或部署問題。
6. 找出根本原因。
7. 先新增可重現錯誤的測試。
8. 修正程式。
9. 執行新測試及完整回歸測試。
10. 不順便重構無關模組。
11. 更新文件及 Phase 狀態。
12. 回報並停止；不得因錯誤已修好而自動進入下一 Phase。

錯誤描述：
【貼上錯誤】
```

---

# 28. 程式碼審查指令

```text
請審查目前專案，先不要大量重寫。

檢查：
1. 模組責任與依賴方向。
2. 循環依賴。
3. 物理是否混入渲染。
4. UI 是否直接修改颱風座標或強度。
5. 是否直接使用 Math.random()。
6. 是否依賴 FPS。
7. 是否有未限制數值。
8. 是否重複觸發事件。
9. 是否有重啟後狀態污染。
10. 是否硬編碼關卡結果。
11. 雨量時間積分。
12. lon 欄位一致性。
13. Canvas 高 DPI。
14. Safari 相容性。
15. GitHub Pages 子路徑。
16. 品牌是否正確為 KOSMOS TOOLKIT｜探真拓知酷。
17. GitHub owner 及 repository 是否正確。
18. 非預報聲明。
19. Phase 批准制度是否被遵守。

依 Critical、High、Medium、Low 分類。
每項列出檔案、位置、原因、影響、修正及測試建議。
先提交報告，不直接修改。
審查結束後停止，不得進入下一 Phase。
```

---

# 29. Git 提交指令

```text
請檢查目前 Phase 修改並準備 Git commit。

1. 顯示 git status。
2. 摘要主要 diff。
3. 排除暫存檔、系統檔、測試輸出、個資、金鑰及未授權素材。
4. 執行該 Phase 測試及回歸測試。
5. 更新必要文件與 PHASE-STATUS。
6. 建立符合規範的 commit。
7. 回報 commit hash、訊息、檔案、測試及未提交變更。
8. Commit 完成不等於使用者批准。
9. 不得自動 merge、push、進入下一 Phase，除非使用者已明確要求。
10. 回報後停止並要求 Phase 批准。
```

---

# 30. 單次繼續開發指令

```text
請先閱讀：
- SGTS-NH_MASTER_SPEC.md
- AGENTS.md
- docs/PHASE-STATUS.md
- 與目前 Phase 有關的文件

目前預計執行：
Phase 【編號與名稱】

開始前：
1. 確認上一 Phase 已獲使用者批准。
2. 檢查 Git 狀態、分支、現有檔案及測試。
3. 列出本階段修改計畫。
4. 僅執行目前 Phase。
5. 不提前實作後續 Phase。
6. 完成後執行指定測試及回歸測試。
7. 更新文件與 PHASE-STATUS 為 completed。
8. 建立 commit。
9. 依完成報告格式回覆。
10. 停止並要求使用者批准下一階段。
```

---

# 31. Codex 模型與任務分配建議

可依工作難度節省推理資源：

## 高推理層級

適合：

- 架構設計。
- 固定時間步進。
- 強度與導引模型。
- 地形及冷水尾流。
- 跨模組除錯。
- Phase 9 最終驗收。
- 安全與資料一致性。

## 中等推理層級

適合：

- 已有規格下的 UI。
- 關卡資料。
- 儀表板。
- 匯出格式。
- README 與一般文件。
- 測試案例補齊。

## 輕量層級

適合：

- 明確命名修正。
- 格式化。
- CSS 小調整。
- JSDoc。
- 無爭議重複性工作。
- 清理 lint 問題。

但任何模型都必須遵守：

- 不得跳 Phase。
- 不得偽造測試。
- 不得自行批准。
- 不得修改品牌與倉庫身份。
- 不得把教育模型宣稱為預報系統。

---

# 32. 最終 Codex 啟動總指令

首次把本文件放入倉庫後，可直接對 Codex 下達：

```text
請將 SGTS-NH_MASTER_SPEC.md 視為本專案唯一主規格與長期執行依據。

專案：
- 風暴創世神：北半球颱風模擬器
- Storm Genesis: Northern Hemisphere Typhoon Simulator
- SGTS-NH
- 第一版：西北太平洋篇
- GitHub owner：kisaraki
- Repository：classroom-sgts-nh-tzk
- Pages：https://kisaraki.github.io/classroom-sgts-nh-tzk/
- 創作團隊與固定識別：KOSMOS TOOLKIT｜探真拓知酷

請從 Phase 0 開始。
一次只能執行一個 Phase。
本次 Phase 0 是否授權建立公開 GitHub 倉庫：【是／否】
本次 Phase 0 是否授權 push：【是／否，預設否】
本次 Phase 0 不授權 GitHub Pages 部署。
完成 Phase 0 後，必須提交完成報告並停止，明確詢問我是否批准進入 Phase 1。
未取得我的明確批准，不得開始下一 Phase，也不得預先建立下一 Phase 的程式碼或檔案。
```

---

# 33. 文件維護規則

- 本文件為主規格，分散文件不得與其矛盾。
- 變更核心範圍時提升版本號。
- 任何關卡目標、物理常數或技術架構重大變更，記錄於 `docs/DECISIONS.md`。
- 使用者在對話中的最新明確指示優先於舊版文件。
- 修改本文件後，Codex必須列出變更摘要。
- 未經使用者批准，不得刪除 Phase 批准制度。
- 未經使用者批准，不得更改：
  - `kisaraki`
  - `classroom-sgts-nh-tzk`
  - `KOSMOS TOOLKIT｜探真拓知酷`
  - 第一版「西北太平洋篇」
  - GitHub Pages 靜態部署方向
  - 非預報用途定位

## 33.1 版本紀錄

### 1.0.3｜2026-08-06

- 地圖移至上方並橫跨第一、二象限。
- 戰況資訊移至第三象限，參數輸入與玩家操作集中於第四象限。
- 下方兩象限採等高可捲動配置，並保留第四象限下緣的緊湊即時指令區。

### 1.0.2｜2026-08-06

- 採用教育部繁體中文與交通部中央氣象署慣用氣象名詞。
- 桌面及橫向小螢幕改為左側戰況資訊、右側操作，右下方優先配置即時指令。
- 明確要求科學策略遊戲氛圍，不得只呈現中性模擬儀表。
- 氣象資料匯入／匯出保留為後台能力，不在玩家前端顯示。
- 地圖以海洋層次、陸地地貌陰影及海岸細節呈現擬真視覺，並保留教育簡化聲明。

### 1.0.1｜2026-07-30

- 明確區分 Phase 執行、本機 commit、遠端建立、merge、push、GitHub 設定及 Pages 部署授權。
- 固定 Phase 完成、批准紀錄、合併及下一分支建立流程。
- 新增規範用語、需求 ID 與驗收追蹤規則。
- 明確 GitHub Pages 正式執行環境與 Node.js／npm 開發工具邊界。
- 補充 package-lock、npm scripts、Node test、瀏覽器測試及 CI 導入時序。
- 新增單位字典、schemaVersion、modelVersion、地圖資料與岸段規格。
- 固定 simulation step 更新順序、勝敗仲裁、PRNG 子流及跨瀏覽器容差。
- 新增模型參數目錄、子段積分、Objective／Failure DSL、關卡地理定義及黃金重播。
- 強化儲存、匯入、CSV、Canvas 匯出及原型污染防護。
- 將情境、效能、UI、瀏覽器與發布要求改為可追蹤、可量化驗收。

### 1.0.0｜初版

- 建立 SGTS-NH 產品、模型、UI、測試、Phase 0～10 與 GitHub Pages 發布規格。

---

> **KOSMOS TOOLKIT｜探真拓知酷**<br>
> SGTS-NH · Storm Genesis · Educational Simulation · Not for Forecasting
