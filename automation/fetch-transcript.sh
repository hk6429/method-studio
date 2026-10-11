#!/usr/bin/env bash
# 用法：fetch-transcript.sh <youtubeVideoId> <輸出txt路徑>
# 先抓字幕（youtube-transcript-api），沒有字幕就 yt-dlp 抓音訊 → Groq whisper-large-v3-turbo；
# 輸出每行 "[mm:ss] 文字"，簡體一律 opencc s2twp 轉繁。GROQ_API_KEY 從 ~/.claude/channels/telegram/.env 讀。
set -uo pipefail
export PATH="/opt/homebrew/bin:$HOME/.local/bin:/usr/bin:/bin"
VID="$1"; OUT="$2"; TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
to_lines() { # stdin: JSON array（可能巢狀）of {text,start}
  python3 -I -c '
import json,sys
d=json.load(sys.stdin)
while isinstance(d,list) and d and isinstance(d[0],list): d=d[0]
for s in d:
    t=s.get("text","").replace("\n"," ").strip()
    if not t: continue
    st=int(float(s.get("start",0))); print(f"[{st//60:02d}:{st%60:02d}] {t}")'
}
if uvx --from youtube-transcript-api youtube_transcript_api "$VID" --languages zh-TW zh-Hant zh zh-Hans en ko ja --format json > "$TMP/sub.json" 2>"$TMP/sub.err" && [ -s "$TMP/sub.json" ] && to_lines < "$TMP/sub.json" > "$TMP/raw.txt" && [ -s "$TMP/raw.txt" ]; then
  SRC="subtitle"
else
  set -a; . "$HOME/.claude/channels/telegram/.env"; set +a
  URL="https://www.youtube.com/watch?v=$VID"
  yt-dlp -q -x --audio-format mp3 --postprocessor-args "-ac 1 -ar 16000 -b:a 32k" -o "$TMP/a.%(ext)s" "$URL" \
    || { echo "yt-dlp 預設格式失敗，改用 -f ba 重試" >&2; rm -f "$TMP"/a.* "$TMP"/raw.*; yt-dlp -q -f ba -o "$TMP/raw.%(ext)s" "$URL" && ffmpeg -loglevel error -y -i "$TMP"/raw.* -ac 1 -ar 16000 -b:a 32k "$TMP/a.mp3"; } \
    || { echo "yt-dlp failed" >&2; exit 2; }
  curl -fsS https://api.groq.com/openai/v1/audio/transcriptions -H "Authorization: Bearer $GROQ_API_KEY" \
    -F model=whisper-large-v3-turbo -F response_format=verbose_json -F "file=@$TMP/a.mp3" > "$TMP/v.json" || { echo "groq failed" >&2; exit 3; }
  python3 -I -c '
import json,sys
d=json.load(open(sys.argv[1]))
for s in d["segments"]:
    st=int(s["start"]); t=s["text"].strip()
    if t: print(f"[{st//60:02d}:{st%60:02d}] {t}")' "$TMP/v.json" > "$TMP/raw.txt"
  SRC="whisper"
fi
opencc -c s2twp -i "$TMP/raw.txt" -o "$OUT"
echo "OK $SRC $(wc -l < "$OUT" | tr -d ' ') lines -> $OUT"
