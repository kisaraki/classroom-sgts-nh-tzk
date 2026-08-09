# SGTS-NH v1.0.0 發布說明
## 西北太平洋篇正式結案版

> **KOSMOS TOOLKIT｜探真拓知酷**

- 發布日期：2026-08-09
- 正式網站：<https://kisaraki.github.io/classroom-sgts-nh-tzk/>
- Repository：<https://github.com/kisaraki/classroom-sgts-nh-tzk>
- 版本標籤：`v1.0.0`

## 第一版內容

- 三個資料驅動關卡：「那霸風雨」、「護國神山」、「韋恩三進」，以及
  無勝敗沙盒。
- 可重現的固定步進颱風模型、環境導引、地形、冷水尾流、雨量、六站模型
  觀測與三份黃金重播。
- 上方全幅擬真地圖、Natural Earth II 地形貼圖、隨生命史變化的颱風尺寸、
  北半球逆時針旋轉呈現。
- 地圖內六站有色毛玻璃資訊卡，以及滑鼠、觸控、按鈕與鍵盤的地圖視角操作。
- 玩家介面不顯示資料匯入匯出；後台保留經驗證的 JSON、CSV、PNG 與摘要能力。
- 純靜態 GitHub Pages 架構，不需要 Node.js 後端、登入、資料庫或秘密金鑰。

## 驗證證據

- 本機：lint、build、127 單元測試、6 整合測試、16 情境／黃金重播、
  19 項實際 Google Chrome 端對端測試、1 項 Pages 成品測試通過。
- GitHub Actions：run `31287524683` 的 test、build、deploy 全部成功。
- GitHub Pages：正式根頁、`MapCamera.js` 與真實地形 WebP 均驗證為
  HTTPS HTTP 200。

## 已知例外

- 中畫質 update p95 為 6.1 毫秒，高於主規格 `<4 ms`，維持 `failed`。
- Microsoft Edge 未安裝，維持 `not_verified`。
- iPadOS Safari 無實體裝置證據，維持 `not_verified`。

使用者已在上述例外完整揭露後，明確指示本案截至目前正式結案。這項批准
不代表未執行的驗證已通過；後續如改善效能或補做相容性驗證，應另開維護工作。

> 本系統只供科學教育與遊戲化模擬，不適用於真實天氣預報、防災決策、
> 航海、航空或任何安全關鍵用途。
