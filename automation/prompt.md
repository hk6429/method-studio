你是「方法練習室」(~/projects/method-studio) 的每日自動產線總管。全程不要問問題、繁體中文台灣用語。今天日期以 `date +%F` 為準。
工作目錄 WORK=~/projects/method-studio/.digest/<今天日期>（mkdir -p；子資料夾 out/ 與 tx/）。

## 一、找素材（Notion MCP，SQL 模式）
資料源 collection://d0d2d00e-283a-8298-a89b-07a24016f9e6（欄位：知識名稱、作者、類別 youtube/podcast、完成、方法室、方法室連結、createdTime、url）。
1. 新片：`"方法室" IS NULL AND datetime(createdTime) >= datetime('now','-36 hours')`。
2. 補舊：`"方法室" IS NULL AND datetime(createdTime) < datetime('now','-36 hours') ORDER BY createdTime LIMIT 120`（最舊優先）。
3. 依標題／作者判斷是否屬「方法」四類：學習／思考法、工作／生產力法、教學／親子法、理財／人生法。排除：新聞、產品發表、純故事或訪談感想、Shorts（片長 <3 分）、廣告、財經行情、純工具功能介紹。同一集的 YouTube／Podcast 重複筆、直播與 EP 重播只選一筆為主、其餘列為重複 page id。
4. 不屬方法的，用 notion-update-page 把「方法室」設 `不適用`（一次全部處理掉，之後不再重掃）。
5. 選題上限：新片全選 ＋ 補舊最多 10 篇。沒有可做的就直接到第四步回報。

## 二、撰稿（平行子代理）
每篇用 Agent 工具派一個 general-purpose 子代理，提示詞固定為：
「先完整讀 /Users/naichengchen/projects/method-studio/automation/brief.md 並照做。OUT=<WORK>/out  TX=<WORK>/tx
指派：Notion page id <id>（<作者>〈<標題>〉，<youtube/podcast>）。建議 slug：<英文小寫slug>；分類建議 <categoryId / topicIds>。重複 page id：<無或列出>。」
同時最多 5 個子代理，等一批完成再派下一批。子代理回報「不適用／失敗」就略過。

## 三、合併、驗證、部署
```bash
cd ~/projects/method-studio
node automation/merge.mjs <WORK>/out ~/projects/method-studio   # 沒有 json 就跳過後續
npm test && npm run build
/usr/bin/git add -A && /usr/bin/git commit -m "feat(catalog): 每日自動新增 N 篇方法文章（YYYY-MM-DD）" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
npx wrangler pages deploy dist --project-name method-studio --branch main
```
部署後必驗：`curl -s https://method-studio-7dm.pages.dev/data/catalog.json | md5` 須等於 `md5 -q dist/data/catalog.json`；不等就等 60 秒再試三次，仍不等要回報失敗。
測試或驗證失敗：把有問題的那篇 json 移出 out/ 再重跑 merge（先 `git checkout data/catalog.json public/assets/overviews` 還原），並把該篇 Notion「方法室」改 `失敗`。
**絕對不要 git push、不要碰 Vercel。**

## 四、回報
1. Telegram（chat_id 7419236774；`set -a; . ~/.claude/channels/telegram/.env; set +a` 取 TELEGRAM_BOT_TOKEN）：
   `curl -fsS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" -d chat_id=7419236774 --data-urlencode text="..."`
   內容：「▋方法練習室 日報 YYYY-MM-DD」＋每篇一行「標題｜來源｜連結 https://method-studio-7dm.pages.dev/#method=<slug>」＋略過／失敗統計＋待補剩餘數（方法室 IS NULL 的筆數）。
2. 存檔 ~/agent/Claude輸出/YYYY年/MM月/DD日/HHMM-方法練習室日報.md（frontmatter date/type/tags）。
