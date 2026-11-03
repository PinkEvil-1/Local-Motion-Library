# Motion Library — 本地動態收藏

Vue 3 + TypeScript 的個人本地學習保存版本，保存 **331 種效果**：194 CSS、120 GSAP、17 Canvas。

**資料、名稱、描述、提示詞與演示來源：Hannah（UI/UX Designer）整理的 [Motion Library](https://kittenjam-motion-library.vercel.app/)。[作者作品集](https://hannahchao-portfolio.vercel.app/)。本專案不是原作者官方版本。**

## 啟動

需要 Node.js 22.12+ 或 24。在專案目錄執行：

~~~powershell
npm ci
npm run dev
~~~

開啟終端機顯示的網址，通常是 http://127.0.0.1:5173 。首次安裝需要網路，安裝完成後瀏覽與演示無需原站或 CDN。要長期保存，請同時備份原始碼、package-lock.json、public/runtime 與建置後的 dist；僅有 lockfile 不能保證未來還能取得依賴。

## 建置與驗證

~~~powershell
npm test
npm run build
npm run preview
# 另一個終端機，在 preview 執行時：
npm run verify:demos
node tests/acceptance.mjs
~~~

瀏覽器檢查使用本機 Edge。可用 PLAYWRIGHT_CHANNEL=chrome 改用 Chrome；沒有瀏覽器時先執行 npx playwright install chromium，再設定 PLAYWRIGHT_CHANNEL=chromium。

## 功能與更新

中英文名稱、說明、關鍵字及提示詞全文搜尋；元件／時機／情境／技術交叉篩選；排序、分頁、本地收藏、自訂文字、互動預覽、提示詞複製與 JSON 匯出。收藏存於本瀏覽器的 localStorage。

~~~powershell
npm run snapshot:check
npm run snapshot:update
~~~

check 只比較來源，update 保留舊版再更新資料與演示。更新後重新驗證。詳見 [工作流](docs/WORKFLOW.md) 與 [Agent 規則](AGENTS.md)。

## 來源與限制

原站聲明：名稱與描述屬原作者整理，預覽動畫為示意重製，僅供個人參考學習。快照未找到明確再散布授權，本專案保留來源，不替原始內容宣告新授權。原作者參考來源：threads.com/@ai_yunon_ai/post/DeeJRUjkXlM、threads.com/@ai_tjb/post/DeeHoA3ktZ5。

GSAP 3.13.0 依 [Standard License](https://gsap.com/standard-license) 使用，發行檔案頭與說明保留於 public/runtime/vendor。Google Fonts 改用系統字型，外觀可能與原站有差異。未執行原站追蹤或遠端投稿。逐項演示驗證是初始化與短時間錯誤檢查，不代表逐像素還原或所有互動皆驗收。

## 已建置版本：完全離線啟動

此目錄已包含 dist。直接執行以下命令，不需要 npm install 或 node_modules：

~~~powershell
node serve-local.mjs
~~~

開啟 http://127.0.0.1:4173 。motion-library-portable.zip 內含 dist、啟動程式及來源說明，解壓後也能用同一命令啟動。需要本機 Node.js。若連接埠已使用，可先設定 $env:PORT=4174。

## Windows 雙擊啟動

雙擊專案根目錄的 **Start-Motion-Library.cmd**。它會執行旁邊的 PowerShell 腳本，自動啟動本地網站並開啟瀏覽器。使用期間保留啟動視窗，按 Enter 即可停止伺服器。預設連接埠為 4173，若被佔用會自動選用下一個可用連接埠。

第一次使用若缺少 dist，會安裝所需套件並建置，因此需要網路；已有 dist 時不需網路或 npm 套件。電腦須先安裝 Node.js 22.12+ 或 24。

也可以在 PowerShell 執行：

~~~powershell
.\Start-Motion-Library.ps1
# 指定連接埠，或不自動開啟瀏覽器：
.\Start-Motion-Library.ps1 -Port 4180 -NoBrowser
~~~

CMD 啟動檔只對本次 PowerShell 程序設定腳本執行選項，不修改系統的執行原則。可攜備份請一併包含兩個 Start-Motion-Library 啟動檔。
