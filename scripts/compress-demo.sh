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

# CRF 28 + slow + -tune animation, and the numbers behind it.
#
# These were measured, not guessed. Four Device-Hub screen captures re-encoded
# both ways and scored against their own source frames:
#
#   file                 CRF 20    CRF 28+anim   saving    dY-SSIM   dPSNR
#   sphere-waves        30.8 MB       11.5 MB     2.68x    -0.0014  -0.10 dB
#   the-little-prince   2.8 MB        1.7 MB     1.65x    -0.0017  -0.12 dB
#   qrcode               4.1 MB        1.8 MB     2.28x    -0.0015  -0.20 dB
#   light-on-painting    5.0 MB        1.6 MB     3.24x    -0.0038  -0.45 dB
#
# So CRF 28 buys 1.7x-3.2x for a quality change far under the threshold of
# visibility: SSIM moves by less than 0.004 and PSNR by less than half a dB.
# -tune animation is what makes the higher CRF affordable - it stops x264
# spending bits on temporal smoothing that hard-edged UI never wants, and at
# matched CRF it returns slightly *better* SSIM for ~4% more bytes.
#
# The honest limit of this: nothing here is mathematically lossless. SSIM on
# screen content has a floor around 0.98 even at CRF 20, because fine text and
# QR-module edges are what SSIM charges for. So no CRF reaches 0.99 on this
# material, and the table above is the real argument, not a threshold.
#
# Independent check: CRF 28 lands at ~3.1 Mbps, which is where the
# already-published cherry_blossom_qr_v2 sits (3.07 Mbps) - a Demo the
# maintainer has already accepted on the live site.
#
# yuv420p because Chrome refuses yuv444. Even-dimension scale because x264
# aborts on the odd heights screen crops produce. -fps_mode passthrough
# because `simctl io recordVideo` writes a frame only when the screen changes,
# so the source is variable frame rate - 24.8 to 80.2 fps across this batch -
# and forcing a constant -r would either drop real motion on the fast ones or
# invent duplicate frames on the slow ones. +faststart so the CDN can stream
# the first frame before the upload finishes downloading. Audio kept (AAC)
# when present; harmless when absent.
ffmpeg -y -v error \
  -i "$INPUT" \
  -c:v libx264 -crf 28 -preset slow -tune animation \
  -pix_fmt yuv420p \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
  -fps_mode passthrough \
  -movflags +faststart \
  -c:a aac -b:a 128k \
  "$OUTPUT"

CODEC=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "$OUTPUT" | head -1)
if [ "$CODEC" != "h264" ]; then
  echo "transcode produced codec $CODEC, expected h264 — refusing $OUTPUT" >&2
  exit 1
fi

echo "staged $OUTPUT ($(du -h "$OUTPUT" | cut -f1))"
