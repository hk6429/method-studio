# 方法練習室 自動撰稿簡報（子代理用，v2 全自動版）

你負責 **一篇** 方法文章的完整流程：抓逐字稿 → 判斷是否為方法 → 撰寫 → 自驗 → 交回待發布草稿。
網站 repo：`~/projects/method-studio`（**不可改動 repo 任何檔案**，只寫到指派的輸出資料夾 OUT）。
逐字稿放到指派的 TX 資料夾。今天日期以 `date +%F` 為準。

## 0. 取得來源
1. 用 Notion MCP `notion-fetch` 讀指派的 page id，找「影片連結」（YouTube → 取 11 碼 videoId）或「集數連結」（Podcast）。
2. 影片：`~/projects/method-studio/automation/fetch-transcript.sh <videoId> TX/<videoId>.txt`（會先試字幕、失敗自動走 Groq Whisper；輸出 `[mm:ss] 文字`、已簡轉繁）。中繼資料：`yt-dlp --skip-download --print "%(upload_date)s|%(channel)s|%(duration)s|%(title)s" "https://www.youtube.com/watch?v=<id>"`。
3. Podcast：SoundOn 頁面 `player.soundon.fm/p/<podcastId>/episodes/<episodeId>` → RSS `https://feeds.soundon.fm/podcasts/<podcastId>.xml` → 找該集 `<enclosure url>` → `automation/fetch-podcast.sh <mp3url> TX/<episodeId>.txt`。其他平台（Firstory／Apple／Spotify）先找 RSS 的 enclosure，找不到就試 `yt-dlp -x`；兩種都失敗 → 在 Notion 把「方法室」設為 `失敗`，回報原因後結束。
4. 逐字稿是英／日／韓文時照常處理（翻譯改述），sourceCoverage 要寫明語言與辨識方式（Whisper 自動辨識、未逐字人工聽打、簡轉繁等）。

## 0.5 壓縮逐字稿（省 token，必做）
逐字稿取得後先跑：`node ~/projects/method-studio/automation/compress-transcript.mjs TX/<id>.txt TX/<id>.digest.md`。
**只讀 `.digest.md`**（帶真實起訖時間的分段要點），不要整份讀原稿。需要引用原話或確認某步的秒數時，才用 `grep`／`sed -n` 取原稿的相關幾行。sourceRefs 的秒數仍須來自原稿真實存在的 [mm:ss]。

## 1. 判斷
讀完 digest。若內容其實不是「可照做的方法」（新聞、純故事／訪談感想、產品廣告、純工具功能介紹沒有操作步驟）→ Notion「方法室」設 `不適用`，回報一句理由後結束，不要硬寫。

## 2. 輸出檔案（寫到 OUT/）
1. `<slug>.json` — 一個 Method 物件（不是陣列），欄位契約見 `docs/data-contract.md`；完整範例用 node 取 `data/catalog.json` 中 id 為 `interact-think-first-classroom` 與 `teacher-ai-toolkit-minimal` 的條目。slug 不得與 catalog 既有 id 重複。
2. `<slug>.svg`（1200×650）、`<slug>-mobile.svg`（直式 480×800 左右）、`<slug>-card.svg`（800×480）。配色／結構完全仿 `public/assets/overviews/interact-think-first-classroom.svg`／`-mobile.svg`／`-card.svg`（米白 #f0f2e9、墨綠 #193732、灰綠 #586b60、淺綠 #d4e2d4、線 #bdcbbb、白 #fffef9）；不得外部圖片、不得 script；文字用 <text> 繁體；marker/title id 用 slug 前綴。
3. `<slug>.notes.md` — 50 字內：逐字稿覆蓋、不確定處、編輯判斷。

