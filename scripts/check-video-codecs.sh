#!/usr/bin/env bash
#
# Guard against demo videos that browsers can't play.
#
# Why this exists: 221 of the demo clips were HEVC/H.265. Safari plays that,
# Chrome only with a hardware decoder, Firefox only when media.hevc.enabled is
# on. Anyone without a decoder saw a black card and no error. Nothing in the
# test suite could catch it, because the defect lives in binary assets rather
# than in code — so it lives here instead.
#
#   ./scripts/check-video-codecs.sh              local files only (fast, offline, CI)
#   ./scripts/check-video-codecs.sh --production also check what the CDN delivers
#
# Exits non-zero if any video is unplayable. Requires ffprobe (brew install ffmpeg).

set -uo pipefail
cd "$(dirname "$0")/.."

DIR="public/demo"
PROD=0
[ "${1:-}" = "--production" ] && PROD=1

if ! command -v ffprobe >/dev/null 2>&1; then
  echo "ffprobe not found — install ffmpeg (brew install ffmpeg)" >&2
  exit 1
fi

fail=0

# 1. Every local video must be H.264, the only codec every browser decodes.
bad_codec=$(find "$DIR" -name '*.mp4' -print0 \
  | xargs -0 -P 8 -I{} sh -c 'c=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "$1" | head -1); [ "$c" = "h264" ] || echo "$c	$1"' _ {})

if [ -n "$bad_codec" ]; then
  echo "Videos that are not H.264 — browsers without that codec show nothing:"
  echo "$bad_codec" | sed 's/^/  /'
  echo
  echo "  Fix: ffmpeg -i IN.mp4 -c:v libx264 -profile:v high -pix_fmt yuv420p \\"
  echo "         -crf 21 -preset slow -movflags +faststart -c:a aac -b:a 96k OUT.mp4"
  fail=1
fi

# 2. Filenames must be pure ASCII. macOS stores them decomposed (NFD) while the
# data/*.ts strings are composed (NFC); byte-exact servers 404 on the mismatch.
# LC_ALL=C + a printable-ASCII class, because BSD grep has no -P
bad_name=$(find public -type f \( -name '*.mp4' -o -name '*.avif' \) | LC_ALL=C grep '[^ -~]' || true)
if [ -n "$bad_name" ]; then
  echo "Asset filenames with non-ASCII characters — these 404 on byte-exact hosts:"
  echo "$bad_name" | sed 's/^/  /'
  fail=1
fi

# 3. Optional: what the CDN actually hands a browser can differ from the file
# on disk, so check the delivered bytes too.
if [ "$PROD" = 1 ]; then
  EP=$(grep -h NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT .env.local .env 2>/dev/null \
       | head -1 | cut -d= -f2- | tr -d '"'"'"' ')
  if [ -z "$EP" ]; then
    echo "NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT not set — skipping the production check" >&2
  else
    echo "Checking delivered codec at $EP ..."
    tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
    bad_remote=$(find "$DIR" -name '*.mp4' -print0 \
      | xargs -0 -P 8 -I{} sh -c '
          rel="${1#public/}"
          out="$2/$(echo "$rel" | tr "/" "_")"
          code=$(curl -s --max-time 60 -o "$out" -w "%{http_code}" "$3/$rel")
          if [ "$(wc -c <"$out")" -lt 200 ]; then echo "HTTP $code	$rel"; else
            c=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "$out" | head -1)
            [ "$c" = "h264" ] || echo "$c	$rel"
          fi
          rm -f "$out"' _ {} "$tmp" "$EP")
    if [ -n "$bad_remote" ]; then
      echo "CDN is serving unplayable or missing videos:"
      echo "$bad_remote" | sed 's/^/  /'
      echo
      echo "  The CDN keeps its own copy — re-upload after changing a local file."
      fail=1
    fi
  fi
fi

if [ "$fail" = 0 ]; then
  echo "All $(find "$DIR" -name '*.mp4' | wc -l | tr -d ' ') demo videos are H.264 with ASCII filenames."
fi
exit $fail
