# SGTS-NH 測試策略
## 需求追蹤、測試分類與驗收證據

> **KOSMOS TOOLKIT｜探真拓知酷**

## 工具鏈

- Node.js 24 LTS。
- npm 11。
- ESLint。
- Node.js 內建 `node:test`。
- Playwright 1.62.0，以本機實際 Google Chrome 執行 Phase 1～9 E2E；CI
  定義使用 Chromium。
- WebKit 模擬不得冒充實際 Safari 或 iPadOS。

## 指令

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
npm run serve
```

## Phase 9 本機發布驗收

2026-08-09 使用者在完整知悉中畫質 update p95 失敗，以及 Microsoft Edge、
iPadOS Safari 尚未驗證後，指示本案截至目前正式結案。以下測試結果保持
原始狀態；結案批准不等於將 `failed` 或 `not_verified` 改列 `passed`。

### 2026-08-09 v1.0.1 六站卡與玩家診斷退場維護驗證

第一版正式結案後，使用者重新啟動 Phase 9 發布後介面維護。主規格 1.0.7
將六站模型觀測資訊卡預設移至中國大陸內陸及南側低干擾區，新增個別拖曳、
鍵盤微調與歸位，改採高密度完整氣象欄位排版，並自玩家畫面與 Canvas 移除
開發診斷。此維護候選不改測站位置、觀測、地圖鏡頭、物理、重播、匯出
schema 或 fingerprint。

| 類別 | 本次結果 | 證據 |
|---|---|---|
| Schema／資料 | passed | `schemaVersion=1`、`modelVersion=0.7.0-taiwan-wayne`；測站、地理、關卡、沙盒、儲存與後台 I/O 契約未變；卡位只屬工作階段呈現狀態 |
| lint | passed | ESLint 0 errors、0 warnings |
| TypeScript | not_applicable | 原生 JavaScript ES Modules，無 TypeScript |
| 單元 | passed | 130 passed、0 failed；低干擾預設區、窄螢幕兩欄／淺橫向四欄兩列、正規化位置、邊界夾限、相機隔離與正式氣象用語 |
| 整合 | passed | 6 passed、0 failed；Pages 子路徑模組與既有地形資源契約不變 |
| 情境／黃金重播 | passed | 16 passed、0 failed；三份既有 fixture 與正式 fingerprint 不變 |
| 實際 Google Chrome E2E | passed | 19 passed、0 failed；指標拖曳、按兩下歸位、鍵盤移動／Home 歸位；模擬前進並顯示完整更新時間後的 390～800 px 響應式幾何、卡片／控制避讓與無裁切；定位點上層可見、相機與物理隔離、玩家診斷退場 |
| 指標拖曳／物理隔離 | passed | 卡片拖曳前後地圖中心、縮放倍率、step 與 fingerprint 不變；相機變更後卡片畫面位置維持，定位點與引線重投影 |
| 玩家診斷退場 | passed | foundation、artifact 與 Chrome E2E 反向驗證可見 FPS、固定步長／步次、效能診斷、fingerprint、`Phase 09` 及模型中間值不再出現；隱藏 runtime telemetry、效能量測與 Canvas 無障礙摘要保留 |
| build／Pages artifact | passed | 5 個允許根項目；artifact 1 passed、0 failed，未加入伺服器端或玩家匯入／匯出入口 |
| 效能門檻 | passed | 中畫質中位 59.88 FPS、1% low 59.52、render 0.850／2.2 ms、update 1.687／3.7 ms、Long Task 0；本輪全部符合門檻 |
| Codex in-app Browser | passed | 本機正式子路徑 DOM／視覺 smoke；六卡低干擾配置與完整文字可見、玩家診斷不可見；實際拖曳臺中卡約 160×20 px，地圖中心／縮放與 step 不變，按兩下精確歸位 |
| Microsoft Edge | not_verified | 本機未安裝，未以 Chromium 代替 |
| iPadOS Safari | not_verified | 無實體裝置證據，未以桌面窄視窗或 Chrome 觸控事件代替 |
| GitHub Actions | passed | `31292327492` 以 `37e2b213a9c86686f058e12d270804a408949d19` 執行；test、build、deploy 全部 success |
| Pages API／部署 | passed | deployment `5815084626`、來源 `37e2b213a9c86686f058e12d270804a408949d19`、state `success` |
| 公開網站 | passed | `https://kisaraki.github.io/classroom-sgts-nh-tzk/` HTTP 200，且回應本次站點的六站觀測與隱藏 telemetry 結構；瀏覽器視覺 smoke 受管理端安全檢查阻擋，保持 `not_verified` |

需求追蹤：`UI-MAP-STATION-PLACEMENT-001` 低干擾預設卡位與定位點上層可見、
`UI-MAP-STATION-DRAG-001` 個別拖曳與歸位、
`UI-MAP-STATION-DENSITY-001` 完整高密度氣象排版、兩欄／四欄兩列及
10 px／11 px 字級下限、
`SIM-STATION-PRESENTATION-ISOLATION-001` 卡位與相機／物理隔離，以及
`UI-DEV-DIAGNOSTIC-RETIRE-001` 玩家開發診斷退場均為 `passed`。
本輪維護狀態為 `completed`，已依明確操作授權推送及部署，但尚未取得產品
`approved`、未建立版本標籤或 GitHub Release；Phase 9 第一版 `approved` 史實與
Phase 10 `pending` 狀態均不改變。
本輪效能通過是 `v1.0.1` 候選的新量測；`v1.0.0` 結案時的 update p95
6.1 ms `failed` 仍保留為歷史證據，不作回溯改寫。

### 2026-08-06 六站地圖卡、查詢退場與鏡頭操作本機驗證

