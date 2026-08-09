# SGTS-NH Phase 狀態
## 執行、完成與使用者批准紀錄

> **KOSMOS TOOLKIT｜探真拓知酷**

## 狀態表

| Phase | 狀態 | 分支 | 完成 Commit | 批准 Commit | 測試 | completedAt | approvedAt | 批准原文 | 阻塞原因 |
|---|---|---|---|---|---|---|---|---|---|
| 0 | approved | `phase/00-foundation` | `10eb51c` | `67697c6` | lint、4 unit、1 integration、browser smoke passed；scenario／E2E N/A | 2026-07-30T18:44:39+08:00 | 2026-07-30T18:50:36+08:00 | 同意執行 Phase 01 |  |
| 1 | approved | `phase/01-engine-ui` | `0e3a086` | `a86d9da` | lint、25 unit、2 integration、3 Chrome E2E、browser smoke passed；scenario N/A；Actions not_run | 2026-07-30T19:06:41+08:00 | 2026-07-30T19:09:14+08:00 | 批准 Phase 1，並同意執行 Phase 2 |  |
| 2 | approved | `phase/02-map-geography` | `2a426c4` | `26cde99` | lint、44 unit、2 integration、4 Chrome E2E、browser smoke passed；scenario N/A；Actions not_run | 2026-07-30T19:25:29+08:00 | 2026-07-30T19:46:24+08:00 | 批准 Phase 2，並進入 Phase 3 |  |
| 3 | approved | `phase/03-intensity` | `4a1bb3c` | `2d16589` | lint、53 unit、2 integration、5 scenario、5 Chrome E2E、browser smoke passed；Actions not_run | 2026-07-30T20:01:26+08:00 | 2026-07-30T20:03:14+08:00 | 批准 Phase 3，並進入 Phase 4 |  |
| 4 | approved | `phase/04-steering` | `c3c7d51` | `3924d30` | lint、66 unit、2 integration、8 scenario、6 Chrome E2E、browser smoke passed；Actions not_run | 2026-07-30T20:21:30+08:00 | 2026-07-30T20:24:56+08:00 | 批准 Phase 4，並進入 Phase 5 |  |
| 5 | approved | `phase/05-land-rain` | `131f891` | `0e1e0af` | lint、76 unit、3 integration、12 scenario、7 Chrome E2E、browser smoke passed；Actions not_run | 2026-07-30T20:48:33+08:00 | 2026-07-30T20:54:15+08:00 | 批准 Phase 5，並進入 Phase 6 |  |
| 6 | approved | `phase/06-level-naha` | `5f6efda` | `add97b0` | lint、87 unit、5 integration、14 scenario、9 Chrome E2E、8/8 browser harness、browser smoke passed；Actions not_run | 2026-07-30T21:26:02+08:00 | 2026-07-30T21:29:46+08:00 | 批准 Phase 6，並進入 Phase 7 |  |
| 7 | approved | `phase/07-levels-taiwan-wayne` | `6d0f123` | `b5276d6` | lint、92 unit、5 integration、16 scenario、10 Chrome E2E、browser smoke passed；Actions not_run | 2026-07-30T22:21:56+08:00 | 2026-07-30T22:23:19+08:00 | 批准 Phase 7，並進入 Phase 8 |  |
| 8 | approved | `phase/08-sandbox-export` | `c831f13` | `8642956` | lint、102 unit、6 integration、16 scenario、12 Chrome E2E、browser smoke passed；Actions not_run | 2026-07-30T22:43:45+08:00 | 2026-07-30T22:52:31+08:00 | 批准 Phase 8，並進入 Phase 9 |  |
| 9 | approved | `main` | `8ecd40b` | `00fb94b` | lint、build、127 unit、6 integration、16 scenario、19 Chrome E2E、artifact、Actions、Pages、公開站 passed；update p95 failed；Edge／iPadOS not_verified | 2026-08-09T09:10:52+08:00 | 2026-08-09T09:10:52+08:00 | 本案截至目前算是正式結案，請做好相關設定。 | 使用者接受已知例外後正式結案；不得解讀為未執行項目已通過 |
| 10 | pending |  |  |  | not_run |  |  |  | 本案已正式結案；未批准且不執行 |

## Phase 0 執行授權

- 記錄時間：2026-07-30T18:36:12+08:00。
- 使用者原文：

> 規格 1.0.1 修訂正確，批准執行 Phase 0；同意建立公開 GitHub 倉庫，但不 push、不部署。

- 授權：執行 Phase 0、本機修改、本機 commit、建立公開 GitHub 倉庫。
- 未授權：push、merge、GitHub Pages 設定及部署。

## 批准紀錄

### Phase 0

- 批准時間：2026-07-30T18:50:36+08:00。
- 使用者原文：

