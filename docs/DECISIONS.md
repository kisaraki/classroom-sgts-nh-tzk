# SGTS-NH 架構決策紀錄
## Phase 0～6 架構決策

> **KOSMOS TOOLKIT｜探真拓知酷**

## DEC-0001｜GitHub Pages 純靜態執行

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：正式網站只使用 HTML、CSS、ES Modules、Canvas 2D、JSON 與公開靜態素材。
- 理由：符合主規格、無後端及 GitHub Pages 子路徑需求。
- 影響：Node.js 只屬開發工具；正式程式不得依賴 Node.js API。

## DEC-0002｜Node.js 24 LTS 與 npm

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：專案固定 Node.js 24 LTS（本機 24.18.1）、npm 11（本機 11.16.0），提交 `package-lock.json`。
- macOS：以 Homebrew keg-only `node@24` 使用，不覆寫全域 Node.js 26 連結。
- 理由：主規格要求本機、CI 與文件使用一致且仍受支援的 LTS major。

## DEC-0003｜測試工具

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：ESLint 10.8.0、Node.js `node:test`、自有 Node 靜態伺服器，
  以及 Phase 1 的 Playwright 1.62.0。
- 理由：Phase 0 可在無執行期相依的情況驗證文件、相對路徑及 Pages 子路徑。
- Phase 1：本機指定實際 Chrome，CI 定義使用 Playwright Chromium；兩者
  不得冒充 Safari 或 iPadOS 實機。

## DEC-0004｜不追蹤未來 Phase 的空檔案

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：建立規格指定目錄，但不以 `.gitkeep` 或空白模組預建 Phase 1 以後功能。
- 理由：Git 不追蹤空目錄，且主規格禁止預先建立下一 Phase 程式碼或測試。

## DEC-0005｜Phase 0 遠端邊界

- 日期：2026-07-30。
- 狀態：accepted。
- 使用者授權建立公開 `kisaraki/classroom-sgts-nh-tzk`。
- Phase 0 不 push、不建立 Pages 設定、不部署。
- GitHub Actions 因 workflow 尚屬 Phase 1 且未 push，標記為未執行。

## DEC-0006｜固定時間步進與分頁可見性

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：每個完整步進固定為 10 模擬分鐘；倍速只縮短累積到下一步所需的
  真實時間，不改變步長。
- 安全界線：真實 delta 上限 250 ms、單畫格最多 8 步；隱藏分頁清空累積器，
  update/render 停止，切回第一幀 delta 歸零。
- 理由：維持不同 FPS 的決定性，並避免背景分頁造成大量補算。

## DEC-0007｜Canvas 與響應式介面

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：Canvas backing store 依 CSS 尺寸與 DPR 建立，DPR 上限 2；桌面採
  控制／視窗／診斷三區，低於 1100 px 改為上下堆疊，低於 600 px 顯示提示。
- 理由：兼顧清晰度、效能、平板可用性及 44 px 觸控目標。

## DEC-0008｜Phase 1 測試 workflow 與遠端邊界

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：`.github/workflows/test.yml` 使用唯讀 contents 權限、Node 24、
  `npm ci`、Playwright Chromium 及 `npm run check`。
- 遠端狀態：workflow 只完成本機定義與測試；因未獲 push 授權，
  GitHub Actions 為未執行，Pages 仍未設定及未部署。

## DEC-0009｜Natural Earth 衍生教育地圖

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：以 Natural Earth 1:50m physical coastline 為視覺參考，人工重繪成
  低頂點 Polygon，來源、Public Domain 授權、方法、日期及限制直接寫入 JSON。
- 驗證：Phase 2 採等效的明確 `validateMapData` 契約，固定必要欄位、
  bounds、ring、版本及 URL，拒絕未知欄位與不支援版本；負面測試隨資料提交。
- 理由：地圖資料可與渲染程式分離、可自動驗證，也不引入遠端執行依賴。
- 限制：只供教育模擬與簡化海陸判定，不具測繪、行政邊界或導航精度。