主規格 1.0.5 將六站模型觀測移入地圖內的有色毛玻璃卡，取消玩家
點選地圖查詢與選取游標，並新增滑鼠滾輪、拖曳、雙指、按鈕與鍵盤
視角操作。鏡頭只屬呈現狀態，`schemaVersion=1`、
`modelVersion=0.7.0-taiwan-wayne`、三份黃金重播與正式 fingerprint 不變。

| 類別 | 本次結果 | 證據 |
|---|---|---|
| Schema／資料 | passed | 測站、地理、關卡、儲存與後台 I/O 契約未變；鏡頭不進入匯出 schema |
| lint | passed | ESLint 0 errors、0 warnings |
| TypeScript | not_applicable | 原生 JavaScript ES Modules，無 TypeScript |
| 單元 | passed | 127 passed、0 failed；鏡頭錨點／clamp／雙指、DPR 轉換、離屏快取、六站佈局、正式用語及視角控制避讓 |
| 整合 | passed | 6 passed、0 failed；三個新模組均由 Pages 子路徑以 JavaScript MIME 回應 |
| 情境／黃金重播 | passed | 16 passed、0 failed；三份既有 fixture 未變 |
| 實際 Google Chrome E2E | passed | 19 passed、0 failed；六站卡、查詢 DOM 不存在、滾輪、滑鼠拖曳、按鈕、鍵盤、重設、Chrome DevTools Protocol 雙指事件與 idle 版面量測快取 |
| 視角／物理隔離 | passed | 視角操作前後 step 與 fingerprint 不變；既有情境重播全數通過 |
| build／Pages artifact | passed | 5 個允許根項目；新模組存在、查詢 ID／字串不存在；artifact 1 passed |
| 效能門檻 | failed | 中畫質中位 59.88 FPS、1% low 57.80、render 1.178／1.7 ms、Long Task 0 通過；update p95 6.1 ms 高於 <4 ms |
| Codex in-app Browser | not_run | 管理員安全政策無法驗證 localhost，未繞過且未以 Chrome E2E 冒充 |
| Microsoft Edge | not_verified | 未安裝，未以 Chromium 代替 |
| iPadOS Safari | not_verified | Chrome 多點觸控事件不代表 iPadOS 實體裝置 |
| GitHub Actions | passed | 手動觸發 run `31287364008`；test、build、deploy 均成功，source `d1ea886` |
| Pages API／部署 | passed | `build_type=workflow`、HTTPS enforced；deploy job `93178759245` 成功 |
| 公開網站 | passed | 根頁、`MapCamera.js` 與真實地形 WebP 均為 HTTPS HTTP 200 |

效能結果為當次 15 秒低／中／高畫質實際 Chrome 量測；中畫質 FPS與
Long Task 通過，但 update p95 仍失敗；這項技術結論不因後續正式結案批准
而改變。

需求追蹤：`UI-MAP-PROBE-RETIRE-001`、`UI-MAP-STATION-CARD-001`、
`UI-MAP-CAMERA-001`、`SIM-VIEW-ISOLATION-001`、`A11Y-MAP-CAMERA-001` 與
`DEPLOY-MAP-INTERACTION-001` 均為 `passed`；遠端發布狀態仍依上表與
本機結果分開記錄。

### 2026-08-06 生命史、北半球旋轉與真實地形本機驗證

主規格 1.0.4 的颱風生命史視覺尺寸、北半球逆時針粒子及 Natural Earth II
真實地形貼圖已完成本機實作。物理 `galeRadius`、`schemaVersion=1`、
`modelVersion=0.7.0-taiwan-wayne` 與三份黃金重播均未改變。地形 WebP 為
同源、透明海洋、2,400×1,600，失敗時安全降級為既有簡化地形。

| 類別 | 本次結果 | 證據 |
|---|---|---|
| Schema／資料 | passed | 地形 metadata、Public Domain 授權、bounds、尺寸與 SHA-256 成品檢查；既有物理地理 schema 不變 |
| lint | passed | ESLint 0 errors、0 warnings |
| TypeScript | not_applicable | 原生 JavaScript ES Modules，無 TypeScript |
| 單元 | passed | 116 passed、0 failed；生命史尺寸、逆時針座標、載入快取／重試、DPR 固定圖層與成品摘要 |
| 整合 | passed | 6 passed、0 failed；Pages 子路徑 WebP／JSON 200 且 MIME 正確 |
| 情境／黃金重播 | passed | 16 passed、0 failed；三份既有 fixture 未變 |
| 實際 Chrome E2E | passed | 16 passed、0 failed；真實地形就緒、Canvas PNG 無污染、影像失敗降級並可繼續模擬 |
| build／Pages artifact | passed | 529 KiB 地形 WebP 與 metadata 進入既有 allowlist；artifact 1 passed |
| 效能門檻 | failed | 中畫質中位 59.88 FPS、1% low 56.82、render 2.829／3.4 ms、Long Task 0 均通過；update p95 6.1 ms 高於 <4 ms 門檻 |
| Codex in-app Browser | not_run | 管理政策無法驗證 localhost 安全檢查；未以 Chrome E2E 冒充 |
| Microsoft Edge | not_verified | 未安裝，未以 Chromium 代替 |
| iPadOS Safari | not_verified | 無實體裝置證據，未以桌面縮放代替 |
| GitHub Actions | not_run | 本次差異未 commit、未 push |
| Pages API／部署 | not_run | 本次差異未部署 |
| 公開網站 | not_verified | 既有正式網站不是本次未發布差異的證據 |

需求追蹤：`VIS-STORM-SIZE-001` 生命史可辨識尺寸、
`VIS-ROTATION-NH-001` 北半球逆時針、`GEO-TERRAIN-RASTER-001` 具來源的
真實地形柵格、`GEO-TERRAIN-FALLBACK-001` 非致命降級均為 `passed`。
效能量測工具同步修正為先等待地形就緒並展開收合的顯示設定；正式 Phase 9
效能接受仍被 update p95 門檻阻擋，不得以其他 passed 項目掩蓋。