> 同意執行 Phase 01

- 解讀：Phase 0 驗收通過，批准執行 Phase 1。
- 未授權：push、GitHub Pages 設定及部署。

## Phase 1 完成紀錄

- 完成時間：2026-07-30T19:06:41+08:00。
- 狀態：`completed`，不等於 `approved`。
- 分支：`phase/01-engine-ui`。
- 完成 commit：`0e3a086`。
- 本機檢查：ESLint、25 unit、2 integration、3 實際 Chrome E2E、
  Browser smoke 均通過；scenario 不適用。
- GitHub Actions：workflow 已建立但未 push，因此未執行。
- GitHub Pages API／部署：未執行／未部署。
- 公開網站：未驗證。
- 未授權：push、merge、GitHub Pages 設定及部署。
- 下一階段：Phase 2「地圖、座標與地理系統」，尚未批准，不得執行。

### Phase 1

- 批准時間：2026-07-30T19:09:14+08:00。
- 使用者原文：

> 批准 Phase 1，並同意執行 Phase 2

- 解讀：Phase 1 驗收通過，批准執行 Phase 2。
- 未授權：push、GitHub Pages 設定及部署。

## Phase 2 完成紀錄

- 完成時間：2026-07-30T19:25:29+08:00。
- 狀態：`completed`，不等於 `approved`。
- 分支：`phase/02-map-geography`。
- 完成 commit：`2a426c4`。
- 本機檢查：ESLint、44 unit、2 integration、4 實際 Chrome E2E、
  Browser smoke 均通過；scenario 不適用。
- 資料：16 個穩定 land regions、臺灣四岸段、6 個測站；來源與授權完整。
- GitHub Actions：workflow 未 push，因此未執行。
- GitHub Pages API／部署：未執行／未部署。
- 公開網站：未驗證。
- 未授權：push、GitHub Pages 設定及部署。
- 下一階段：Phase 3「颱風實體與強度模型」，尚未批准，不得執行。

### Phase 2

- 批准時間：2026-07-30T19:46:24+08:00。
- 使用者原文：

> 批准 Phase 2，並進入 Phase 3

- 解讀：Phase 2 驗收通過，批准執行 Phase 3。
- 未授權：push、GitHub Pages 設定及部署。

## Phase 3 完成紀錄

- 完成時間：2026-07-30T20:01:26+08:00。
- 狀態：`completed`，不等於 `approved`。
- 分支：`phase/03-intensity`。
- 完成 commit：`4a1bb3c`。
- 本機檢查：ESLint、53 unit、2 integration、5 scenario、
  5 實際 Chrome E2E、Browser harness 5/5 及 Browser smoke 均通過。
- 模型：`0.3.0-intensity`；PRNG：`mulberry32-v1`，四子流隔離。
- GitHub Actions：workflow 未 push，因此未執行。
- GitHub Pages API／部署：未執行／未部署。
- 公開網站：未驗證。
- 未授權：push、GitHub Pages 設定及部署。
- 下一階段：Phase 4「環境網格與導引氣流」，尚未批准，不得執行。

### Phase 3

- 批准時間：2026-07-30T20:03:14+08:00。
- 使用者原文：

> 批准 Phase 3，並進入 Phase 4

- 解讀：Phase 3 驗收通過，批准執行 Phase 4。
- 未授權：push、GitHub Pages 設定及部署。

## Phase 4 完成紀錄

- 完成時間：2026-07-30T20:21:30+08:00。
- 狀態：`completed`，不等於 `approved`。
- 分支：`phase/04-steering`。
- 完成 commit：`c3c7d51`。
- 本機檢查：ESLint、66 unit、2 integration、8 scenario、
  6 實際 Chrome E2E、Browser harness 6/6 及 Browser smoke 均通過。
- 模型：`0.4.0-steering`；網格：1°、2,501 cells；移速上限 45 km/h。
- GitHub Actions：workflow 未 push，因此未執行。
- GitHub Pages API／部署：未執行／未部署。
- 公開網站：未驗證。
- 未授權：push、GitHub Pages 設定及部署。
- 下一階段：Phase 5「海陸、中央山脈、冷水尾流與降雨」，尚未批准，不得執行。

### Phase 4

- 批准時間：2026-07-30T20:24:56+08:00。
- 使用者原文：

> 批准 Phase 4，並進入 Phase 5

- 解讀：Phase 4 驗收通過，批准執行 Phase 5。
- 未授權：push、GitHub Pages 設定及部署。

## Phase 5 完成紀錄

- 完成時間：2026-07-30T20:48:33+08:00。
- 狀態：`completed`，不等於 `approved`。
- 分支：`phase/05-land-rain`。
- 完成 commit：`131f891`。
- 本機檢查：ESLint、76 unit、3 integration、12 scenario、
  7 實際 Chrome E2E、Browser harness 7/7 及 Browser smoke 均通過。
