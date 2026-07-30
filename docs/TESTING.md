# SGTS-NH 測試策略
## 需求追蹤、測試分類與驗收證據

> **KOSMOS TOOLKIT｜探真拓知酷**

## 工具鏈

- Node.js 24 LTS。
- npm 11。
- ESLint。
- Node.js 內建 `node:test`。
- Playwright 1.62.0，以本機實際 Google Chrome 執行 Phase 1～8 E2E；CI
  定義使用 Chromium。
- WebKit 模擬不得冒充實際 Safari 或 iPadOS。

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
- ESLint：以最終 `npm run check` 結果為準。
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