### 2026-08-06 介面修正本機驗證

主規格 1.0.3 的繁體中文完整用語、上方全幅地圖、第三象限戰況資訊、
第四象限參數操作與緊湊指令區、玩家介面隱藏資料匯入匯出，以及擬真地圖
層次均已在本機驗證。這一組尚未提交的
變更沒有執行 GitHub Actions、Pages API、部署或公開網站驗證；下方遠端
證據仍是 2026-07-30 已發布基線，不得視為本次差異的發布證據。

| 類別 | 本次結果 | 證據 |
|---|---|---|
| Schema／資料 | passed | 既有地圖、關卡、沙盒、儲存與後台 I/O 契約未變 |
| lint | passed | ESLint 0 errors、0 warnings |
| TypeScript | not_applicable | 原生 JavaScript ES Modules，無 TypeScript |
| 單元 | passed | 109 passed、0 failed |
| 整合 | passed | 6 passed、0 failed；那霸黃金重播驗證碼維持不變 |
| 情境／黃金重播 | passed | 16 passed、0 failed；三關 fixture 均通過 |
| 實際 Chrome E2E | passed | 15 passed、0 failed；包含後台 I/O 不顯示、四象限幾何及響應式介面 |
| build／Pages artifact | passed | 可重現建置；artifact 1 passed、0 failed，5 個允許根項目 |
| Codex in-app Browser | not_run | 主規格 1.0.3 本輪因管理政策驗證暫時無法存取 localhost；1.0.2 的既有 Browser 證據不得代替本輪差異 |
| Microsoft Edge | not_verified | 依既有使用者指示不安裝，未以 Chromium 代替 |
| iPadOS Safari | not_verified | 無實體裝置證據，未以桌面縮放代替 |
| GitHub Actions | not_run | 本次差異未 push |
| Pages API／部署 | not_run | 本次差異未部署 |
| 公開網站 | not_verified | 現有公開站仍是 2026-07-30 已發布版本 |

需求追蹤：`UI-TERM-001` 官方繁體中文完整用語、`UI-LAYOUT-003` 上方
全幅地圖／第三象限資訊／第四象限參數與操作、`UI-BACKOFFICE-001` 玩家
介面不顯示資料匯入匯出、`UI-MAP-002` 海洋層次／陸地明暗／地形紋理／
雙層海岸線，均為 `passed`。

#### 2026-08-06 上方全幅地圖與下方雙象限

- `UI-LAYOUT-003` 在 1180×720 與 1024×600 驗證地圖左右外緣分別對齊
  第三、第四象限外緣，且地圖下緣位於兩面板上緣之前。
- 第三、第四象限同列、等高，長內容各自捲動；參數與操作完整位於第四象限，
  指令停靠區仍位於其下緣。
- 390×844 依地圖、戰況資訊、參數操作順序改為單欄，開始按鈕可見且無
  水平 overflow。
- 目標與完整 Chrome E2E、lint、build、109 unit、6 integration、16 scenario、
  1 artifact test 全部通過；Codex in-app Browser 因管理政策驗證暫時無法
  存取 localhost，標記為 `not_run`。

#### 2026-08-06 右下指令停靠區緊湊化

- `UI-LAYOUT-002` 補充幾何回歸：1180×720 的指令區高度不超過 100 px；
  1024×600 採雙列緊湊配置，高度不超過 145 px；三個任務按鈕同列。
- 四個倍速按鈕及開始、暫停、重新部署按鈕的實際高度均至少 44 px。
- 390×844 維持單欄、開始按鈕可見且無水平 overflow。
- 目標 Chrome E2E 通過；Codex in-app Browser 本輪因管理政策驗證暫時
  無法存取 localhost，標記為 `not_run`，沒有以其他結果冒充該環境。

### 2026-07-30 已發布基線自動化結果

| 類別 | 結果 | 證據 |
|---|---|---|
| Schema／資料 | passed | 地圖快取、三關、沙盒、storage／匯入匯出既有契約；`schemaVersion=1` |
| lint | passed | ESLint 0 errors、0 warnings |
| TypeScript | not_applicable | 原生 JavaScript ES Modules，無 TypeScript |
| 單元 | passed | 109 passed、0 failed |
| 整合 | passed | 6 passed、0 failed |
| 情境／黃金重播 | passed | 16 passed、0 failed；三關 fixture 均通過 |
| 實際 Chrome E2E | passed | 15 passed、0 failed |
| Pages artifact | passed | 1 passed；只含 5 個允許根項目 |
| build | passed | `dist/` 可重現建立，AppleDouble 已移除 |
| GitHub Actions | passed | run `30556910585`：test、build、deploy 全部成功 |
| Pages API／部署 | passed | source `03e1f12`、deployment `5677601892`、HTTPS enforced |
| 公開網站 | passed | HTTP 200；模組、CSS、map JSON、品牌、聲明、模擬步進、Console 均通過 |

### 發布 CI 證據

- runs `30556253124`、`30556482084` 揭露 ARM64 macOS 與 x64 Linux
  三角函數低位差異導致完整浮點字串 fingerprint 不同。
- fingerprint 僅在序列化邊界正規化至小數點後 8 位，未更動物理狀態、
  結果、分數或匯出數值；本機完整 `npm run check` 與 Linux x64 run
  `30556910585` 均通過。
- 公開站於 2026-07-30T23:32:24+08:00 驗證：首頁與全部必要 CSS／JS／
  map JSON 回應 200；實際 Chrome 載入 16 regions、模擬進至 step 1、
  無水平 overflow，Console warning／error 0。

### 效能量測