- 模型：`0.5.0-land-rain`；臺灣四地形分區、海陸事件、動態冷水尾流、
  地形降雨與六站觀測均已接入固定 10 分鐘更新管線。
- GitHub Actions：workflow 未 push，因此未執行。
- GitHub Pages API／部署：未執行／未部署。
- 公開網站：未驗證。
- 未授權：push、merge、GitHub Pages 設定及部署。
- 下一階段：Phase 6「第一關『那霸風雨』」，尚未批准，不得執行。

### Phase 5

- 批准時間：2026-07-30T20:54:15+08:00。
- 使用者原文：

> 批准 Phase 5，並進入 Phase 6

- 解讀：Phase 5 驗收通過，批准執行 Phase 6。
- 未授權：push、GitHub Pages 設定及部署。

## Phase 6 完成紀錄

- 完成時間：2026-07-30T21:26:02+08:00。
- 狀態：`completed`，不等於 `approved`。
- 分支：`phase/06-level-naha`。
- 完成 commit：`5f6efda`。
- 本機檢查：ESLint、87 unit、5 integration、14 scenario、
  9 實際 Chrome E2E、Browser harness 8/8 及 Browser smoke 均通過。
- 模型：`0.6.0-level-naha`；第一關「那霸風雨」、白名單規則 DSL、
  單次勝敗／結算、透明計分及黃金重播均接入正式模型管線。
- 黃金重播：風切 4 m/s、副高 85%，step 861 勝利，fingerprint
  `9bb637a1`，分數 5,519／6,250。
- GitHub Actions：workflow 未 push，因此未執行。
- GitHub Pages API／部署：未執行／未部署。
- 公開網站：未驗證。
- 未授權：push、merge、GitHub Pages 設定及部署。
- 下一階段：Phase 7「第二關『護國神山』與第三關『韋恩三進』」，
  尚未批准，不得執行。

### Phase 6

- 批准時間：2026-07-30T21:29:46+08:00。
- 使用者原文：

> 批准 Phase 6，並進入 Phase 7

- 解讀：Phase 6 驗收通過，批准執行 Phase 7。
- 未授權：push、GitHub Pages 設定及部署。

## Phase 7 完成紀錄

- 完成時間：2026-07-30T22:21:56+08:00。
- 狀態：`completed`，不等於 `approved`。
- 分支：`phase/07-levels-taiwan-wayne`。
- 完成 commit：`6d0f123`。
- 本機檢查：ESLint、92 unit、5 integration、16 scenario、
  10 實際 Chrome E2E 及 Browser smoke 均通過。
- 模型：`0.7.0-taiwan-wayne`；第二關「護國神山」、第三關「韋恩三進」、
  警戒圈連續狀態、岸側／山脈事件、內陸深度失敗、三關切換隔離及
  三份黃金重播均接入通用關卡管線。
- 黃金重播：那霸 step 751／`c75cfad2`／5,539；護國神山
  step 1,150／`cd630b1e`／8,750；韋恩三進
  step 1,283／`a0ecd38a`／6,250。
- `npm audit --audit-level=high`：0 vulnerabilities。
- GitHub Actions：workflow 未 push，因此未執行。
- GitHub Pages API／部署：未執行／未部署。
- 公開網站：未驗證；只完成本機 Pages 子路徑與 Browser 驗證。
- 未授權：push、merge、GitHub Pages 設定及部署。
- 下一階段：Phase 8「沙盒、儲存與匯出」，尚未批准，不得執行。

### Phase 7

- 批准時間：2026-07-30T22:23:19+08:00。
- 使用者原文：

> 批准 Phase 7，並進入 Phase 8

- 解讀：Phase 7 驗收通過，批准執行 Phase 8。
- 未授權：push、GitHub Pages 設定及部署。

## Phase 8 完成紀錄

- 完成時間：2026-07-30T22:43:45+08:00。
- 狀態：`completed`，不等於 `approved`。
- 分支：`phase/08-sandbox-export`。
- 完成 commit：`c831f13`。
- 本機檢查：ESLint、102 unit、6 integration、16 scenario、
  12 實際 Chrome E2E 及 Browser smoke 均通過。
- 沙盒：18 欄 preset、無勝敗、SST／OHC／地形倍率、暫停、倍速、重啟、
  圖層與環境檢視均沿用正式物理 session。
- 儲存：localStorage v1、嚴格 schema、損壞回復、migration 入口、
  設定重新整理恢復及不保存敏感個資。
- 匯入匯出：CSV、模擬 JSON、preset JSON、PNG、摘要、seed／操作重播；
  拒絕過大、過深、未知與原型污染欄位，CSV 防公式注入。