## DEC-0010｜座標顯示與測地計算分離

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：Canvas 採 bounds 內線性 equirectangular 轉換；實際距離、
  方位角與目的地計算採球面公式。
- 邊界：polygon exterior ring 順時針，邊及頂點視為陸地；所有穩定識別
  使用 `regionId`，經度只使用 `lon`。
- 互動：pointer 以 CSS rect 轉換，DPR 只影響 backing store，避免 resize
  或高 DPI 造成點選偏移。

## DEC-0011｜Phase 2 地理與測站範圍

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：Phase 2 只保存六站位置、來源與靜態教育係數，不建立觀測風雨值。
- 理由：測站物理觀測屬 Phase 5；提前寫死數值會破壞模型邊界。

## DEC-0012｜版本化 PRNG 與物理／視覺隔離

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：固定 `mulberry32-v1`，以主種子衍生 `intensity`、`steering`、
  `environment`、`visual` 四子流；物理 fingerprint 不含 `visual`。
- 理由：粒子數、顯示開關與畫格數不可改變物理結果；同模型版本、種子與
  操作序列需可重現。
- 限制：FNV-1a fingerprint 只供重現識別，不具密碼學安全性。

## DEC-0013｜教育型強度潛勢與時間反應

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：各環境因子先轉成 0～1，再相乘為發展潛勢；風速朝目標強度以
  小時尺度漸近，並限制單一步進增減。氣壓及暴風半徑使用有界遊戲化映射。
- 科氏邊界：科氏項只代表低緯度不利於渦旋組織，不作直接風速加成。
- 理由：維持單調、可解釋與可測試的教學行為，同時避免將簡化公式冒充預報。

## DEC-0014｜結構狀態遲滯

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：`cluster`、`spiral`、`comma`、`eye`、`decaying` 使用不同進入與
  離開門檻；渲染器只讀狀態，不參與狀態判斷。
- 理由：避免組織度或對稱度在臨界值附近造成每步來回切換。

## DEC-0015｜1° 網格與雙線性取樣

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：完整 bounds 使用含端點的 41×61＝2,501 cells；中心位置以四角
  雙線性取樣，不把颱風吸附到整數格點。
- 理由：同時滿足可視化、固定資料契約及連續移動。
- 限制：Phase 4 的陸地高度只是 120 m 通用 placeholder，不能代表精細地形。

## DEC-0016｜目標控制與實際環境分離

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：六個 UI 滑桿只更新 `targetControls`；實際值依各自 τ 使用指數反應。
- 理由：玩家操作不得瞬間改變方向，UI 也不得直接寫入 Typhoon 座標。

## DEC-0017｜導引向量與路徑分段

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：U 向東、V 向北；背景、副高、季風、β 漂移及 steering 子流擾動
  合成後再做 3 小時向量反應、45 km/h 上限與球面位移。單段最多 3 km。
- 理由：維持方向／速度平滑與決定性，並保留狹窄島嶼交會偵測。
- Phase 邊界：Phase 4 只回報穿越 region；事件與分段物理於 Phase 5 實作。

## DEC-0018｜解析式臺灣地形與路徑時間積分

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：先以地圖 polygon 判定海陸，再以解析式山脊把臺灣分成西部平原、
  中央山脈、東部縱谷及海岸山脈；移動路徑每 0.5 km 取樣，依陸地距離
  比例積分 10 分鐘內的摩擦、地形及結構損耗。
- 理由：避免只以步進終點判定整步海陸，也能在不加入大型 DEM 的前提下
  呈現臺灣迎風／背風概念。
- 限制：分區及高度是教育近似，不是測繪或預報級地形。

## DEC-0019｜網格冷水尾流與恢復

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：冷水尾流保存於既有 1° `GridCell`，作用半徑至少 70 km 並隨
  暴風半徑增加；冷卻依風速平方、移速及 OHC 改變，上限 5°C，以
  240 小時遊戲時間常數恢復。
- 理由：尾流必須具有面積、停留時間與跨步記憶，不能只改中心 SST。
- 限制：240 小時及所有係數是明確記錄的遊戲參數，不代表通用海洋值。

