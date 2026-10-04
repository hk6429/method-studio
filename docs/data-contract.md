# 靜態文章資料契約 v1（使用者已澄清）

網站收錄代理依影片逐字稿整理的方法文章，也接受使用者提供的逐字稿、完成稿、HTML 與文章網址。取得字幕、必要的本機轉錄、方法編排與心得撰寫都在編輯階段完成；訪客網站不搜尋 YouTube、不串接 AI，不含登入或收錄後台。

前端 fetch('/data/catalog.json')：
`{schemaVersion:1,site:{name,tagline,description},categories:[{id,name,description,topics:[{id,name}]}],methods:Method[],demo:Method}`。

首頁與搜尋只使用 methods（正式ready文章）；demo獨立以 #preview 閱讀，明標文章版型示範、不計入收錄數、不冒充使用者文章。目前收錄英文與國文閱讀方法，原始版型示範維持獨立。

Method:
- overview（正式文章必填，demo 可省略）：`{image,mobileImage,cardImage,alt,caption}`。image、mobileImage 與 cardImage 使用 `/assets/overviews/<slug>.svg`，圖說區分編輯整理；手機須有可讀排版。獨立 HTML 同步放入相同圖檔，結構化文章由閱讀版型自動顯示。
- articlePath（可選）：`/articles/<slug>.html`，保留使用者交付的完整 HTML；首頁卡片與文章路由導向此站內頁面。未提供時使用結構化閱讀版型。
- id (slug), title, summary, categoryId（對應 categories，目前為 `ai`/`english`/`reading`/`movement`）, topicIds (string[]), level (`入門`/`進階`), minutes(number), output(string), audience(string), status(`ready`/`draft`), contentType(`video_method`/`article_method`/`editorial_example`), reviewedAt (YYYY-MM-DD)
- publishedAt（正式文章必填）：首次收錄於本站的 RFC 3339 日期時間，必須包含時區，例如 `2026-10-03T23:22:54+08:00`；使用有效日曆日期與 00–23 時、00–59 分秒。來源發布日期仍屬於 `sources[].publishedAt`，文章修訂日期仍使用 `reviewedAt`，兩者都不能代替首次收錄時間。
- pinned（可選 boolean，預設未置頂）：只有明確設為 `true` 才列入全站置頂專區。pinOrder（可選正整數）只能與 `pinned: true` 一起使用；小者在前，未提供者放最後，同值保留傳入陣列順序。未指定的真實文章不自行置頂。
- keywords（可選 string[]）：供搜尋使用的精簡關鍵字，每一項都必須是非空白字串；不代替既有分類與子題。
- sourceCoverage (string，明示使用者提供整理稿、逐字稿或僅公開說明)，coverLabel (短字)
- sources: [{id,title,url,kind:`video`|`article`|`official`|`research`|`manuscript`,channel?,provider?:`youtube`|`facebook`,videoId?,publishedAt?,note?}]
- steps: [{id,title,action,why,example,check,contribution:`source`|`editorial`,sourceRefs:[{sourceId,startSeconds:number|null,endSeconds:number|null}]}]
- visuals: [{type:`flow`,title,note,nodes:[{id,label,detail}],edges:[{from,to,label?}]}]；另支援 `{type:"schedule",title,note,columns:[string],rows:[{label,cells:[string]}]}`。圖解不等同證明成效。
- validation: [{claim,status:`supported`|`partial`|`unverified`,explanation,sourceIds:string[],checkedAt}]
- pitfalls:string[]
- practice:{title,minutes,prompt,deliverable,checklist:string[]}
- supplements:[{title,text,sourceIds:string[]}]

以逐字稿編成的文章需包含方法步驟、具體例子、實作判準及心得。心得可使用 supplements，標題明示「我的心得」或「編輯觀點」；個人看法不偽裝成影片原話或親身成效。sourceCoverage 記錄人工／自動字幕或本機轉錄、覆蓋範圍與未確認處；時間碼只使用真實字幕或轉錄時間，不由篇幅推算。完整逐字稿留於 scratch，不作為文章全文公開。