## 3. 硬規則（驗證腳本會退件）
- `status:"ready"`；YouTube 來源 `contentType:"video_method"`、`sources[0].kind:"video"` 必填 `videoId`(11碼) 與 `url:"https://www.youtube.com/watch?v=<id>"`；Podcast 來源 `contentType:"article_method"`、`sources[0].kind:"article"` 指向集數網址，不可捏造影片。
- `publishedAt` 留字串 `"PUBLISHED_AT"` 佔位；`reviewedAt` 與 validation `checkedAt` 填今天。
- `overview` **必填**：`{image:"/assets/overviews/<slug>.svg", mobileImage:"/assets/overviews/<slug>-mobile.svg", cardImage:"/assets/overviews/<slug>-card.svg", alt, caption}`，caption 要寫「編輯整理」。
- `categoryId` 只能 ai／english／reading／movement；`topicIds` 只能用 catalog.json 該分類已有的 topic id（先讀出來）。班級經營→reading/classroom、親子→reading/parenting、學習法→reading/learning、思考與習慣→reading/mindset、回顧決策→reading/review、英語學習→english/*、AI 工作流→ai/workflow（＋用到的模型 topic）。
- 每個 step 必有 `sourceRefs:[{sourceId,startSeconds,endSeconds}]`，秒數 **只能來自逐字稿檔裡真實存在的 [mm:ss]**（start<end）；編輯延伸步 `contribution:"editorial"` 仍掛相關段落，或 start/end 皆 null。
- `validation[]` status 只能 `partial` 或 `unverified`（不捏造研究）。`visuals` 至少一個 `flow`（nodes/edges id 對得上）＋一個 `schedule`。`pitfalls` 3–5 條、`practice`（minutes/prompt/deliverable/checklist）、`supplements` 至少一則「我的心得」（第一人稱編輯觀點，不冒充講者、不宣稱親身成效）。
- `steps` 4–6 步，每步 title/action/why/example/check 齊全；編輯自訂例子標「編輯示範」。另需 `minutes`、`level`(入門／進階)、`output`、`audience`、`sourceCoverage`、`coverLabel`、`keywords[]`、`summary`。
- 全文繁體中文（台灣用語）、禁簡體；外語原文翻譯改述，每步引用原話不超過一句。影片數字註「影片稱」。真實校內老師姓名可寫講者公開姓名，但不要寫入未公開的學生姓名。

## 4. 自驗（全部通過才算完成；同一篇修正最多兩輪，第二輪仍失敗就停手：Notion「方法室」設 `失敗`，回報原因後結束，不要繼續重試）
```bash
node -e 'JSON.parse(require("fs").readFileSync("OUT/<slug>.json","utf8"))'
# 併入 catalog 複本跑 validateCatalog（publishedAt 暫填合法時間），需 0 errors：
node -e 'import("/Users/naichengchen/projects/method-studio/scripts/catalog.mjs").then(m=>{const fs=require("fs");const c=JSON.parse(fs.readFileSync("/Users/naichengchen/projects/method-studio/data/catalog.json","utf8"));const a=JSON.parse(fs.readFileSync("OUT/<slug>.json","utf8"));a.publishedAt="2026-01-01T00:00:00+08:00";c.methods.push(a);const e=m.validateCatalog(c);console.log(e.length?e.join("\n"):"0 errors");process.exit(e.length?1:0)})'
/usr/bin/grep -n -E '[们这个为说会时学过来对开关问题]' OUT/<slug>*   # 必須無命中
for f in OUT/<slug>.svg OUT/<slug>-mobile.svg OUT/<slug>-card.svg; do xmllint --noout "$f"; done
```
另用腳本核對每個 sourceRefs 的秒數都存在於逐字稿 [mm:ss]。

## 5. 交回草稿，等待整批發布
只回報主來源與重複 page id，不提前標記「已收錄」，不改「完成」。總管必須湊齊 20 篇、檢查並確認正式站後才回填 Notion。

## 6. 回報（10 行內）
slug、標題、categoryId/topicIds、逐字稿來源與語言、Notion page id 與待發布狀態、不確定處。不要貼全文。

## 寫法
先讀完逐字稿，找出「要解決的問題 → 核心主張 → 可操作動作 → 例子 → 完成判準」，寫成老師帶學生／大人自學都能照做的步驟。語氣溫暖具體，像老師對朋友說話，不空談。
