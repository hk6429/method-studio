# 靜態文章資料契約 v1（使用者已澄清）

網站收錄代理依影片逐字稿整理的方法文章，也接受使用者提供的逐字稿、完成稿、HTML 與文章網址。取得字幕、必要的本機轉錄、方法編排與心得撰寫都在編輯階段完成；訪客網站不搜尋 YouTube、不串接 AI，不含登入或收錄後台。

前端 fetch('/data/catalog.json')：
`{schemaVersion:1,site:{name,tagline,description},categories:[{id,name,description,topics:[{id,name}]}],methods:Method[],demo:Method}`。

首頁與搜尋只使用 methods（正式ready文章）；demo獨立以 #preview 閱讀，明標文章版型示範、不計入收錄數、不冒充使用者文章。目前收錄英文與國文閱讀方法，原始版型示範維持獨立。

Method:
- overview（可選）：`{image,mobileImage,alt,caption}`。image 與 mobileImage 使用 `/assets/overviews/<slug>.svg`，圖說區分編輯整理；手機須有可讀排版。獨立 HTML 同步放入相同圖檔，結構化文章由閱讀版型自動顯示。
- articlePath（可選）：`/articles/<slug>.html`，保留使用者交付的完整 HTML；首頁卡片與文章路由導向此站內頁面。未提供時使用結構化閱讀版型。
- id (slug), title, summary, categoryId (`ai`/`english`/`reading`), topicIds (string[]), level (`入門`/`進階`), minutes(number), output(string), audience(string), status(`ready`/`draft`), contentType(`video_method`/`article_method`/`editorial_example`), reviewedAt (YYYY-MM-DD)
- sourceCoverage (string，明示使用者提供整理稿、逐字稿或僅公開說明)，coverLabel (短字)
- sources: [{id,title,url,kind:`video`|`article`|`official`|`research`,channel?,videoId?,publishedAt?,note?}]
- steps: [{id,title,action,why,example,check,contribution:`source`|`editorial`,sourceRefs:[{sourceId,startSeconds:number|null,endSeconds:number|null}]}]
- visuals: [{type:`flow`,title,note,nodes:[{id,label,detail}],edges:[{from,to,label?}]}]；另支援 `{type:"schedule",title,note,columns:[string],rows:[{label,cells:[string]}]}`。圖解不等同證明成效。
- validation: [{claim,status:`supported`|`partial`|`unverified`,explanation,sourceIds:string[],checkedAt}]
- pitfalls:string[]
- practice:{title,minutes,prompt,deliverable,checklist:string[]}
- supplements:[{title,text,sourceIds:string[]}]

以逐字稿編成的文章需包含方法步驟、具體例子、實作判準及心得。心得可使用 supplements，標題明示「我的心得」或「編輯觀點」；個人看法不偽裝成影片原話或親身成效。sourceCoverage 記錄人工／自動字幕或本機轉錄、覆蓋範圍與未確認處；時間碼只使用真實字幕或轉錄時間，不由篇幅推算。完整逐字稿留於 scratch，不作為文章全文公開。

來源url僅https；YouTube videoId須11碼合法ID。前端以textContent/安全DOM渲染資料，不插入未信任HTML。來源時間只有有根據的秒數才可帶跳轉；null就連整部影片。

網站搜尋範圍：已收錄文章的標題、摘要、子題與步驟；不串接外部搜尋。收藏/步驟完成狀態只存使用者localStorage。

入口public/index.html、styles.css、app.js與可選ui/*.js。hash路由 #method=<id> 與 #preview。收錄後台、JSON輸入、API狀態、AI生成按鈕全部取消。

非影片完成稿使用 `article_method`，須保留 `kind: article` 的原整理頁；`video_method` 仍須保留 YouTube 原片。不得為非影片文章捏造影片或時間碼。獨立文章共用 /styles.css 與站頭站尾，特殊版面採 scoped CSS。
