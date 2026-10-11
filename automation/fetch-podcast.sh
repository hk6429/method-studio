#!/usr/bin/env bash
# 用法：fetch-podcast.sh <mp3網址> <輸出txt路徑>   （SoundOn：到 https://feeds.soundon.fm/podcasts/<id>.xml 找該集 enclosure url）
set -uo pipefail
export PATH="/opt/homebrew/bin:$HOME/.local/bin:/usr/bin:/bin"
URL="$1"; OUT="$2"; TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
set -a; . "$HOME/.claude/channels/telegram/.env"; set +a
curl -fsSL "$URL" -o "$TMP/in.mp3" || exit 2
ffmpeg -loglevel error -y -i "$TMP/in.mp3" -ac 1 -ar 16000 -b:a 32k "$TMP/a.mp3" || exit 2
curl -fsS https://api.groq.com/openai/v1/audio/transcriptions -H "Authorization: Bearer $GROQ_API_KEY" \
  -F model=whisper-large-v3-turbo -F response_format=verbose_json -F language=zh -F "file=@$TMP/a.mp3" > "$TMP/v.json" || exit 3
python3 -I -c '
import json,sys
d=json.load(open(sys.argv[1]))
for s in d["segments"]:
    st=int(s["start"]); t=s["text"].strip()
    if t: print(f"[{st//60:02d}:{st%60:02d}] {t}")' "$TMP/v.json" > "$TMP/raw.txt"
opencc -c s2twp -i "$TMP/raw.txt" -o "$OUT"
echo "OK whisper $(wc -l < "$OUT" | tr -d ' ') lines -> $OUT"
