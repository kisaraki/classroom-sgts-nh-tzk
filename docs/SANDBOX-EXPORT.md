# SGTS-NH 沙盒、儲存與匯入匯出
## Phase 8 後台資料契約、安全界線與重現性

> **KOSMOS TOOLKIT｜探真拓知酷**

## 沙盒

沙盒沿用關卡的 Environment、Steering、Land、Ocean、Intensity、
Observation 與固定 10 分鐘更新管線，但不評估目標或失敗，也不建立
勝利／失敗結果。

可設定欄位：

- 名稱、生成緯度／經度、初始風速、中心氣壓、組織度、對稱度與風暴水氣。
- 海面溫度、海洋熱含量、太平洋副熱帶高壓強度／西界／脊線、垂直風切、
  西南季風與季風水氣。
- 地形作用倍率 0～2 及 1～128 字元種子。

海面溫度與海洋熱含量是環境網格背景值；地形倍率只縮放地形嚴重度，不跳過海陸
事件。相同版本、preset、種子與依 step 排序的操作紀錄會產生相同
fingerprint。沙盒可暫停、倍速、重啟及切換環境、軌跡、目標與粒子圖層。

## 玩家介面邊界

資料匯入匯出是後台維護、測試與教育重現能力。`SimulationIO` 及其嚴格
驗證、重播與輸出函式仍保留並受自動化測試涵蓋，但玩家介面不得顯示檔案
選擇、JSON 匯入、CSV／JSON／PNG／文字摘要輸出按鈕或相關技術格式。
玩家只接觸關卡、沙盒環境控制、地圖、戰況情報與遊戲指令。

## localStorage v1

固定 key 為 `sgts-nh:progress`，資料形狀：

```json
{
  "version": 1,
  "unlockedLevels": [],
  "bestScores": {},
  "settings": {},
  "lastSandboxPreset": {},
  "tutorialCompleted": false
}
```

正式儲存時 `settings` 與 `lastSandboxPreset` 必須是完整、嚴格驗證的物件。
未知欄位、錯誤型別、超出範圍或不支援版本均拒絕；損壞 JSON 會移除並
安全回到預設值。`migrateStorageRecord` 是版本遷移入口，目前只接受 v1。
資料只含遊戲進度、顯示偏好與模型設定，不儲存姓名、電子郵件、位置歷史、
裝置識別或其他敏感個資。

## 匯出格式

模擬 JSON 及沙盒 preset JSON 都包含：

- `schemaVersion`
- `modelVersion`
- PRNG `mulberry32-v1`
- `buildCommit`
- `exportedAt`

模擬 JSON 另含模式、Level ID、種子、環境 target、操作紀錄、步數、
模擬時間、fingerprint、颱風、軌跡與簡化測站觀測。匯入後會依種子與
step 操作重新執行正式模型，不直接把外部物件寫入執行期模型。

軌跡 CSV 欄位固定為：

```text
name, stepIndex, simulationMinutes, lat, lon,
maxWindMps, centralPressureHpa
```

所有 CSV cell 都加雙引號；以 `=`、`+`、`-`、`@`、tab 或 CR 開頭的
文字先加單引號，避免試算表公式注入。

PNG 先複製目前已繪出的 Canvas，因此包含地圖、軌跡及目前颱風，再加上
名稱、模擬時間、品牌 `KOSMOS TOOLKIT｜探真拓知酷` 與
`Not for Forecasting`。摘要文字同樣包含版本與 build commit。

## 匯入安全

- 最大 1 MB、最大巢狀深度 12、每個主要陣列最多 5,000 筆。
- 嚴格驗證版本、必要欄位、型別、數值範圍、陣列長度及 enum。
- 拒絕未知欄位及 `__proto__`、`prototype`、`constructor`。
- 不使用 `eval`、`Function`、任意 HTML、動態 import 或外部程式碼。
- 錯誤只顯示可讀訊息，不讓 Engine 進入 ERROR，也不修改既有 session。

## 已知限制

- localStorage 不是跨裝置帳號同步或長期備份。
- JSON 匯入只支援目前 schema、模型與 PRNG 版本。
- 匯出為教育重現與檢視用途，不是官方氣象交換格式或預報產品。