- 追蹤資訊：schemaVersion 1、modelVersion `0.7.0-taiwan-wayne`、
  PRNG `mulberry32-v1`、build commit `c831f13`。
- `npm audit --audit-level=high`：0 vulnerabilities。
- GitHub Actions：workflow 未 push，因此未執行。
- GitHub Pages API／部署：未執行／未部署。
- 公開網站：未驗證；只完成本機 Pages 子路徑與 Browser 驗證。
- 未授權：push、merge、GitHub Pages 設定及部署。
- 下一階段：Phase 9「效能、相容性、發布與最終驗收」，尚未批准，不得執行。

### Phase 8

- 批准時間：2026-07-30T22:52:31+08:00。
- 使用者原文：

> 批准 Phase 8，並進入 Phase 9

- 解讀：Phase 8 驗收通過，批准執行 Phase 9 的本機測試、修正、優化、
  文件與發布準備。
- 外部操作閘門：本次原文未明列 push、GitHub Pages 設定或部署；依主規格
  Phase 9 要求，執行外部操作前仍須再次取得明確授權。

## Phase 9 執行紀錄

- 開始時間：2026-07-30T22:52:31+08:00。
- 狀態：`in_progress`，不得標記 `completed` 或 `approved`。
- 本機實作：效能監測、300／700／1200 粒子、GeoJSON 與離屏地圖快取、
  reduced motion、Canvas 文字摘要、Pages allowlist artifact、最小權限
  deployment workflow，以及第一版文件更新。
- 本機驗證：lint、109 unit、6 integration、16 scenario、15 actual Chrome
  E2E、artifact test passed；中畫質效能門檻 passed。
- macOS Safari 26.5.2：Pages 子路徑、Canvas／ES Modules、模擬步進、
  localStorage reload 與文字下載 passed。
- Microsoft Edge：`not_verified`（本機未安裝）。
- iPadOS Safari／平板效能：`not_verified`（無實體裝置證據）。
- GitHub Actions：run `30556910585` 的 test、build、deploy 全部 passed；
  source commit `03e1f12`。
- GitHub Pages API／部署：deployment `5677601892` passed；公開、HTTPS
  enforced，正式 URL 為
  `https://kisaraki.github.io/classroom-sgts-nh-tzk/`。
- 公開網站：HTTP 200；CSS、ES Module、map JSON、16 regions、品牌、
  Not for Forecasting、模擬步進及無 Console warning／error 均 passed。
- 第 24 節阻擋：第 24、27 尚未全部滿足；因此不得宣稱 Phase 9
  或第一版正式完成。

## Phase 9 發布授權

- 授權時間：2026-07-30T23:19:37+08:00。
- 使用者原文：

> 1. 暫時不考慮安裝 Edge
> 2. 暫時不測試 iPadOS
> 3. Github Pages 請協助部署
> 4. 請以輕量方式進行 commit、push及部署

- 解讀：明確批准本次 Phase 9 所需的 commit、push、GitHub Pages 設定、
  deployment 及公開網站驗證。
- 範圍限制：不得安裝 Edge；iPadOS 暫不測試，兩者維持 `not_verified`。
- 發布方式：最少必要狀態／diff 檢查、一次發布 commit、一次必要 push，
  再只追蹤目標 Actions／Pages／公開網站。

## Phase 9 發布結果

- 發布完成時間：2026-07-30T23:31:48+08:00。
- 公開驗證時間：2026-07-30T23:32:24+08:00。
- 發布 source：`03e1f12`；`main` 與 `phase/09-release` 已同步。
- GitHub Actions：run `30556910585` passed；test job `90919618691`、
  build job `90920160393`、deploy job `90920263507`。
- GitHub Pages：deployment `5677601892` passed；正式 URL：
  `https://kisaraki.github.io/classroom-sgts-nh-tzk/`。
- CI 修正：runs `30556253124`、`30556482084` 揭露跨架構浮點低位差異；
  DEC-0035 的 fingerprint 邊界正規化已由本機與 Linux x64 完整驗證。
- 剩餘狀態：Edge 與 iPadOS 依使用者指示維持 `not_verified`；Phase 9
  繼續為 `in_progress`，不得進入 Phase 10。

## Phase 9 介面修正本機紀錄

- 完成時間：2026-08-06T13:14:05+08:00。
- 狀態：仍為 `in_progress`，不得標記 `completed` 或 `approved`。
- 分支：`phase/09-release`；本次變更尚未 commit。
- 主規格：更新至 1.0.2，新增官方繁體中文完整用語、左側戰況資訊／
  右側策略操作／右下指令區、玩家介面隱藏資料匯入匯出，以及擬真地圖
  呈現邊界。