參考裝置：Mac mini `Mac16,10`、Apple M4、16 GB；macOS 15.7.7；
Google Chrome 150.0.7871.187；headless 實際 Chrome、1440×900、DPR 上限 2；
「那霸風雨」、1×、每層級 15 秒。開始模擬時重設量測窗，結果使用最近
600 個畫格；固定地圖已快取於離屏 Canvas。

| 層級 | 粒子 | 中位 FPS | 平均 FPS | 最低 FPS | 1% low | Render avg／max | Update avg／p95 | Long Task |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 低 | 300 | 80.00 | 81.00 | 36.90 | 38.17 | 1.832／2.900 ms | 1.773／4.100 ms | 0 |
| 中 | 700 | 79.37 | 80.73 | 36.90 | 37.17 | 1.794／2.600 ms | 1.700／3.600 ms | 0 |
| 高 | 1200 | 77.52 | 80.03 | 35.71 | 37.74 | 1.880／3.000 ms | 1.743／3.600 ms | 0 |

主規格桌面門檻以中畫質判定：中位 FPS ≥55、1% low ≥30、
update p95 <4 ms、無持續 >50 ms Long Task，全部 passed。低畫質的單次
量測 update p95 為 4.1 ms，但不屬桌面中畫質門檻；中／高均為 3.6 ms。
平板效能不得由縮放桌面冒充，因此 iPadOS 仍為 not_verified。

### 瀏覽器與無障礙

| 環境 | 狀態 | 驗證範圍／限制 |
|---|---|---|
| Chrome 150 | passed | Pages 子路徑、ES Modules、Canvas、滑桿、鍵盤、觸控事件、localStorage、CSV／JSON／PNG、匯入、reduced motion、黃金重播 |
| Codex in-app Browser | passed | DOM／視覺 smoke、三欄幾何、品牌、Canvas 文字摘要、效能診斷、無 app error |
| macOS Safari 26.5.2 | passed | 真實 Safari 載入子路徑、ES Modules／Canvas、開始模擬、固定步進、localStorage reload、文字下載、品牌與聲明 |
| Microsoft Edge | not_verified | 本機未安裝；沒有以 Chromium 結果冒充 Edge |
| iPadOS Safari | not_verified | 無實體 iPadOS 裝置證據；沒有以桌面縮放冒充 |

Safari WebDriver 自動化因使用者設定未啟用 `Allow remote automation` 而未
建立 session；改以一般 Safari UI 完成只讀／本機互動 smoke，未擅自更改
Safari 設定。Safari 下載驗證產生
`~/Downloads/sgts-nh-naha-storm-step-37-summary.txt`。

無障礙回歸包含：skip link、可見焦點、label／accessible name、44 px
操作目標、方向箭頭與文字狀態、`prefers-reduced-motion` 停用動畫粒子但
不停止物理、Canvas 獨立文字摘要，以及 `role=alert` 錯誤訊息。
主要純色文字／背景 WCAG 對比：cloud/ocean 17.50:1、muted/panel
10.12:1、cyan/panel 11.63:1、warning/panel 12.09:1、
success/ocean 13.91:1，均高於一般文字 4.5:1。

### Phase 9 Requirement trace

| Requirement ID | 需求 | 測試／證據 | 狀態 |
|---|---|---|---|
| PERF-METRIC-001 | 平均／最低／中位／1% low、update、render、Long Task | `PerformanceMonitor`、performance run | passed |
| PERF-PARTICLE-001 | 300／700／1200 粒子層級 | unit、Chrome E2E、performance run | passed |
| PERF-MAP-001 | GeoJSON 不重複解析、靜態圖離屏快取 | geography unit、code inspection | passed |
| UI-MAP-PROBE-RETIRE-001 | 玩家地圖查詢、面板與選取游標不存在 | foundation、artifact、Chrome E2E | passed |
| UI-MAP-STATION-CARD-001 | 六站觀測以地圖內有色毛玻璃卡及引線呈現 | station overlay unit、Chrome E2E | passed |
| UI-MAP-STATION-PLACEMENT-001 | 六站卡預設位於中國大陸內陸與南側低干擾區 | station overlay unit、Chrome E2E、in-app Browser | passed |
| UI-MAP-STATION-DRAG-001 | 指標拖曳、鍵盤微調、取消與個別歸位 | station overlay unit、Chrome E2E、in-app Browser | passed |
| UI-MAP-STATION-DENSITY-001 | 完整氣象用語的高密度可讀排版 | DOM／CSS inspection、Chrome E2E、in-app Browser | passed |
| SIM-STATION-PRESENTATION-ISOLATION-001 | 卡位不改相機、物理、步次、重播或 fingerprint | station overlay unit、Chrome E2E | passed |
| UI-DEV-DIAGNOSTIC-RETIRE-001 | 玩家 DOM 與 Canvas 不顯示開發診斷，內部量測保留 | foundation、artifact、Chrome E2E、in-app Browser | passed |
| UI-MAP-CAMERA-001 | 滾輪、拖曳、雙指、按鈕、鍵盤與邊界限制 | camera／controller unit、Chrome E2E | passed |
| SIM-VIEW-ISOLATION-001 | 視角操作不改變 step、物理或 fingerprint | unit、Chrome E2E、黃金重播 | passed |
| A11Y-MAP-CAMERA-001 | 可見 44 px 控制、鍵盤等價操作與視角文字狀態 | Chrome E2E、CSS inspection | passed |
| DEPLOY-MAP-INTERACTION-001 | 新模組進入 Pages allowlist，查詢 DOM 不進入 artifact | integration、build、artifact test | passed |
| A11Y-MOTION-001 | reduced motion 不影響物理 | Chrome E2E | passed |
| A11Y-CANVAS-001 | Canvas 文字摘要與錯誤 live region | Chrome E2E、Safari AX tree | passed |
| COMP-CHROME-001 | Chrome 完整 smoke | 19 E2E | passed |
| COMP-SAFARI-001 | macOS Safari 實機 smoke | Safari 26.5.2 UI evidence | passed |
| COMP-EDGE-001 | Edge 實機 smoke | 無環境 | not_verified |
| COMP-IPAD-001 | iPadOS Safari 實機與效能 | 無環境 | not_verified |
| DEPLOY-ARTIFACT-001 | 窄化且乾淨的 Pages artifact | build／artifact test | passed |
| CI-PAGES-001 | 測試、build、deploy 分離且最小權限 | workflow inspection、run `30556910585` | passed |
| RELEASE-PUBLIC-001 | Actions、Pages、正式 URL 驗證 | run `30556910585`、deployment `5677601892`、公開 Chrome smoke | passed |

