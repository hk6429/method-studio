# 靜態文章資料契約 v1（使用者已澄清）

網站只收錄使用者已透過AI整理、交付的文章；不搜尋YouTube、不自動讀影片、不串接AI，不含登入或收錄後台。根代理未來依使用者貼入的完成稿整理資料，再進行發布。

前端 fetch('/data/catalog.json')：
`{schemaVersion:1,site:{name,tagline,description},categories:[{id,name,description,topics:[{id,name}]}],methods:Method[],demo:Method}`。

首頁與搜尋只使用 methods（正式ready文章）；demo獨立以 #preview 閱讀，明標文章版型示範、不計入收錄數、不冒充使用者文章。正式資料初始 methods:[]。

Method:
- articlePath（可選）：`/articles/<slug>.html`，保留使用者交付的完整 HTML；首頁卡片與文章路由導向此站內頁面。未提供時使用結構化閱讀版型。
- id (slug), title, summary, categoryId (`ai`/`english`), topicIds (string[]), level (`入門`/`進階`), minutes(number), output(string), audience(string), status(`ready`/`draft`), contentType(`video_method`/`editorial_example`), reviewedAt (YYYY-MM-DD)
- sourceCoverage (string，明示使用者提供整理稿、逐字稿或僅公開說明)，coverLabel (短字)
- sources: [{id,title,url,kind:`video`|`official`|`research`,channel?,videoId?,publishedAt?,note?}]
- steps: [{id,title,action,why,example,check,contribution:`source`|`editorial`,sourceRefs:[{sourceId,startSeconds:number|null,endSeconds:number|null}]}]
- visuals: [{type:`flow`,title,note,nodes:[{id,label,detail}],edges:[{from,to,label?}]}]；另支援 `{type:"schedule",title,note,columns:[string],rows:[{label,cells:[string]}]}`。圖解不等同證明成效。
- validation: [{claim,status:`supported`|`partial`|`unverified`,explanation,sourceIds:string[],checkedAt}]
- pitfalls:string[]
- practice:{title,minutes,prompt,deliverable,checklist:string[]}
- supplements:[{title,text,sourceIds:string[]}]

來源url僅https；YouTube videoId須11碼合法ID。前端以textContent/安全DOM渲染資料，不插入未信任HTML。來源時間只有有根據的秒數才可帶跳轉；null就連整部影片。

網站搜尋範圍：已收錄文章的標題、摘要、子題與步驟；不串接外部搜尋。收藏/步驟完成狀態只存使用者localStorage。

入口public/index.html、styles.css、app.js與可選ui/*.js。hash路由 #method=<id> 與 #preview。收錄後台、JSON輸入、API狀態、AI生成按鈕全部取消。
