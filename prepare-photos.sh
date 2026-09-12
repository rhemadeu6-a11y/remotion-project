#!/bin/bash
# 원본 사진(수십MB) → Remotion용 2400px 리사이즈 (public/photos/01.jpg ...)
set -e
# 원본 사진 폴더. 첫 인자로 주거나 SRC 로 넘긴다.
#   ./prepare-photos.sh "~/Desktop/촬영본/사진"
SRC="${1:-${SRC:?원본 사진 폴더를 인자나 SRC 로 지정하세요}}"
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
