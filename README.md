# HTML Excel

**不用安裝 Excel，下載一個 HTML 檔案，就能用瀏覽器離線編輯試算表。**

HTML Excel 延續 HTML Office 系列的單檔設計理念，將試算表編輯器、Univer Sheets Core 1.5.2、公式運算引擎、介面樣式與自訂函式整合進同一個 HTML 檔案。

不需要安裝 Office、Node.js 或架設伺服器。將 HTML 放進隨身碟，帶到另一台電腦，就可以繼續使用。

👉 **[線上體驗與 HTML Office 完整套件下載](https://office.ddmmbb.org/)**

👉 **[下載單檔版 excel-single.html](https://raw.githubusercontent.com/ddmmbb-2/html-excel/main/excel-single.html)**（約 13.4 MB；若瀏覽器直接顯示內容，請另存為 .html 檔案）

## 使用方式

### 單檔離線版（推薦）

1. 下載 `excel-single.html`。
2. 使用桌面版 Chrome 或 Edge 雙擊開啟。
3. 建立試算表，或透過上方的「開啟」載入既有活頁簿。
4. 編輯完成後，點選「儲存活頁簿」下載 `.htmlsheet.json`。

單檔版已內建 JavaScript、CSS、自訂函式載入程式及第三方授權聲明，不必另外下載 assets 資料夾，也不需要連線至 CDN。

### 線上使用

前往 [HTML Office 網站](https://office.ddmmbb.org/) 即可體驗系列工具。試算表資料以 JSON 匯出，日後也可以使用離線版重新開啟。

### 原有多檔案版本

專案仍保留 `index.html`、`assets/` 和 `custom-functions.js`。若使用此版本，請保留原本的目錄結構，再以瀏覽器開啟 `index.html`。

## 主要功能

- 繁體中文試算表介面，使用 Univer Sheets Core。
- 多工作表、儲存格編輯、範圍選取與格式設定。
- 支援 SUM、XLOOKUP、HLOOKUP、SORT 等內建公式。
- 支援公式、數值及日期的拖曳自動填滿。
- 可從 Excel 或 Google 試算表複製儲存格並貼入格線。
- 自訂函式、公式試算及共用函式定義匯出。
- JSON 活頁簿儲存與重新開啟。
- 內建範例活頁簿，可由「⋯ → 開啟範例活頁簿」體驗跨分頁公式與自訂折扣公式。

## 拖曳填滿

選取有內容的儲存格或範圍，抓住選取框右下角的小方塊向下拖曳。

| 要填滿的內容 | 起始資料與操作 |
| --- | --- |
| 公式 | 選取 `=B2*$C$1` 往下拖，會依列調整 `B2`，`$C$1` 則保持固定。 |
| 固定數值或文字 | 選取一格再拖，例如 `7` 會複製到下方各格。 |
| 遞增數列 | 先輸入 `2`、`4`，選取兩格再拖，接著會填入 `6`、`8`。 |
| 日期 | 輸入 `2026/11/18` 再拖，會逐日增加。若要每隔七天，先輸入相隔七天的兩個日期，再選取兩格拖曳。 |

## 活頁簿與檔案格式

HTML 是可攜式編輯器，JSON 則是實際的試算表資料。

| 檔案 | 用途 |
| --- | --- |
| `excel-single.html` | 完整的單檔離線試算表編輯器。 |
| `*.htmlsheet.json` | 保存工作表、儲存格、格式及自訂函式。 |

一個 HTML 編輯器可以開啟多份不同的 JSON 活頁簿，不必為每一份試算表重新複製整個編輯器。

原有 v0.1、v0.2 的 JSON 活頁簿會在記憶體中轉換成 Univer 快照，儲存時會下載新版檔案，原始檔仍可保留作為備份。

> **注意：** 目前採用 HTML 編輯器與 JSON 活頁簿分離的設計，儲存活頁簿不會直接修改 HTML 本身。若要將編輯器與資料帶到另一台電腦，請一併攜帶 HTML 和 JSON。JSON 並非 Microsoft Excel 的 .xlsx 格式。

## 自訂函式

在上方點選「自訂函式」，即可建立自己的公式。例如：

| 欄位 | 內容 |
| --- | --- |
| 名稱 | `NET` |
| 參數 | `price, rate` |
| 計算式 | `ROUND(price*(1-rate),0)` |
| 測試參數 | `100, 0.15` |
| 試算結果 | `85` |

儲存定義後，就能在儲存格輸入 `=NET(A2,B2)`。

自訂函式會隨 JSON 活頁簿保存，也可以使用「下載共用函式檔」匯出 `custom-functions.js`。原有多檔案版可替換旁邊的同名檔案後重新開啟；單檔版不會自動載入旁邊的 JS 檔案，若要修改全域預設函式，需在整合時更新內嵌的定義。

## 離線與隱私

試算表運算在瀏覽器本機執行。單檔版的執行資源已內嵌，不需要額外的伺服器或網路服務。活頁簿由使用者自行開啟及儲存。

建議使用桌面版 Chrome 或 Edge；不同瀏覽器的本機檔案權限與相容性可能有所差異。

## 修改原始碼

一般使用者不需要編譯，直接使用單檔 HTML 即可。

開發者可在專案目錄執行：

```bash
npm ci
npm run build
```

原有建置流程會重新產生 `assets/`，修改後若要發布單檔版，仍需將更新的資源重新整合至 `excel-single.html`。

套件版本鎖定於 `package-lock.json`，擴充方式見 [AGENTS.md](AGENTS.md)。相依套件授權見 [THIRD-PARTY.txt](assets/THIRD-PARTY.txt)，單檔版亦保留第三方授權聲明。專案授權見 [LICENSE.txt](LICENSE.txt)。

## HTML Office 系列

HTML Office 希望讓常用的辦公工具不再受限於特定作業系統或安裝環境，透過瀏覽器即可使用，並能將工具與資料帶走。

- **[html-excel](https://github.com/ddmmbb-2/html-excel)**（本專案）— 試算表編輯器
- **[html-writer](https://github.com/ddmmbb-2/html-writer)** — 文件編輯器
- **[html-slidebook](https://github.com/ddmmbb-2/html-slidebook)** — 簡報編輯器
- **[html-image](https://github.com/ddmmbb-2/html-image)** — 圖片編輯器
- **[html-keep](https://github.com/ddmmbb-2/html-keep)** — 口袋筆記 / 備忘錄

完整系列與下載入口：[https://office.ddmmbb.org/](https://office.ddmmbb.org/)