- 玩家介面：戰況地圖與任務情報在左，策略指揮台在右；1024×600 的
  行動指令完整位於首屏右下方，390×844 依序改為地圖、戰況情報、策略操作。
- 地圖：新增分層海洋、連續海面溫度、陸地明暗與紋理、雙層海岸線及
  臺灣中央山脈脊線；沿用既有授權地理資料，未加入外部影像服務。
- 後台：`SimulationIO` 與安全驗證／重播／輸出測試保留，但所有資料
  匯入匯出控制在玩家介面皆為隱藏。
- 本機驗證：Node.js 24.18.1；lint、build、109 unit、6 integration、
  16 scenario、15 actual Chrome E2E、1 artifact test 全部通過。
- Browser：1180×720、1024×600、390×844 無水平 overflow；開始／暫停
  正常；Console warning／error 0。
- GitHub Actions：本次差異 `not_run`；尚未 push。
- GitHub Pages API／部署：本次差異 `not_run`；未部署。
- 公開網站：本次差異 `not_verified`；現有網站仍為 2026-07-30 已發布版本。
- Microsoft Edge：`not_verified`；iPadOS Safari：`not_verified`。
- 授權邊界：本次未取得新的 commit、push 或部署授權，故未執行。
- 下一階段：仍不得進入 Phase 10；須先處理第 9 階段剩餘相容性證據並由
  使用者明確批准。

## Phase 9 右下指令區本機修正紀錄

- 完成時間：2026-08-06T13:32:50+08:00。
- 狀態：仍為 `in_progress`；屬主規格 1.0.2 的介面空間利用修正。
- 版面：移除指令標題、倍速與動作按鈕各自占列的浪費；1180×720 採
  單列停靠區，1024×600 採雙列停靠區，三個任務動作保持同列。
- 可觸控性：所有倍速及任務按鈕維持至少 44 px 高度。
- 自動驗證：響應式實際 Chrome E2E passed；完整回歸結果見 TESTING。
- Codex in-app Browser：本輪因管理政策驗證暫時無法存取 localhost，
  `not_run`；未以 Chrome 結果冒充。
- GitHub Actions／Pages API／部署／公開網站：本次差異均未執行或未驗證。
- Git：尚未 commit、push；沒有新的遠端寫入授權。
- Microsoft Edge／iPadOS Safari：維持 `not_verified`；不得進入 Phase 10。

## Phase 9 四象限版面本機修正紀錄

- 完成時間：2026-08-06T13:45:20+08:00。
- 狀態：仍為 `in_progress`；主規格更新至 1.0.3，本次變更尚未 commit。
- 版面：主 Canvas 擬真地圖移至上方並橫跨第一、二象限；戰況資訊位於
  第三象限；原第一象限的任務、環境與沙盒參數輸入移至第四象限。
- 空間：第三、第四象限同列等高、長內容各自捲動；緊湊即時指令保留在
  第四象限下緣，避免右下形成無功能空白。
- 響應式：1180×720、1024×600 維持上方全幅地圖與下方雙欄；390×844
  依地圖、戰況資訊、參數操作順序改為單欄。
- 本機驗證：Node.js 24；lint、build、109 unit、6 integration、16 scenario、
  15 actual Chrome E2E、1 artifact test 全部通過。
- Codex in-app Browser：因管理政策驗證暫時無法存取 localhost，`not_run`；
  未以實際 Chrome E2E 冒充。
- Schema／資料：既有地圖、關卡、沙盒、儲存與後台 I/O 契約未變，passed。
- TypeScript：`not_applicable`；專案為原生 JavaScript ES Modules。
- GitHub Actions／Pages API／部署：本次差異 `not_run`；未 push、未部署。
- 公開網站：本次差異 `not_verified`；既有公開站不是本輪變更證據。
- Microsoft Edge／iPadOS Safari：維持 `not_verified`。
- 授權邊界：未取得新的 commit、push 或部署授權，故未執行。
- 下一階段：仍不得進入 Phase 10；須先完成第 9 階段剩餘相容性證據並由
  使用者明確批准。

## Phase 9 四象限版面發布授權

- 授權時間：2026-08-06T15:10:13+08:00。
- 使用者原文：

> 同意准予 commt、push及部署至 Github 及 github pages

- 解讀：明確批准將目前已驗證的 Phase 9 四象限版面成果建立必要 commit、
  快轉更新至 GitHub `main`，並透過既有 GitHub Actions 部署 GitHub Pages。
- 分支範圍：依使用者先前的 `main` only 指示，發布與公開網站驗證成功後，
  GitHub 僅保留 `main`；不得使用強制推送，不建立新的遠端 Phase 分支。
- 發布閘門：測試 workflow 及 Pages workflow 必須通過後才可刪除既有遠端
  `phase/09-release`，以保留可回復錨點。
