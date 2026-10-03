# 方法練習室

收藏「學習 AI」、「學習英文」與「閱讀與學習」的方法文章，把影片逐字稿或完成稿整理成可照著做的步驟、圖解、範例、心得與練習。

站長可直接提供 YouTube 影片、逐字稿、完成稿或文章網址。代理在編輯階段取得逐字稿，整理方法、撰寫心得並上稿。訪客使用的網站維持靜態，不呼叫 AI、不搜尋 YouTube，也沒有會員、資料庫或寫入後台。站內搜尋只搜尋已收錄文章；原影片或原整理頁以來源連結保留。

## 第一版

- 臺灣國風潑墨版型：宣紙米白、墨綠、朱紅印章與宋體標題；首頁五角色群像，文章以少量角色提示陪讀，保留乾淨的正文與流程圖。
- 五位夥伴：知行（實作）、以澄（步驟）、阿問（提問）、小硯（來源）與臺灣犬墨丸（陪伴）。角色圖採透明 WebP；桌面首頁用滿版山水書院場景，手機使用完整群像，依視窗載入適合尺寸。
- 首頁主視覺、夥伴介紹與閱讀指南延伸至視窗兩側；文字區保留閱讀寬度。指南採淺綠底配深綠字，文章頁維持原有乾淨版面。
- 滿版主視覺原始圖與生成提示詞保留於 `design/brand-v2/`；2048px／1440px 網頁圖分別約 375／226 KiB。
- 三大類、十一個子題：Claude、ChatGPT、Gemini、工作流程；英文的記憶與複習、口說與聽力、閱讀、寫作、學習習慣；閱讀策略與教學應用。
- 分類、子題與文章種類篩選；關鍵字可搜尋標題、摘要、步驟與心得，支援多個詞一起查找。
- 依最新發布、最早發布、練習時間或標題排序；首頁依序顯示置頂文章、最新三篇與更多方法，同篇不重複。
- 方法詳頁、逐步勾選、個人收藏、列印版。
- 每篇可包含步驟、流程圖、排程表、實作練習、常見誤區與來源。
- 文章列表頂端附精簡流程圖，每篇正式文章開頭附與主站配色一致的方法概覽圖；桌面與手機使用各自排版，閱讀四策略採並列選擇。
- 區分影片原述、編輯補充、外部佐證；沒有佐證時不宣稱成效已驗證。
- 已收錄 **9 篇**方法文章：《龍櫻》暗記暗誦法視覺化手冊、閱讀策略備課室、錯題筆記口說練習、差異化教學與 AI 融入、英語日日聽提示漸退練習、字鬥英雄單字回想與攻克、汴水小鎮文學探究與修訂、會考國文分類練習與錯因修正。文章共用本站的米白、墨綠閱讀版型，保留來稿的圖表與互動，附原片與示意資料說明；另有獨立版型示範。
- 收藏與練習進度僅存於目前瀏覽器；不跨裝置同步。

## 正式文章