Phase 2：

- `test:unit` 除既有基礎外，驗證座標、測地線、polygon、segment、
  地圖 metadata／負面驗證、海陸、測站及 resize click。
- `test:integration` 驗證引擎固定步進、Pages 子路徑靜態服務，以及
  地圖 JSON MIME／版本。
- `test:scenario` 尚不適用，指令會明確回報。
- `test:e2e` 驗證實際 Chrome 操作、平板／窄螢幕、靜態 browser
  harness、地圖載入、臺灣海陸查詢及 resize 後座標穩定。

Phase 3：

- `test:unit` 驗證模型契約／拒絕未知欄位、PRNG 版本與子流隔離、強度上下限、
  壓力映射、相同種子／fingerprint、粒子隔離及結構遲滯。
- `test:scenario` 驗證 1°N、15°N、高風切、低 SST 與不同 FPS 固定步數。
- `test:e2e` 驗證強度儀表板、fingerprint、粒子控制、瀏覽器 harness、
  響應式版面與既有地圖查詢回歸。

Phase 4：

- `test:unit` 驗證 1° 網格、控制器 target／actual 分離、導引向量合成、
  方向換算、速度上限、平滑、移動細分、島嶼穿越及顯示向量一致。
- `test:scenario` 驗證強西伸副高、西退轉向、強西南季風、水氣、弱場 β
  drift、控制延遲、速度上限，以及相同種子／操作序列產生相同路徑。
- `test:e2e` 驗證六個控制器、target／actual／trend、非瞬時反應、
  2,501 格環境網格、實際移動、Pages 子路徑與既有地圖／強度回歸。

Phase 5：

- `test:unit` 驗證臺灣四種地形、0.5 km 路徑取樣、海陸事件 dedupe、
  分段損耗、再組織、尾流面積／累積／恢復、雨影、10 分鐘雨量積分、
  WeatherStation schema 及完整 reset。
- `test:integration` 驗證 Environment → Steering → Land → Ocean →
  Intensity → Observation 的正式更新順序與 Pages 子路徑模組載入。
- `test:scenario` 量化陸地停留、臺灣東西穿越、強慢／弱快尾流、OHC、
  再組織及迎風／背風雨量。
- `test:e2e` 驗證六站風雨、動態尾流、海陸事件、完整重啟、實際 Chrome
  操作、Pages 子路徑及 Phase 2～4 回歸。

Phase 6：

- `test:unit` 驗證 Level 等效 schema、未知欄位／metric／可執行內容拒絕、
  四個目標、強度／雨量不足、12 小時消散、超時、區域順序、單次事件、
  計分與新 `LevelState`。
- `test:integration` 以正式 Environment → Steering → Land → Ocean →
  Intensity → Observation → Level pipeline 驗證單次結算、Pages 子路徑
  模組載入及全新 session。
- `test:scenario` 驗證固定合法輸入勝利黃金重播，以及未通過那霸的失敗路徑。
- `test:e2e` 驗證目標面板、教學、目標區、861 步勝利、結果分數、停止補算、
  單次結算、完整重啟、Pages 子路徑與 Phase 2～5 回歸。

Phase 7：

- `test:unit` 驗證東／西岸事件、中央山脈穿越、站群、內陸深度、
  警戒圈四狀態、邊界去抖動、第三次進圈與關卡切換隔離。
- `test:scenario` 驗證護國神山與韋恩三進各自的版本化黃金重播，
  並持續驗證那霸風雨基準。
- `test:e2e` 驗證三關選擇器、全新 session、動態關卡 UI、警戒圈呈現及
  更新後的那霸黃金勝利。

Phase 8：

- `test:unit` 驗證沙盒 preset、SST／OHC、localStorage schema／回復／
  migration、安全 JSON、CSV 注入防護、PNG footer 與摘要 metadata。
- `test:integration` 將正式沙盒模擬匯出、重新匯入，再以相同 seed 與
  step 操作重播至相同 track 與 fingerprint。
- `test:e2e` 驗證沙盒無勝敗、設定套用、localStorage 重新整理恢復、
  圖層、倍速、完整重設、CSV／JSON／PNG 下載及合法／非法 JSON 匯入。

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

## Phase 8 需求追蹤

| Requirement ID | 需求 | 測試／證據 | 狀態 |
|---|---|---|---|
| SBX-PRESET-001 | 生成、風壓、結構、SST、OHC、環境、地形與 seed 設定 | unit／Chrome／Browser | passed |
| SBX-NO-END-001 | 沙盒不設勝敗並沿用正式物理管線 | unit／integration／Chrome | passed |
| SBX-CONTROL-001 | 暫停、倍速、重啟、圖層及環境檢視 | Chrome／Browser | passed |
| STORE-V1-001 | 固定 localStorage v1 schema 與重新整理恢復 | unit／Chrome | passed |
| STORE-SAFE-001 | 損壞資料安全回復及 migration 入口 | unit | passed |
| STORE-PRIVACY-001 | 不保存敏感個資 | schema／code inspection | passed |
| IO-CSV-001 | 完整軌跡欄位及試算表公式注入防護 | unit／Chrome | passed |
| IO-JSON-001 | 模擬／preset JSON 匯出後可驗證匯入 | unit／integration／Chrome | passed |
| IO-SAFE-001 | 拒絕非法、過大、過深、未知及原型污染欄位 | unit／Chrome | passed |
| IO-PNG-001 | PNG 含原 Canvas、名稱、時間、品牌及預報免責 | unit／Chrome | passed |
| IO-TRACE-001 | seed、操作、schema、model、PRNG、build commit 完整 | unit／integration | passed |
| IO-REPLAY-001 | 相同 seed 與操作重現 track／fingerprint | integration | passed |
| SBX-RESET-001 | 關卡與沙盒切換建立全新 session | Chrome E2E | passed |
| DEPLOY-PAGES-008 | 純靜態瀏覽器 API 與 Pages 子路徑 | integration／Chrome／Browser | passed |

