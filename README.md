# html-excel v0.4

可離線開啟的繁體中文試算表，內建 Univer Sheets Core 1.5.2。

👉 **線上體驗與完整包下載**：[https://office.ddmmbb.org/](https://office.ddmmbb.org/)

## 使用方式

### 方式一：線上直接體驗（或下載完整套件）

前往 **[HTML Office 網站](https://office.ddmmbb.org/)** 可直接在瀏覽器中線上體驗試算表，或一次下載包含五款工具的完整離線包（`html-office.zip`）。

> **提示**：線上體驗存檔時僅會匯出 `.htmlsheet.json`。若日後需要於本機重新開啟與編輯，請下載完整壓縮包（含必要 JS/CSS 檔案）後解壓縮使用。

### 方式二：本機解壓縮使用

1. 將整個 ZIP 解壓縮。
2. 用瀏覽器開啟 `index.html`。請保留旁邊的 `assets/` 和 `custom-functions.js`。
3. 用上方的「開啟」與「儲存活頁簿」讀寫 `.htmlsheet.json`。在「⋯ → 開啟範例活頁簿」可以試算跨分頁 `XLOOKUP`、`HLOOKUP`、`SORT` 和自訂折扣公式。

公式輸入、選取範圍、試算表分頁和複製貼上使用 Univer Sheets Core 的介面。直接輸入 `=SUM(` 或 `=XLOOKUP(` 即可使用內建函式。可從 Excel 或 Google 試算表複製格子，再貼進格線。

## 拖曳填滿

選取有內容的儲存格或範圍，抓住選取框右下角的小方塊向下拖曳。

| 要填滿的內容 | 起始資料與操作 |
| --- | --- |
| 公式 | 選取 `=B2*$C$1` 往下拖，會依列調整 `B2`，`$C$1` 會固定。 |
| 固定數值或文字 | 選取一格再拖，例如 `7` 會複製到下方各格。 |
| 遞增數列 | 先輸入 `2`、`4`，選取兩格再拖，接著會填入 `6`、`8`。 |
| 日期 | 輸入 `2026/11/18` 再拖，會逐日增加。要每隔七天，先輸入相隔七天的兩個日期，再選取兩格拖曳。 |

## 活頁簿

一份 `.htmlsheet.json` 保存所有分頁、儲存格、格式和自訂函式。打開 v0.1 或 v0.2 的 JSON 會在記憶體中轉成 Univer 快照。「儲存活頁簿」會下載新版檔案，原始檔仍可留作備份。

## 自訂函式

在「自訂函式」填入名稱 `NET`、參數 `price, rate`、計算式 `ROUND(price*(1-rate),0)`。輸入測試參數 `100, 0.15` 並按「試算」，結果為 `85`。儲存定義後可以在格子裡輸入 `=NET(A2,B2)`。

要在其他活頁簿使用相同的一組定義，可以下載 `custom-functions.js`，替換 `index.html` 旁同名的檔案，再重新開啟編輯器。

## 修改原始碼

平常使用直接開啟 HTML。需要修改原始碼時，在專案目錄執行 `npm ci` 和 `npm run build`，重新產生 `assets/`。套件版本鎖在 `package-lock.json`。擴充方式見 [AGENTS.md](AGENTS.md)。相依套件授權見 [THIRD-PARTY.txt](assets/THIRD-PARTY.txt)。

## HTML Office 系列專案

HTML Office 將以下五個開源專案集結成單一資料夾，可於 [https://office.ddmmbb.org/](https://office.ddmmbb.org/) 線上體驗或一次下載離線使用：

- **[html-excel](https://github.com/ddmmbb-2/html-excel)**（本專案）— 試算表編輯器
- **[html-writer](https://github.com/ddmmbb-2/html-writer)** — 文件編輯器
- **[html-slidebook](https://github.com/ddmmbb-2/html-slidebook)** — 簡報編輯器
- **[html-image](https://github.com/ddmmbb-2/html-image)** — 圖片編輯器
- **[html-keep](https://github.com/ddmmbb-2/html-keep)** — 口袋筆記 / 備忘錄
