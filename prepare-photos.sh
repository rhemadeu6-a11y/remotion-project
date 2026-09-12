#!/bin/bash
# 원본 사진(수십MB) → Remotion용 2400px 리사이즈 (public/photos/01.jpg ...)
set -e
SRC="/Users/potato/Library/Mobile Documents/com~apple~CloudDocs/CONNECTED HK/미래내일 일경험/사진"
DST="$(dirname "$0")/public/photos"
mkdir -p "$DST"

i=1
for f in "$SRC"/*.jpg; do
  out=$(printf "$DST/%02d.jpg" "$i")
  # 긴 변 2400px 리사이즈, 품질 90, EXIF 회전 반영
  ffmpeg -y -loglevel error -i "$f" \
    -vf "scale='if(gt(iw,ih),2400,-2)':'if(gt(iw,ih),-2,2400)',format=yuvj420p" \
    -q:v 3 "$out"
  echo "$(basename "$out")  $(basename "$f")"
  i=$((i+1))
done
echo "== 완료: $((i-1))장 =="
ls -la "$DST"