## Phase 8 實際結果

- 完成日期：2026-07-30；精確完成時間記錄於 `PHASE-STATUS.md`。
- Node.js：24.18.1 LTS；npm：11.16.0。
- ESLint：通過，0 errors、0 warnings。
- TypeScript：不適用；本專案目前為原生 ES Modules。
- 單元測試：102 passed、0 failed。
- 整合測試：6 passed、0 failed。
- 情境測試：16 passed、0 failed。
- 實際 Chrome E2E：12 passed、0 failed。
- Codex in-app Browser：Pages 子路徑、1280 px、無水平 overflow；
  沙盒欄位、無勝敗標示、圖層與匯出區可見，輸入欄桌面單欄可讀。
- GitHub Actions：未執行；workflow 未 push。
- GitHub Pages API／部署：未執行／未部署。
- 公開網站：未驗證；本階段只有本機 Pages 子路徑驗證。

## Phase 7 需求追蹤

| Requirement ID | 需求 | 測試／證據 | 狀態 |
|---|---|---|---|
| LVL-MTN-001 | 生成值、東岸登陸、西岸出海、48 m/s、山脈、風雨目標 | data／unit／golden scenario | passed |
| LVL-MTN-002 | 西側登陸與未穿越中央山脈不得誤完成 | `phase-07-levels.test.js` | passed |
| LVL-WAYNE-001 | 400 km 警戒區四狀態與 36／18／36 步去抖動 | unit／golden scenario | passed |
| LVL-WAYNE-002 | 三次進圈、至少兩次登陸且每次至少 28 m/s | unit／scenario | passed |
| LVL-WAYNE-003 | 中部事件雨量 400 mm 與任一次陣風 35 m/s | level data／scenario | passed |
| LVL-FAIL-007 | 18 小時消散、中國內陸 300 km、邊界、超時 | data／evaluator tests | passed |
| LVL-ISOLATE-007 | 三關切換建立全新 session，無狀態污染 | unit／Chrome E2E | passed |
| LVL-GOLDEN-007 | 三關各有版本化、決定性黃金 fixture | scenario／Chrome E2E | passed |
| LVL-HISTORY-007 | 三關標示歷史靈感且非歷史重建 | data／unit／browser | passed |
| DEPLOY-PAGES-007 | 純靜態相對路徑及 Pages 子路徑 | integration／Chrome／browser | passed |

## Phase 7 實際結果

- 完成日期：2026-07-30；精確完成時間記錄於 `PHASE-STATUS.md`。
- Node.js：24.18.1 LTS；npm：11.16.0。
- ESLint：通過，0 errors、0 warnings。
- TypeScript：不適用；本專案目前為原生 ES Modules。
- 單元測試：92 passed、0 failed。
- 整合測試：5 passed、0 failed。
- 情境測試：16 passed、0 failed。
- 實際 Chrome E2E：10 passed、0 failed；包含三關切換、警戒圈呈現、
  Pages 子路徑與那霸黃金勝利／完整重啟。
- 黃金重播：那霸 step 751／`c75cfad2`／5,539；護國神山
  step 1,150／`cd630b1e`／8,750；韋恩三進
  step 1,283／`a0ecd38a`／6,250。
- Codex in-app Browser：Pages 子路徑可載入；三關可切換且顯示各自標題、
  時限、目標、免責聲明與初始值；韋恩 400 km 教育警戒圈可見。
- GitHub Actions：未執行；workflow 未 push。
- GitHub Pages API／部署：未執行／未部署。
- 公開網站：未驗證；本階段只有本機 Pages 子路徑驗證。

## 瀏覽器與外部環境矩陣

| 環境 | Phase 8 狀態 | 說明 |
|---|---|---|
| Node HTTP smoke | passed | Pages 子路徑、ES Module 及 map JSON MIME／版本正確 |
| Codex in-app Browser | passed | Pages 子路徑；沙盒、無勝敗、設定、圖層與匯出 UI 可見；無水平 overflow |
| 實際 Chrome | passed | 150.0.7871.187；12 個 Playwright E2E、0 failed |
| 自動 Chromium | not_run | workflow 已定義但未 push；本機 E2E 指定實際 Chrome |
| 實際 Edge | not_verified | 本機未安裝 |
| 實際 macOS Safari | not_run | Phase 9 必要實機驗證 |
| 實際 iPadOS Safari | not_verified | 目前無實體裝置證據 |
| GitHub Actions | not_run | test workflow 已建立；未獲 push 授權 |
| GitHub Pages | not_deployed | Phase 9 前不得部署 |
| 公開網站 | not_verified | Pages 尚未部署 |

## Phase 6 需求追蹤

