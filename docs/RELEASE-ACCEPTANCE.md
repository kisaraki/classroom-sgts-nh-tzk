# SGTS-NH 第一版發布驗收
## 主規格第 24 節逐項稽核

> **KOSMOS TOOLKIT｜探真拓知酷**

稽核日期：2026-08-06。狀態：**Phase 9 in progress，第一版尚未正式完成**。

| # | 驗收條件 | 狀態 | 證據／阻擋 |
|---:|---|---|---|
| 1 | repository 名稱正確 | passed | config、remote、唯讀 GitHub 查詢 |
| 2 | owner 為 `kisaraki` | passed | config、`gh auth status`、repository 查詢 |
| 3 | 指定 Pages URL 可開啟 | passed | deployment `5677601892`、HTTP 200、公開 Chrome smoke |
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
| 24 | Chrome、Edge、macOS Safari、iPadOS Safari | **blocked** | Chrome／macOS Safari passed；Edge／iPadOS not_verified |
| 25 | Console 無持續錯誤 | passed | 1.0.5 本機實際 Chrome E2E；既有 Safari／公開 Chrome 證據另行保留 |
| 26 | 非預報聲明可見 | passed | foundation／Browser／Safari AX |
| 27 | 所有必要測試通過 | **blocked** | 1.0.5 本機功能回歸 passed；效能 update p95 未達門檻，Edge／iPadOS 尚缺 |
| 28 | 所有 Phase 有使用者批准紀錄 | **blocked** | Phase 0～8 已批准；Phase 9 發布結果尚未批准 |
| 29 | 未批准不得自動進下一 Phase | passed | Phase status／governance |
| 30 | 必要項目失敗不得宣稱完成 | passed | 本文件與狀態明列 blocked |
| 31 | 本機、Actions、Pages、公開站分開 | passed | TESTING／DEPLOYMENT／PHASE-STATUS |
| 32 | 匯出含版本、PRNG、可追蹤 build | passed | I/O tests；artifact 注入 source commit |
| 33 | 三關正式模型黃金重播 | passed | 三份版本化 fixtures |
| 34 | Requirement ID 可追蹤 | passed | TESTING 含查詢退場、六站卡、鏡頭、視角隔離、無障礙與 artifact 新 ID |
| 35 | artifact 無測試、設定、Secrets、依賴 | passed | build allowlist／artifact test；新鏡頭／測站模組存在且查詢 DOM 不存在 |

## 目前正式阻擋

1. Microsoft Edge 依使用者指示暫不安裝，維持 `not_verified`。
2. iPadOS 依使用者指示暫不測試，維持 `not_verified`。
3. 主規格 1.0.5 本機效能量測的中畫質 update p95 為 6.1 ms，高於
   `<4 ms` 門檻；FPS、1% low 與 Long Task 雖通過，仍不得掩蓋此失敗。
4. 本次 1.0.5 差異尚未 commit／push／部署，GitHub Actions、Pages API 與公開網站
   狀態分別為 `not_run`、`not_run`、`not_verified`。
5. 因此 Phase 9 仍不得在缺少第 24 項證據、效能門檻與本次發布證據時標記正式完成。

最新既有已發布基線為 source commit
`73e5a3676db1787b9ff4147cd05f8b34a18759b1`、Actions run `31080240842`、
deployment `5775272960`；它們不包含本次 1.0.5 差異。解除阻擋仍需補齊
Edge／iPadOS、效能門檻、本次遠端發布與最終 Phase 9 使用者批准。
