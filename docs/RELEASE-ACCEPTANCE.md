# SGTS-NH 第一版發布驗收
## 主規格第 24 節逐項稽核

> **KOSMOS TOOLKIT｜探真拓知酷**

稽核日期：2026-08-09。狀態：**Phase 9 approved；使用者接受已知例外後正式結案**。

`accepted_exception` 是專案所有者在完整知悉原始證據後所作的治理風險接受，
不是測試通過狀態；相關 `failed`／`not_verified` 結果仍保持有效。

| # | 驗收條件 | 狀態 | 證據／阻擋 |
|---:|---|---|---|
| 1 | repository 名稱正確 | passed | config、remote、唯讀 GitHub 查詢 |
| 2 | owner 為 `kisaraki` | passed | config、`gh auth status`、repository 查詢 |
| 3 | 指定 Pages URL 可開啟 | passed | Actions run `31287524683`、HTTPS HTTP 200、公開資產驗證 |
| 4 | 品牌固定 | passed | foundation test、HTML／docs |
| 5 | 首頁、頁尾、README、主要文件有品牌 | passed | HTML／文件檢查 |
| 6 | 三關可開始、勝利、失敗、重啟 | passed | unit／scenario／Chrome 黃金 E2E |
| 7 | 沙盒可用 | passed | unit／integration／Chrome E2E |
| 8 | 固定步進不依賴 FPS | passed | 60／120 Hz unit／scenario |
| 9 | 暫停完全停止物理 | passed | clock／engine／Chrome E2E |
| 10 | 倍速不改單步公式 | passed | clock unit／integration |
| 11 | 相同種子與操作可重現 | passed | 三份 fixtures、replay integration |
| 12 | 路徑由環境導引 | passed | steering unit／scenario |
| 13 | 不能直接拖動颱風 | passed | UI／event contract、E2E；地圖拖曳只改變鏡頭，step／fingerprint 不變 |
| 14 | 科氏不直接加風速 | passed | physics docs、intensity tests |
| 15 | 登陸事件不重複 | passed | land unit／scenario |
| 16 | 中央山脈作用可觀察 | passed | unit／scenario／Mountain Shield fixture |
| 17 | 冷水尾流形成與恢復 | passed | ocean unit／scenario／E2E |
| 18 | 雨量依固定時間積分 | passed | rainfall／observation tests |
| 19 | 測站值由模型產生 | passed | observation／pipeline／StationMapOverlay unit／Chrome E2E |
| 20 | 韋恩是三次進入警戒區 | passed | level schema／Wayne fixture |
| 21 | localStorage 損壞安全回復 | passed | storage unit／Chrome／Safari |
| 22 | 後台匯入資料先驗證 | passed | I/O negative unit；玩家介面不顯示匯入控制 |
| 23 | 後台 CSV、JSON、PNG、摘要可用 | passed | I/O unit／integration；主規格 1.0.5 延續不在玩家介面顯示的規定 |
| 24 | Chrome、Edge、macOS Safari、iPadOS Safari | **accepted_exception** | Chrome／macOS Safari passed；Edge／iPadOS not_verified，由使用者知情接受 |
| 25 | Console 無持續錯誤 | passed | 1.0.5 本機實際 Chrome E2E；既有 Safari／公開 Chrome 證據另行保留 |
| 26 | 非預報聲明可見 | passed | foundation／Browser／Safari AX |
| 27 | 所有必要測試通過 | **accepted_exception** | 功能回歸 passed；效能 update p95 failed、Edge／iPadOS 尚缺，由使用者知情接受 |
| 28 | 所有 Phase 有使用者批准紀錄 | passed | Phase 0～8 已批准；Phase 9 於 2026-08-09 獲正式結案批准 |
| 29 | 未批准不得自動進下一 Phase | passed | Phase status／governance |
| 30 | 必要項目失敗不得宣稱完成 | **accepted_exception** | 依主規格 1.0.6 的所有者例外正式結案；failed／not_verified 原狀保留 |
| 31 | 本機、Actions、Pages、公開站分開 | passed | TESTING／DEPLOYMENT／PHASE-STATUS |
| 32 | 匯出含版本、PRNG、可追蹤 build | passed | I/O tests；artifact 注入 source commit |
| 33 | 三關正式模型黃金重播 | passed | 三份版本化 fixtures |
| 34 | Requirement ID 可追蹤 | passed | TESTING 含查詢退場、六站卡、鏡頭、視角隔離、無障礙與 artifact 新 ID |
| 35 | artifact 無測試、設定、Secrets、依賴 | passed | build allowlist／artifact test；新鏡頭／測站模組存在且查詢 DOM 不存在 |

## 正式結案時的已知例外

1. Microsoft Edge 依使用者指示暫不安裝，維持 `not_verified`。
2. iPadOS 依使用者指示暫不測試，維持 `not_verified`。
3. 主規格 1.0.5 本機效能量測的中畫質 update p95 為 6.1 ms，高於
   `<4 ms` 門檻；FPS、1% low 與 Long Task 雖通過，仍不得掩蓋此失敗。
4. 本次 1.0.5 差異已由 `d1ea886` 提交並推送；GitHub Actions run `31287364008`
   的 test、build、deploy 皆成功，Pages workflow／HTTPS 與公開根頁、新鏡頭模組、
   真實地形資產均已驗證 HTTP 200。
5. 使用者已在上述結果完整揭露後明確指示「截至目前正式結案」；因此
   Phase 9 依所有者決定標記 `approved`，但第 24、27 項不得改寫為 passed。

最新 1.0.5 功能發布 source commit 為 `d1ea886aeeaef4ed3ff19e2d33b52d75e78015fe`，
結案前最終 Pages source 為 `8ecd40b4923ed592d817277e3436f8f378578f01`，
Actions run 為 `31287524683`。第一版以 `v1.0.0` 結案；未來如補測或改善
效能，應另開維護工作，不得回寫本次歷史證據。
