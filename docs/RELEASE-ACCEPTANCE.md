# SGTS-NH 第一版發布驗收
## 主規格第 24 節逐項稽核

> **KOSMOS TOOLKIT｜探真拓知酷**

稽核日期：2026-07-30。狀態：**Phase 9 in progress，第一版尚未正式完成**。

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
| 13 | 不能直接拖動颱風 | passed | UI／event contract、E2E |
| 14 | 科氏不直接加風速 | passed | physics docs、intensity tests |
| 15 | 登陸事件不重複 | passed | land unit／scenario |
| 16 | 中央山脈作用可觀察 | passed | unit／scenario／Mountain Shield fixture |
| 17 | 冷水尾流形成與恢復 | passed | ocean unit／scenario／E2E |
| 18 | 雨量依固定時間積分 | passed | rainfall／observation tests |
| 19 | 測站值由模型產生 | passed | observation／pipeline tests |
| 20 | 韋恩是三次進入警戒區 | passed | level schema／Wayne fixture |
| 21 | localStorage 損壞安全回復 | passed | storage unit／Chrome／Safari |
| 22 | 匯入資料先驗證 | passed | I/O negative unit／Chrome E2E |
| 23 | CSV、JSON、PNG、摘要可用 | passed | unit／Chrome；Safari 摘要下載 |
| 24 | Chrome、Edge、macOS Safari、iPadOS Safari | **blocked** | Chrome／macOS Safari passed；Edge／iPadOS not_verified |
| 25 | Console 無持續錯誤 | passed | 本機 E2E／Browser、Safari、公開 Chrome smoke |
| 26 | 非預報聲明可見 | passed | foundation／Browser／Safari AX |
| 27 | 所有必要測試通過 | **blocked** | 本機與 Actions passed；Edge／iPadOS 尚缺 |
| 28 | 所有 Phase 有使用者批准紀錄 | **blocked** | Phase 0～8 已批准；Phase 9 發布結果尚未批准 |
| 29 | 未批准不得自動進下一 Phase | passed | Phase status／governance |
| 30 | 必要項目失敗不得宣稱完成 | passed | 本文件與狀態明列 blocked |
| 31 | 本機、Actions、Pages、公開站分開 | passed | TESTING／DEPLOYMENT／PHASE-STATUS |
| 32 | 匯出含版本、PRNG、可追蹤 build | passed | I/O tests；artifact 注入 source commit |
| 33 | 三關正式模型黃金重播 | passed | 三份版本化 fixtures |
| 34 | Requirement ID 可追蹤 | passed | TESTING 各 Phase trace tables |
| 35 | artifact 無測試、設定、Secrets、依賴 | passed | build allowlist／artifact test／Pages artifact |

## 目前正式阻擋

1. Microsoft Edge 依使用者指示暫不安裝，維持 `not_verified`。
2. iPadOS 依使用者指示暫不測試，維持 `not_verified`。
3. 因此 Phase 9 仍不得在缺少第 24 項證據時標記正式完成。

已發布 source commit `03e1f12`；Actions run `30556910585`、deployment
`5677601892` 與正式 URL 均已驗證。解除阻擋後只需補齊 Edge／iPadOS
證據，才能把本表所有必要項目改為 passed。