| Requirement ID | 需求 | 測試／證據 | 狀態 |
|---|---|---|---|
| LVL-SCHEMA-001 | 通用 Level 格式、嚴格驗證及唯一 ID | `level-data.test.js` | passed |
| LVL-DSL-001 | Objective／Failure 白名單 DSL，不執行任意程式碼 | level data／evaluator tests | passed |
| LVL-NAHA-001 | 生成點、15 m/s、1005 hPa、168 小時及四主要目標 | unit／E2E／Browser smoke | passed |
| LVL-FAIL-001 | 邊界、12 小時消散、超時及中國大陸順序失敗 | `level-evaluators.test.js` | passed |
| LVL-STATE-001 | 四種目標狀態、正式模型統計及一次結果 | unit／integration／E2E | passed |
| LVL-EVENT-001 | 目標、失敗、結算及補算停止不重複 | evaluator／engine／integration tests | passed |
| LVL-SCORE-001 | 透明計分項目、上限、扣分及結算明細 | level data／scenario／E2E | passed |
| LVL-GOLDEN-001 | 版本化合法輸入黃金重播 fixture | scenario／integration／Chrome E2E | passed |
| LVL-RESET-001 | 重啟清除目標、結果、事件、控制、尾流及測站 | unit／integration／Chrome E2E | passed |
| LVL-MODEL-001 | 目標值只取正式物理與測站模型 | helper pipeline／scenario／code inspection | passed |
| DEPLOY-PAGES-006 | 純靜態相對路徑及 Pages 子路徑 | integration／browser harness／Chrome | passed |
| LVL-SCOPE-001 | 不建立 Phase 7 第二、三關 | `LEVELS` count／code inspection | passed |

## Phase 6 實際結果

- 完成日期：2026-07-30；精確完成時間記錄於 `PHASE-STATUS.md`。
- Node.js：24.18.1 LTS；npm：11.16.0。
- ESLint：通過，0 errors、0 warnings。
- TypeScript：不適用；本專案目前為原生 ES Modules。
- 單元測試：87 passed、0 failed。
- 整合測試：5 passed、0 failed。
- 情境測試：14 passed、0 failed。
- 實際 Chrome E2E：9 passed、0 failed；包含 861 步黃金重播、
  VICTORY 單次結算、5,519／6,250 計分及全狀態重啟。
- Browser harness：8/8 passed。
- 黃金重播：合法 UI 操作為風切 4 m/s、副高 85%；勝利 step 861，
  fingerprint `9bb637a1`，四個目標各完成一次。
- Codex in-app Browser：1280×720、Pages 子路徑、無水平 overflow；
  初始 MENU、168h、四個 pending 目標、教學與模型免責聲明可見；
  Canvas 顯示生成點、那霸 50 km 與琉球 150 km 目標區。
- GitHub Actions：未執行；workflow 未 push。
- GitHub Pages API／部署：未執行／未部署。
- 公開網站：未驗證。

## Phase 5 需求追蹤

| Requirement ID | 需求 | 測試／證據 | 狀態 |
|---|---|---|---|
| LND-TERRAIN-001 | 西部平原、中央山脈、東部縱谷、海岸山脈分區 | `land-interaction.test.js`、Canvas | passed |
| LND-PATH-001 | 海岸跨越採 0.5 km 取樣及同一步陸地時間比例 | unit／scenario tests | passed |
| LND-EVENT-001 | LANDFALL／SEA_REENTRY 含完整欄位且不重複 | unit／integration／Browser smoke | passed |
| LND-LOSS-001 | 摩擦、地形、組織與對稱損耗依固定時間積分 | unit／scenario tests | passed |
| LND-REORG-001 | 出海後有 9 小時再組織延遲 | unit／scenario tests、dashboard | passed |
| OCN-WAKE-001 | 尾流隨強度、移速、OHC、半徑及停留時間改變 | `ocean-cooling.test.js`、scenario tests | passed |
| OCN-WAKE-002 | 尾流覆蓋暴風半徑內多格並以 240 小時常數恢復 | unit／integration／Canvas | passed |
| RAIN-TERRAIN-001 | 迎風抬升、背風雨影與季風／尾流因子 | rainfall／scenario tests | passed |
| OBS-STATION-001 | 六站持續風、陣風、雨率及 10 分鐘累積 | unit／integration／Chrome E2E | passed |
| RESET-SESSION-001 | 重啟清除時鐘、事件、尾流、測站與路徑 | engine／Chrome／Browser smoke | passed |
| DEPLOY-PAGES-005 | 純靜態相對路徑及 Pages 子路徑 | integration／Chrome／Browser smoke | passed |
| LND-SCOPE-001 | 不建立 Phase 6 關卡目標或勝敗判定 | architecture／code inspection | passed |

## Phase 5 實際結果

- 完成時間：2026-07-30T20:48:33+08:00。
- Node.js：24.18.1 LTS；npm：11.16.0。
- `npm ci`／audit：通過；74 個套件，0 vulnerabilities。
- ESLint：通過，0 errors、0 warnings。
- TypeScript：不適用；本專案目前為原生 ES Modules。
- 單元測試：76 passed、0 failed。
- 整合測試：3 passed、0 failed。
- 情境測試：12 passed、0 failed。
- 實際 Chrome E2E：7 passed、0 failed；包含六站模型風雨、動態尾流、
  session reset、Pages 子路徑及 Phase 2～4 回歸。
- Browser harness：7/7 passed。
- Codex in-app Browser：1280×720、無水平 overflow；24× 執行 548 steps
  至 3 天 19 小時 20 分，實際路徑產生 Ishigaki `SEA_REENTRY`；尾流曾達
  中心 0.26°C／7 cells，六站值隨模型變化；Canvas 顯示地形、尾流、
  雨量 halo、測站與路徑；重啟後 MENU、step 0、尾流／事件／六站累積量
  全歸零；Console warning/error 0。
- GitHub Actions：未執行；workflow 未 push。
- GitHub Pages API／部署：未執行／未部署。
- 公開網站：未驗證。

## Phase 4 需求追蹤