- Phase 狀態：本授權只解除 commit、push 與部署閘門，不等於 Phase 9
  驗收批准；Phase 9 維持 `in_progress`，Phase 10 維持 `pending`。
- 未驗證項目：Microsoft Edge 與 iPadOS Safari 維持 `not_verified`。

## Phase 9 四象限版面發布結果

- 發布完成時間：2026-08-06T15:18:44+08:00。
- 紀錄時間：2026-08-06T15:21:36+08:00。
- 發布 source：`73e5a3676db1787b9ff4147cd05f8b34a18759b1`；遠端 `main`
  由 `b2ddc42b4a675111dd422f6c977157bc534d9ea5` 非強制快轉更新。
- GitHub Actions：push event 已由 GitHub 接收但未自動建立 run，故依既有發布
  流程手動觸發一次 Pages workflow；run `31080240842` passed。
- Jobs：test `92547169714`、build `92547547410`、deploy `92547621782`
  全部 passed；Pages workflow 內的 `npm run check` 及 artifact 閘門通過。
- 獨立 `Test` workflow：本次 push 未自動排程，`not_run`；未以 Pages 以外的
  獨立 workflow 結果冒充。
- GitHub Pages：deployment `5775272960`，最新狀態 `success`；Pages API
  `build_type=workflow`、`public=true`、`https_enforced=true`。
- 正式網址：`https://kisaraki.github.io/classroom-sgts-nh-tzk/`；deployment
  狀態提供相同 environment URL。
- 公開網站瀏覽器驗證：Codex in-app Browser 因管理政策無法完成網站安全
  檢查，兩次開啟均被拒絕，故本輪實際瀏覽器 smoke test 為 `not_verified`；
  未以 Actions、Pages API 或部署狀態冒充實際瀏覽器通過。
- Schema／資料：既有地圖、關卡、沙盒、儲存與後台 I/O 契約未變；完整
  Actions 檢查 passed。TypeScript：`not_applicable`。
- 分支：遠端 `phase/09-release` 已在 `main` 成功部署後刪除，GitHub 僅保留
  `main`。
- Phase 狀態：仍為 `in_progress`；Microsoft Edge、iPadOS Safari 與本輪
  公開站實際瀏覽器 smoke test 維持 `not_verified`，Phase 10 維持 `pending`。

## Phase 9 生命史、旋轉與真實地形本機修正紀錄

- 紀錄時間：2026-08-06T16:06:52+08:00。
- 狀態：仍為 `in_progress`；主規格更新至 1.0.4，本次差異尚未 commit、
  push 或部署。
- 颱風尺寸：渲染端依 `active`、`structureStage` 與物理暴風半徑產生可辨識
  生命史尺度；未寫回 `Typhoon`，模型版本與黃金重播不變。
- 旋轉：北半球 Canvas 粒子改為負角速度，畫面由東向北呈逆時針；移動
  方向角未反號。
- 地形：加入 Natural Earth II 1:10m、2,400×1,600、透明海洋 WebP，並以
  Natural Earth 1:10m 陸地多邊形建立海岸遮罩；物理海陸與地形判定仍由
  既有資料負責。載入、解碼或尺寸失敗時沿用簡化地形。
- 本機驗證：Node.js 24.18.1；lint、build、116 unit、6 integration、
  16 scenario、16 actual Chrome E2E、1 artifact test 全部通過。
- 效能：中畫質中位 59.88 FPS、1% low 56.82 FPS、Long Task 0；但 update
  p95 6.1 ms 高於主規格 <4 ms 門檻，故效能接受標為 `failed`，仍需處理。
- Codex in-app Browser：管理政策無法完成 localhost 安全檢查，`not_run`；
  未以實際 Chrome 自動化冒充。
- Schema／資料：新地形 metadata、來源、授權、尺寸、bounds、MIME 與
  SHA-256 passed；既有地圖、關卡、沙盒、儲存與後台 I/O 契約未變。
- TypeScript：`not_applicable`；原生 JavaScript ES Modules。
- GitHub Actions／Pages API／部署：本次差異 `not_run`；公開網站
  `not_verified`。既有 deployment `5775272960` 不是本輪證據。
- Microsoft Edge／iPadOS Safari：維持 `not_verified`。
- 授權邊界：本次請求沒有重新授權 commit、push 或部署，故未執行；
  Phase 10 維持 `pending`。

## Phase 9 六站地圖卡、查詢退場與鏡頭操作本機修正紀錄

- 紀錄日期：2026-08-06。
- 狀態：仍為 `in_progress`；主規格更新至 1.0.5，本次差異尚未 commit、
  push 或部署。