來源url僅https；影片 provider 省略時沿用 YouTube，videoId 須為 11 碼合法 ID；Facebook 必填 provider: facebook，videoId 為數字字串且須與 facebook.com 或 www.facebook.com 的 /reel/<id> 或 /watch/?v=<id> 相符。分享短網址先解析為正式網址。Facebook 只連回原片，不載入 YouTube 播放器；ASR 時間碼供人工對照，不承諾跳轉。前端以textContent/安全DOM渲染資料，不插入未信任HTML。來源時間只有有根據的秒數才可帶跳轉；null就連整部影片。

網站搜尋只涵蓋已收錄 `ready` 文章：標題、摘要、分類與已指定子題名稱、文章類型中文名稱、keywords、適用對象、產出、步驟、練習、圖說、圖解文字、補充閱讀、來源說明與佐證文字。查詢與文字都先作 NFKC 正規化並轉小寫，再以空白拆詞，每個詞都需出現在同一篇文章的搜尋文字中；不同詞可分布於不同欄位。網址、內部 ID 與未指定的子題不作搜尋詞。不串接外部搜尋。收藏/步驟完成狀態只存使用者localStorage。

文章庫純函式位於 `public/ui/library.js`：
- `CONTENT_TYPES = [{id:'video_method',name:'影片方法'},{id:'article_method',name:'主題文章'}]`。
- `selectMethods(methods, categories, filters = {}, favorites = new Set())` 回傳符合條件的正式文章新陣列，不修改資料或優先置頂。filters 為 `{category:'all',topic:'all',contentType:'all',query:'',saved:false,sort:'newest'}`；分類、子題、內容類型、查詢及收藏採交集。
- `sort` 支援 `newest`（收錄時間新到舊）、`oldest`（舊到新）、`shortest`（練習時間短到長）與 `title`（繁體中文標題順序）。收錄時間相同時，newest 採原資料陣列後加入者優先，oldest 採原順序；shortest 與 title 同分以 newest 決定。僅供舊測試資料相容時，缺少 publishedAt 才退回 reviewedAt；正式資料驗證仍要求 publishedAt。
- `splitMethods(methods, {showLatest = false} = {})` 回傳 `{pinned,latest,remaining}`，依前述 pinOrder 分出置頂文章；啟用 showLatest 時，剩餘陣列前三篇進 latest，其餘進 remaining。以 id 去重，三區不重複。最新版排序先由 selectMethods 完成，分組不另改普通文章順序。

既有七篇文章的 publishedAt 由 Git 歷史逐版確認各 id 首次出現的提交時間，並非原來源發布日期：

| 文章 id | 首次加入提交 | publishedAt |
|---|---|---|
| dragon-english-memory | bec8419 | 2026-10-03T11:43:07+08:00 |
| reading-strategies | 3bac330 | 2026-10-03T12:59:56+08:00 |
| error-notebook-speaking | 7d9491b | 2026-10-03T14:56:08+08:00 |
| ai-differentiated-teaching | 73bd1d1 | 2026-10-03T20:07:09+08:00 |
| daily-english-listen-recall | 8db9835 | 2026-10-03T23:09:26+08:00 |
| vocab-duel-recall-repair | 22f4831 | 2026-10-03T23:17:47+08:00 |
| bianshui-evidence-revision | 8643afd | 2026-10-03T23:22:54+08:00 |

入口public/index.html、styles.css、app.js與可選ui/*.js。hash路由 #method=<id> 與 #preview。收錄後台、JSON輸入、API狀態、AI生成按鈕全部取消。

非影片完成稿使用 `article_method`，須保留 `kind: article` 的原整理頁；`video_method` 仍須保留可核對的 YouTube 或 Facebook 原片。不得為非影片文章捏造影片或時間碼。獨立文章共用 /styles.css 與站頭站尾，特殊版面採 scoped CSS。

講者或作者直接交付、未公開的整理稿可用 `kind: manuscript`，省略 url；必填 channel（提供者）、note（活動日期、取得方式與未核對範圍）。有 url 時仍須 HTTPS。前端以純文字顯示無網址來源，不捏造公開連結。article_method 可引用 article 或 manuscript；其他來源仍須網址，影片方法仍須原片。

cardImage 為列表專用精簡圖解（800 × 480），不可直接把含大量小字的完整圖縮成封面；image／mobileImage 分別為文章桌面與手機圖解。所有正式文章缺少配圖時拒絕驗證，建置檢查三種圖檔均存在。
