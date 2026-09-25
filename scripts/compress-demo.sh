#!/usr/bin/env bash
#
# Compress a Demo into a Staging copy without visible quality loss.
#
# Why this exists: the add-recording skill needs one deterministic transcode —
# every run produces a Demo browsers can decode (H.264, yuv420p, faststart) at
# a size worth uploading, with no judgement calls about flags.
#
#   ./scripts/compress-demo.sh <input-video> <staging-demo-path>
#
# Example:
#   ./scripts/compress-demo.sh ~/Downloads/my-animation.mp4 public/demo/buttons/my_button_pushkar_tandon.mp4
#
# Exits non-zero when ffmpeg is missing, the input is unreadable, or the
# output fails the H.264 check. Requires ffmpeg (brew install ffmpeg).
#
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "usage: ./scripts/compress-demo.sh <input-video> <staging-demo-path>" >&2
  exit 1
fi

INPUT="$1"
OUTPUT="$2"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found — install it (brew install ffmpeg)" >&2
  exit 1
fi

if [ ! -f "$INPUT" ]; then
  echo "no such input file: $INPUT" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT")"

# CRF 20 + slow preset: visually lossless for screen recordings at roughly
# half the bytes of a phone export. yuv420p because Chrome refuses yuv444.
# Even-dimension scale because x264 aborts on odd heights from screen crops.
# +faststart so the CDN can stream the first frame before the upload finishes
# downloading. Audio kept (AAC) when present; harmless when absent.
ffmpeg -y -v error \
  -i "$INPUT" \
  -c:v libx264 -crf 20 -preset slow \
  -pix_fmt yuv420p \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
  -movflags +faststart \
  -c:a aac -b:a 128k \
  "$OUTPUT"

CODEC=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "$OUTPUT" | head -1)
if [ "$CODEC" != "h264" ]; then
  echo "transcode produced codec $CODEC, expected h264 — refusing $OUTPUT" >&2
  exit 1
fi

echo "staged $OUTPUT ($(du -h "$OUTPUT" | cut -f1))"