- 六站觀測：那霸、臺北、臺中、日月潭、花蓮與澎湖模型觀測改為地圖內
  有色毛玻璃卡與定位引線；窄螢幕採地圖內三欄二列緊湊佈局。
- 查詢退場：玩家前端查詢面板、點選／Enter 查詢與選取游標已移除；
  Phase 2 的座標轉換、commit／批准與 `GEO-POINTER-001 passed` 保留為歷史證據。
- 視角操作：支援指標錨定滾輪縮放、滑鼠／單指拖曳、雙指縮放平移、
  放大／縮小／重設按鈕，以及加號、減號、方向鍵與 Home／0 鍵盤操作。
- 隔離：全部 Canvas 世界圖層與 DOM 測站卡共用同一有效地理邊界；
  視角不進入物理、step、重播、匯出或 fingerprint。
- Schema／資料：`schemaVersion=1`、`modelVersion=0.7.0-taiwan-wayne`、測站、
  地理、關卡、儲存與後台 I/O 契約均未變，passed。
- 本機驗證：Node.js 24.18.1；lint、build、127 unit、6 integration、
  16 scenario、19 actual Google Chrome E2E、1 artifact test 全部通過。
- 觸控證據：Chrome DevTools Protocol 雙指事件通過，但不代表 iPadOS
  Safari 實體裝置；iPadOS 維持 `not_verified`。
- 效能：移除每畫格版面量測後，中畫質中位 59.88 FPS、1% low 57.80、
  render 1.178／1.7 ms、Long Task 0 通過；update p95 6.1 ms 仍高於 <4 ms 門檻，
  故維持 `failed`。
- Codex in-app Browser：管理員安全政策無法驗證 localhost，`not_run`；
  未繞過政策，也未以 Chrome E2E 冒充。
- TypeScript：`not_applicable`；Microsoft Edge：`not_verified`。
- GitHub Actions／Pages API／部署：本次差異 `not_run`；公開網站
  `not_verified`，既有 deployment 不是本次差異的證據。
- 授權邊界：本次請求未重新授權 commit、push 或部署，故未執行。
  Phase 9 未完成，Phase 10 維持 `pending`。

## Phase 9 1.0.5 發布結果

- 發布日期：2026-08-09。
- 發布 source：`d1ea886aeeaef4ed3ff19e2d33b52d75e78015fe`；使用者明確授權後，
  遠端 `main` 由 `c646c56` 快轉更新，未建立其他分支。
- GitHub Actions：push event 已接收但未自動建立 run，故依既有流程以
  `workflow_dispatch` 手動啟動 Pages workflow；run `31287364008` passed。
  test job `93178520862`、build job `93178722454`、deploy job `93178759245`
  皆成功。
- GitHub Pages：Pages API 顯示 `build_type=workflow`、HTTPS enforced；根頁、
  `js/rendering/MapCamera.js` 與 `assets/maps/northwest-pacific-terrain-v1.webp`
  於正式網址皆取得 HTTPS HTTP 200。deployments REST 端點回傳 404，未將其
  視為部署失敗，部署證據以成功的 Actions deploy job 與公開資產回應為準。
- 當時狀態：本次遠端發布證據已補齊；效能 update p95 6.1 ms、Microsoft Edge
  與 iPadOS Safari 仍分別為 failed、`not_verified`，故在尚未取得結案裁示時
  Phase 9 維持 `in_progress`，Phase 10 維持 `pending`。

## Phase 9 正式結案批准

- 批准時間：2026-08-09T09:10:52+08:00。
- 使用者原文：

> 本案截至目前算是正式結案，請做好相關設定。

- 解讀：使用者以專案所有者身分接受截至結案時的現況與已知例外，批准
  Phase 9 第一版發布結果並指示正式結案。Phase 9 更新為 `approved`。
- 證據誠信：中畫質 update p95 6.1 ms 仍為 `failed`；Microsoft Edge 與
  iPadOS Safari 仍為 `not_verified`。結案批准是對已揭露例外的接受，
  不得改寫或冒充技術驗證通過。
- 選配範圍：Phase 10 未獲執行批准，維持 `pending` 並標示結案後不執行。
- 版本設定：第一版定為 `1.0.0`；依主規格建立 annotated tag `v1.0.0`
  與 release notes。GitHub repository 保持公開、`main` only 與 Pages 可用；
  未經另行指示不封存 repository。

## v1.0.1 結案後介面維護（Phase 9 發布後維護）

- `completedAt`：2026-08-09T11:00:43+08:00。
- 狀態：`completed`；本輪已依明確操作授權 commit、push 及部署，但尚未取得產品
  `approved`、未建立版本標籤或 GitHub Release。Phase 9 第一版仍維持 `approved`，
  Phase 10 維持 `pending` 且不執行。
- 分支：`main`；本輪實作 commit 為 `37e2b213a9c86686f058e12d270804a408949d19`。
- 使用者原文：