## DEC-0020｜模型衍生測站風雨

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：六站只保留來源可追溯的位置與靜態 exposure；持續風、陣風、
  雨率及累積雨量每 10 分鐘由颱風、環境、距離與地形即時計算。
- 理由：禁止寫死觀測答案，並確保累積雨量只依模擬時間、不依 FPS。

## DEC-0021｜重建 session 的完整重啟

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：「重啟」重建 EventBus、Environment、Typhoon、所有 Phase 5
  模型及 renderer session，而不是逐一遺漏式清欄位。
- 理由：確保時鐘、事件 dedupe、網格尾流、測站累積量、路徑及視覺狀態
  一次回到模型初始條件。

## DEC-0022｜白名單資料規則與等效 Level schema

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：Phase 6 使用嚴格 `validateLevel` 等效 schema；目標與失敗只允許
  固定 metric、operator、aggregation 及 resolver table。
- 安全界線：未知欄位／metric 拒絕，不使用 `eval`、`Function`、動態
  import 或任意字串屬性路徑。
- 理由：關卡可資料驅動與重用，同時不讓內容資料變成程式執行入口。

## DEC-0023｜失敗優先、單次結算與黃金重播

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：同一步先更新全部正式模型，再評估目標與失敗；若兩者同時成立，
  失敗優先。終端後立即暫停 fixed-step catch-up，結果與 dialog 只建立一次。
- 黃金基準：固定版本、seed、初始環境、合法 UI 步進操作、完成事件、
  fingerprint、分數及容差都寫入 fixture。
- 理由：避免同一步出現 VICTORY／FAILURE 雙重終端，也讓模型與 UI
  迴歸有可稽核基準。

## DEC-0024｜中國大陸穩定 region ID 與琉球參考區

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：將原有東南中國簡化 polygon 的穩定 ID 統一為
  `china-mainland`；琉球成功區使用 `ryukyu-` region prefix 或那霸
  150 km reference zone。
- 理由：失敗規則必須使用穩定識別而非顯示名稱，且不能依單一低精度
  polygon 判斷玩家是否已抵達琉球。

## DEC-0025｜警戒區連續狀態與去抖動

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：警戒區採 `OUTSIDE`、`ENTERING`、`INSIDE`、`EXITING` 狀態；
  圈外 36 步、圈內 18 步、再次圈外 36 步均須連續成立。
- 理由：短暫擦邊或邊界抖動不得冒充多次有效進圈。

## DEC-0026｜共用模型的資料驅動關卡校準

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：三關共用一套模擬與 evaluator。關卡可驗證地明示海洋冷卻倍率
  及非季風南北導引倍率；季風 V 分量不受後者縮放。
- 理由：讓長時段三進情境可重現，同時避免複製模型或硬編碼歷史路徑。
- 限制：倍率是教育遊戲校準，必須隨模型版本與黃金 fixture 追蹤。

## DEC-0027｜沙盒沿用正式物理 session

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：沙盒以受驗證 preset 建立通用 Level adapter，沿用全部正式模型，
  但略過 Objective／Failure 終端判定。
- 理由：自由實驗不得複製第二套物理或意外立即勝利。

## DEC-0028｜localStorage v1 與安全回復

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：只儲存進度、顯示設定與最後沙盒 preset；exact-field schema 驗證，
  損壞資料移除後回預設，另保留明確 migration 入口。
- 隱私：不保存敏感個資、帳號、真實位置或裝置識別。

## DEC-0029｜資料重播優先於狀態注入

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：模擬 JSON 保存 seed 與 step 操作；匯入後重新跑正式模型，不把
  外部 JSON 直接指定為內部 Typhoon／Environment 可變狀態。
- 安全：限制 1 MB、深度 12、陣列 5,000，拒絕未知與原型污染欄位；
  CSV 文字避免公式注入，PNG 加品牌與 Not for Forecasting。