- [《龍櫻》暗記暗誦法：視覺化手冊與互動練習](https://method-studio-7dm.pages.dev/articles/dragon-english-memory)
- [閱讀策略備課室：摘要、分析、推論與比較](https://method-studio-7dm.pages.dev/articles/reading-strategies)

- [把錯題筆記變成口說練習：一張句卡的六步做法](https://method-studio-7dm.pages.dev/#method=error-notebook-speaking)

- [差異化教學與 AI 融入：從一份素材到可試教的學習任務](https://method-studio-7dm.pages.dev/#method=ai-differentiated-teaching)

- [每天五句，從聽懂到自己說：英語日日聽的提示漸退練習法](https://method-studio-7dm.pages.dev/#method=daily-english-listen-recall)

- [每天十題，把錯字練回來：字鬥英雄的回想、攻克與間隔複習法](https://method-studio-7dm.pages.dev/#method=vocab-duel-recall-repair)

- [讓小鎮留下思考：汴水小鎮的情境閱讀、證據說理與作品修訂法](https://method-studio-7dm.pages.dev/#method=bianshui-evidence-revision)

- [從答錯一題，到看懂自己的判斷：會考國文的分類練習與錯因修正法](https://method-studio-7dm.pages.dev/#method=cap-guowen-error-analysis)

- [一次十字，隔次再遇見：字旅的微任務與間隔回想法](https://method-studio-7dm.pages.dev/#method=word-odyssey-spaced-journey)

## 本機預覽

需 Node.js 22 以上，沒有第三方套件，不需安裝依賴。

```sh
npm run dev
```

瀏覽 `http://127.0.0.1:8788`。需要其他埠號時：

```sh
npm run dev -- --port 8790
```

## 檢查與建置

```sh
npm test
npm run build
```

`dist/` 是完整靜態發布內容，可放在 Cloudflare Pages、Netlify 或其他靜態主機；正式站為 https://method-studio-7dm.pages.dev/。僅發布 `dist/`，不發布專案根目錄、研究筆記或 scratch。

檢查會拒絕正式清單中的草稿、版型示範、重複 ID、缺失來源、不安全來源網址、失聯引用與流程連線，以及無來源的成效背書。檢查不代替內容審閱。

## 如何新增文章

站長直接提供 YouTube 影片網址即可；有逐字稿、完成文章或 HTML 時也可以一併提供。不需先自行整理成文或填寫資料格式。標題、分類或圖解構想可以附上，也可以由編輯協助整理。

編輯流程：

1. 取得影片字幕或逐字稿；沒有字幕時可使用已安裝的本機語音轉錄。保留原始資料、時間碼與取得方式，不以影片標題或簡介代替逐字稿。
2. 整理要解決的問題、核心觀點、清楚動作、例子與完成判準；新增的例子另標編輯補充。
3. 撰寫心得與教學／生活應用，分清來源說法與編輯觀點。加入流程圖、排程或可複用模板；沒有資料時，不製作成效數據或宣稱親身試用。
4. 將條目加入 `data/catalog.json` 的 `methods`，確認來源與分類，執行測試及預覽。
5. 完成內容與畫面檢查後，依既有發布授權部署並讀回正式站。

欄位契約見 [docs/data-contract.md](docs/data-contract.md)，交稿說明見 [docs/article-submission.md](docs/article-submission.md)。

## 文章設定與置頂

設定在 `data/catalog.json` 的文章條目，隨網站發布後對所有訪客生效；訪客的個人收藏仍只存在自己的瀏覽器。

- `publishedAt`：本站首次發布時間，含時區，例如 `2026-10-03T23:22:54+08:00`。新文章必填；修文時保留首次發布時間，更新 `reviewedAt` 即可。既有文章由 Git 首次收錄紀錄回填，與來源影片的發布日分開。
- `categoryId`、`topicIds`：大類與子題；`contentType` 為 `video_method`（影片方法）或 `article_method`（主題文章）。
- `keywords`：額外搜尋詞陣列，可放常用別稱。
- `pinned: true`：將文章放進置頂區；多篇置頂時用 `pinOrder: 1`、`2`…設定前後。不填順序者排在已指定順序之後。取消置頂時刪除 `pinned` 與 `pinOrder`。

未指定置頂文章時不顯示空的置頂區。「最新三篇」列出未置頂文章中最新的三篇（不足三篇則全部列出）；其餘放在「更多方法」。使用搜尋、分類或其他排序時，改為顯示完整符合清單，置頂文章仍須符合篩選條件才會出現。我的收藏也適用相同篩選與排序。

## 檔案

- `public/`：頁面、樣式與瀏覽器程式；`public/articles/` 保留完成 HTML 來稿。
- 獨立文章共用 `/styles.css` 的配色、字體、品牌導覽與頁尾；`public/articles/article.css` 處理文章圖表、卡片及手機排版。
- `data/catalog.json`：網站設定、分類、正式文章及獨立版型。
- `scripts/catalog.mjs`：文章與來源關聯檢查。
- `scripts/serve.mjs`：只讀、僅本機預覽。
- `scripts/build.mjs`：建置靜態網站。
- `test/`：資料契約與預覽邊界測試。
- `docs/`：編輯規格，不會一起發布至網站。
- `public/ui/brand.js`：角色資料、陪讀提示與首頁角色介紹；`public/assets/brand/`：正式站群像、小像與圖示。獨立 HTML 文章使用同一套角色提示 class。
- `design/brand-v1/production/`：正式插畫 PNG 原稿、提示詞與資產雜湊，保留創作來源，建置時不發布。首頁與文章內容不依賴生圖服務。

## 內容與來源

YouTube 影片仍屬原創作者。網站保留原片連結與可核對的來源；不以標明出處替代授權，也不複製整本書或長篇逐字稿。AI 整理與資訊圖表只是呈現方式，不能自行證明方法有效。

## 發布

Cloudflare Pages 專案：`method-studio`；production branch：`main`。建置並驗證後使用 `wrangler pages deploy dist --project-name method-studio --branch main`。回復前一版本時重新建置該 Git 提交並部署，發布後讀回首頁、文章與來源連結。

講者直接提供、未公開的整理稿可使用 manuscript 來源，保留提供者與取得說明；不必捏造影片或公開網址。
