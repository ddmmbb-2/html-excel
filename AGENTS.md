# html-excel 開發指引

html-excel 以 Univer Sheets Core 1.5.2 提供試算表模型、格線、公式編輯和計算。起始流程是解壓縮後直接開啟 `index.html`。本機發佈版需能在離線的 `file://` 頁面使用。

## 檔案分工

| 檔案 | 職責 |
| --- | --- |
| `index.html` | 編輯器外框、本機檔案按鈕和自訂函式對話框 |
| `src/main.js` | 初始化 Univer、透過 Facade 管理目前的工作簿、連接 UI |
| `src/workbook.js` | 本機 JSON 契約、v1 遷移、下載和範例 |
| `src/functions.js` | 自訂函式定義驗證及轉為 Univer 的命名 LAMBDA |
| `custom-functions.js` | 可由使用者替換的共用函式檔案 |
| `src/style.css` | html-excel 自有界面的樣式 |
| `build.mjs` | 建置固定相依版本的離線 IIFE、CSS 及第三方授權清單 |

## 活頁簿契約

唯一的活頁簿副檔名是 `.htmlsheet.json`。新版根物件包含 `formatVersion: 2`、`workbook` 和 `customFunctions`。`workbook` 以 Univer `IWorkbookData` 快照保存，使用 `FWorkbook.save()` 取得編輯後的狀態。請用 Facade 修改開啟中的活頁簿。

版本 1 讀入時，將各分頁的 A1 座標映射到 Univer 的列、欄索引，保留分頁 ID、順序和公式。以 `CellValueType.FORCE_STRING` 匯入舊版文字，包括有前導零的代碼。首次儲存為版本 2。新增格式欄位時，先以讀舊檔與重開新檔的流程驗證。

## 擴充函式

1. 確認需求是否在目前版本的 Univer 內建函式中。
2. 能以試算表算式表示的自訂函式，放在頁面「自訂函式」，或以 `{name, params, expression}` 加入 `custom-functions.js`。
3. app 用 Univer 的定義名稱註冊 `=LAMBDA(...)`，公式由 Univer 求值。活頁簿保存定義資料及快照的命名資源。開啟時，活頁簿內同名定義優先於共用檔。

交給 LLM 的工作描述可使用下列文字。

> 請在 html-excel 增加【函式或公式範本】，語法是【參數】，範例為【公式與預期結果】。確認目前的 Univer 版本是否已支援該函式。能使用 LAMBDA 時用既有定義契約，其他演算法請用 Univer 的公式擴充 API，附上正常值、空白或錯誤值及存檔重開的驗證案例。

## 驗收

- 解壓縮新版後離線開啟 `index.html`。
- 以格線輸入兩個數字，測試直接相加和 SUM。用範例活頁簿核對 XLOOKUP、HLOOKUP 及 SORT 展開。
- 試算、保存並重開自訂函式，確認公式能重新計算。
- 從選取範圍右下角實際拖曳，驗證公式的相對／絕對參照、固定值、數值數列和日期數列。
- 用舊版 JSON 重測空白、數字、文字型別、分頁順序與跨分頁引用。