## DEC-0030｜bounded 效能診斷不進入物理

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：最近 600 畫格記錄 FPS、update／render duration，並用
  `PerformanceObserver` 計數 Long Task；昂貴百分位摘要每 30 次 snapshot
  更新。開始模擬時重設量測窗。
- 理由：提供可重現的效能證據，同時避免診斷本身每幀排序或改變物理。

## DEC-0031｜固定地圖雙層快取

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：`loadGeography` 共享已驗證資料 Promise；`MapRenderer` 依地圖
  identity 與 viewport 尺寸快取固定離屏 Canvas。
- 理由：避免重複 fetch／parse GeoJSON，亦避免每畫格重畫固定 polygon、
  臺灣地形與海岸；動態圖層仍保持即時。

## DEC-0032｜粒子層級與 reduced motion

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：低／中／高固定為 300／700／1200，預設中；切換時由同一視覺
  seed 重建，不保存進物理。reduced motion 生效時暫停粒子但保留使用者
  原偏好且不停止模擬。
- 理由：畫質可依裝置調整，而 fingerprint 與關卡結果完全不變。

## DEC-0033｜Pages allowlist artifact 與最小權限 workflow

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：`dist/` 只允許 `index.html`、`css`、`js`、`assets`、`LICENSE`；
  test → build → deploy 為相依 job，deploy job 才取得 Pages／OIDC 寫權限。
- Actions：2026-07-30 以 GitHub API 對照官方最新 release，採
  checkout/setup-node v7、configure-pages v6、upload/deploy-pages v5。
- 理由：測試失敗不能發布，並把來源、開發依賴、Secrets 與測試排除。

## DEC-0034｜跨瀏覽器證據不得代換

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：實際 Chrome 與 macOS Safari 分別驗證；Edge 未安裝與 iPadOS
  無實機時維持 `not_verified`，不以 Chromium 或縮放桌面冒充。
- 理由：第 24 節是正式完成必要條件，缺少實機證據必須阻止假完成。

## DEC-0035｜跨架構 fingerprint 浮點正規化

- 日期：2026-07-30。
- 狀態：accepted。
- 決策：fingerprint 序列化時才將有限非整數正規化至小數點後 8 位，
  並將負零正規化為零；整數、物理狀態及匯出數值不變。
- 理由：ARM64 macOS 與 x64 Linux 的三角函數可能產生低位差異；8 位
  小數仍比 golden replay 的跨瀏覽器絕對容差 `1e-6` 更嚴格，可排除
  平台雜訊而保留具意義的模擬差異。

## DEC-0036｜玩家介面、官方用語與擬真地圖邊界

- 日期：2026-08-06。
- 狀態：accepted。
- 決策：玩家介面統一採中華民國教育部與交通部中央氣象署慣用的繁體中文
  完整用語；桌面及橫向小螢幕採左側戰況資訊、右側策略操作，主要遊戲指令
  位於右下方。資料匯入匯出保留為後台能力，不在玩家介面顯示。
- 地圖：沿用已授權的既有地理資料，以 Canvas 海洋層次、陸地明暗、地形
  紋理、海岸線及臺灣山脈脊線提升擬真感，不引入未授權影像或外部服務。
- 邊界：只修正呈現、資訊架構與前後台分工，不改變物理狀態、固定步進、
  關卡判定、可重現性或正式資料契約。

## DEC-0037｜上方全幅地圖與下方雙象限

- 日期：2026-08-06。
- 狀態：accepted。
- 決策：主規格提升至 1.0.3；主 Canvas 擬真地圖橫跨上方第一、二象限，
  戰況資訊位於第三象限，參數輸入與玩家操作位於第四象限，緊湊即時指令
  保留於第四象限下緣。
- 空間：下方兩面板等高，各自處理長內容捲動，避免參數面板下方形成無功能
  空白；窄螢幕才依地圖、資訊、操作順序改為單欄。
- 邊界：只改資訊架構與 CSS 幾何，不改 DOM 控制意圖、物理模型、關卡判定、
  地圖資料、可重現性或前後台功能邊界。