| Requirement ID | 需求 | 測試／證據 | 狀態 |
|---|---|---|---|
| STR-GRID-001 | 100°E～160°E、0°N～40°N 的 1° 網格，共 2,501 cells | `environment-grid.test.js`、dashboard | passed |
| STR-FIELD-001 | 背景場、副高、西南季風、β drift 與 seeded perturbation | unit／scenario tests、Canvas | passed |
| STR-CONTROL-001 | 六個控制器只改 target，actual 依時間常數延遲 | unit／Chrome E2E／Browser smoke | passed |
| STR-VECTOR-001 | U 向東、V 向北、m/s，顯示與物理向量一致 | steering／renderer tests、Canvas | passed |
| STR-MOTION-001 | 經緯度位移、方向／速度平滑及 45 km/h 上限 | `steering-model.test.js` | passed |
| STR-LAND-001 | 最長 3 km 子段及 segment-polygon 交會，不能跳過狹島 | steering／geo tests | passed |
| STR-SCENARIO-001 | 強副高西行、西退轉向、強季風東北分量、弱場 β drift | `steering-scenarios.test.js` | passed |
| STR-DETERMINISM-001 | 相同 seed／操作序列產生相同 path／fingerprint | unit／scenario tests | passed |
| STR-UI-001 | 顯示 target／actual／trend、氣流箭頭、等壓線、季風槽及 NEXT | Chrome E2E／Browser smoke | passed |
| STR-SCOPE-001 | 無硬編碼路徑；UI 不直接改座標；海陸正式效應留待 Phase 5 | architecture／code inspection | passed |
| DEPLOY-PAGES-004 | 純靜態相對路徑及 Pages 子路徑 | integration／Chrome／Browser smoke | passed |

## Phase 4 實際結果

- 完成時間：2026-07-30T20:21:30+08:00。
- Node.js：24.18.1 LTS；npm：11.16.0。
- `npm ci`／audit：通過；74 個套件，0 vulnerabilities。
- ESLint：通過，0 errors、0 warnings。
- TypeScript：不適用；本專案目前為原生 ES Modules。
- 單元測試：66 passed、0 failed。
- 整合測試：2 passed、0 failed。
- 情境測試：8 passed、0 failed。
- 實際 Chrome E2E：6 passed、0 failed；包含控制延遲、位置非直接跳動、
  2,501 格網格、Pages 子路徑及 Phase 2／3 回歸。
- Browser harness：6/6 passed。
- Codex in-app Browser：1280 px 無水平 overflow；副高 target 由 72%
  改為 100% 時 actual 先維持 72%，24× 執行後漸進至 80%；位置由
  15.00°N、135.00°E 移至 15.17°N、134.64°E；Canvas 顯示氣流箭頭、
  等壓線、副高範圍、季風槽、NEXT 向量及移動路徑；Console
  warning/error 0。
- GitHub Actions：未執行；workflow 未 push。
- GitHub Pages API／部署：未執行／未部署。
- 公開網站：未驗證。

## Phase 3 需求追蹤

| Requirement ID | 需求 | 測試／證據 | 狀態 |
|---|---|---|---|
| INT-SCHEMA-001 | Typhoon、GridCell、Environment 完整欄位與拒絕未知欄位 | `intensity-model.test.js` | passed |
| INT-PRNG-001 | 固定 PRNG 版本及四個獨立子流 | `random.test.js` | passed |
| INT-FACTOR-001 | SST、OHC、科氏組織、風切、水氣、海陸、地形、冷水尾流 | unit／scenario tests、dashboard | passed |
| INT-RESPONSE-001 | 目標強度、時間反應、單步與總上下限 | unit／scenario tests | passed |
| INT-PRESSURE-001 | 氣壓與風速的有界遊戲映射 | `intensity-model.test.js` | passed |
| INT-STRUCTURE-001 | 五種結構、遲滯與不抖動 | unit tests、Canvas、Browser smoke | passed |
| INT-DETERMINISM-001 | 同版本、種子、操作序列同 fingerprint | random／intensity tests | passed |
| INT-FPS-001 | 60／120 FPS 同固定步數同結果 | scenario tests | passed |
| INT-VISUAL-001 | 粒子開關及消耗不改變物理 | unit、Chrome E2E、Browser smoke | passed |
| INT-DASHBOARD-001 | 顯示強度、結構與環境因子 | Chrome E2E、Browser smoke | passed |
| INT-SCOPE-001 | Phase 3 固定位置，不提前建立正式導引 | architecture／code inspection | passed |
| DEPLOY-PAGES-003 | 純靜態相對路徑及 Pages 子路徑 | integration／Chrome／Browser smoke | passed |

## Phase 3 實際結果

- 完成日期：2026-07-30；精確完成時間記錄於 `PHASE-STATUS.md`。
- Node.js：24.18.1 LTS；npm：11.16.0。
- ESLint：通過，0 errors、0 warnings。
- 單元測試：53 passed、0 failed。
- 整合測試：2 passed、0 failed。
- 情境測試：5 passed、0 failed。
- 實際 Chrome E2E：5 passed、0 failed；包含 dashboard、fingerprint、
  粒子控制、Pages 子路徑與 Phase 2 地圖回歸。
- Browser harness：5/5 passed。
- Codex in-app Browser：1280 px 無水平 overflow；24× 執行至 comma；
  粒子關閉前後暫停狀態 fingerprint 同為 `2e870f46`；Console
  warning/error 0。
- GitHub Actions：未執行；workflow 未 push。
- GitHub Pages API／部署：未執行／未部署。
- 公開網站：未驗證。

## Phase 2 需求追蹤

> 歷史狀態：下表是 2026-07-30 Phase 2 的真實驗收證據。
> `GEO-POINTER-001` 維持 passed；自 `DEC-0039` 起退場的是現行玩家查詢
> 介面、面板與選取游標，不是座標轉換純函式，也不否定歷史通過紀錄。

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