> 發現修正點，重新啟動修正。
> 一、六站模型觀測數據會遮擋地圖主視線，請移到地圖空白區域，例如中國大陸內陸或新幾內亞區域。並可以以滑鼠進行拖曳，放置到使用者期望的位置。
> 二、六站模型觀測數據文字請做好排版，空間過於浪費。
> 三、請刪除畫面上的開發用資訊。

- 規格／版本：主規格更新至 1.0.7；`package.json` 與 lockfile 更新為
  `1.0.1`。既有 annotated tag `v1.0.0`、Release 與第一版結案史實不變。
- 六站卡位：六站真實 `lon`／`lat`、模型觀測、定位點及引線保留；資訊卡
  以正規化畫面座標預設分置中國大陸內陸直列與南側低干擾橫列。卡片可用
  滑鼠、觸控筆、單指拖曳、方向鍵微調，並以 Home 鍵或按兩下個別歸位；
  地圖邊界、卡片碰撞及地圖控制列均納入避讓；真實定位點另置於卡片上方
  圖層，相機移動時保持可見但不推動卡位。
- 資訊排版：六卡改採高密度語意資料格，完整顯示測站名稱、持續風、最大
  陣風、當前雨率、累積雨量、與颱風中心距離、地形修正及模擬更新時間；
  窄螢幕採兩欄，淺橫向採四欄兩列並保留右下控制空間；核心標籤與數值
  字級至少為 10 px／11 px，未以不明縮寫或極小字壓縮；模擬前進後的完整
  更新時間亦不會造成卡片裁切。
- 玩家診斷：DOM 與 Canvas 移除頁面可見性、FPS、固定步長、步次、更新／
  繪製耗時、Long Task、粒子數、顯示像素比例、部署平台、地理／網格數、
  fingerprint、U／V 導引向量及內部目標風速。`PerformanceMonitor`、固定步進、
  fingerprint、後台 I/O、Canvas 無障礙摘要及 `[hidden]` runtime telemetry
  仍保留，不進入玩家視覺及無障礙樹。
- 隔離：卡位只屬工作階段呈現狀態，不進入 localStorage、匯出 schema、
  測站觀測、地圖鏡頭、物理、step、重播或 fingerprint。
- Schema／資料：`schemaVersion=1`、`modelVersion=0.7.0-taiwan-wayne`；測站、
  地理、關卡、沙盒、儲存與後台 I/O 契約均未變，`passed`。TypeScript：
  `not_applicable`。
- 本機驗證：Homebrew Node.js 24.18.1、npm 11.16.0；lint、build、130 unit、
  6 integration、16 scenario、19 actual Google Chrome E2E、1 artifact test
  全部通過。
- Codex in-app Browser：`passed`。本機正式子路徑可見六卡低干擾配置與完整
  文字，玩家診斷不再出現；實際拖曳臺中卡約 160×20 px 時，地圖中心、縮放
  與 step 不變，按兩下可精確恢復預設位置。
- 效能：本輪中畫質中位 59.88 FPS、1% low 59.52、render 0.850／2.2 ms、
  update 1.687／3.7 ms、Long Task 0，全部符合門檻，`passed`。這是 `v1.0.1`
  候選的新量測；`v1.0.0` 結案時 update p95 6.1 ms 的 `failed` 歷史證據仍
  保留，不作回溯改寫。
- 相容性：Microsoft Edge、iPadOS Safari 保持 `not_verified`，未以 Chromium、
  Chrome 觸控事件或桌面窄視窗冒充實機證據。
- GitHub Actions：`passed`；run `31292327492` 以本輪實作 commit 執行，test
  `93191510026`、build `93191692272`、deploy `93191721828` 全部 success。
- GitHub Pages／部署：`passed`；deployment `5815084626`、來源 commit
  `37e2b213a9c86686f058e12d270804a408949d19`、state `success`。
- 公開網站：HTTP 驗證 `passed`；公開網址回應 200 並提供本輪站點結構。受管理端
  安全檢查阻擋，瀏覽器視覺 smoke 為 `not_verified`，未以其他瀏覽器冒充。
- 遠端邊界：使用者原文「同意准予 commt、push及部署至 Github 及 github pages」
  授權本輪 commit、push、Actions 手動觸發與 Pages 部署；未授權新 tag、GitHub
  Release 或設定變更，故未執行。
- 需求追蹤：`UI-MAP-STATION-PLACEMENT-001`、`UI-MAP-STATION-DRAG-001`、
  `UI-MAP-STATION-DENSITY-001`、`SIM-STATION-PRESENTATION-ISOLATION-001`、
  `UI-DEV-DIAGNOSTIC-RETIRE-001` 均為 `passed`。
