#!/usr/bin/env bash
#
# Guard against Assets that browsers can't play or servers can't find.
#
# Why this exists: 221 of the Demos were HEVC/H.265. Safari plays that, Chrome
# only with a hardware decoder, Firefox only when media.hevc.enabled is on.
# Anyone without a decoder saw a black card and no error. Nothing in the test
# suite could catch it, because the defect lives in binary Assets rather than in
# code — so it lives here instead.
#
#   ./scripts/check-video-codecs.sh                     Staging copies (offline; the pre-upload gate)
#   ./scripts/check-video-codecs.sh --production        what the CDN actually delivers (CI)
#   ./scripts/check-video-codecs.sh demo/buttons        only Asset paths under those prefixes
#
# The Asset list comes from the catalogue, never from the filesystem: once
# Staging copies leave the repo, CI has no Assets on disk, and a check that
# walks an empty directory reports "all 0 Assets are fine" — a vacuous green.
#
# Exits non-zero if any Asset is unplayable, unreachable, or served without the
# immutable cache header. Requires ffprobe (brew install ffmpeg).

set -uo pipefail
cd "$(dirname "$0")/.."

CACHE_CONTROL="public, max-age=31536000, immutable"
PROD=0
PREFIXES=()
for arg in "$@"; do
  if [ "$arg" = "--production" ]; then PROD=1; else PREFIXES+=("$arg"); fi
done

if ! command -v ffprobe >/dev/null 2>&1; then
  echo "ffprobe not found — install ffmpeg (brew install ffmpeg)" >&2
  exit 1
fi

# Keep only Asset paths containing one of the requested fragments; no fragment
# means all. Substring, not prefix, so `misc` selects both demo/misc and
# thumbnails/misc — and so this matches publish-assets.ts exactly. The two must
# agree, or the gate would demand Staging copies the publish never touches.
select_paths() {
  if [ ${#PREFIXES[@]} -eq 0 ]; then cat; return; fi
  local args=()
  for p in "${PREFIXES[@]}"; do args+=(-e "$p"); done
  grep -F "${args[@]}" || true
}

demos=$(pnpm exec tsx scripts/asset-paths.ts demo | select_paths) || exit 1
posters=$(pnpm exec tsx scripts/asset-paths.ts posters | select_paths) || exit 1
n_demos=$(printf '%s' "$demos" | grep -c . || true)
n_posters=$(printf '%s' "$posters" | grep -c . || true)

# An empty Asset set is a failure, not a success. Silence here would mean the
# catalogue stopped listing Assets, which is exactly what nobody would notice.
#
# With no prefix this is the whole catalogue, so both kinds must be present —
# that is the CI case, and a missing kind is the vacuous green. With a prefix
# the caller has deliberately narrowed the set, and one kind alone is normal, so
# only a total of zero is a failure.
if [ ${#PREFIXES[@]} -eq 0 ]; then
  empty=$([ "$n_demos" = 0 ] || [ "$n_posters" = 0 ] && echo 1 || echo 0)
else
  empty=$([ $((n_demos + n_posters)) = 0 ] && echo 1 || echo 0)
fi
if [ "$empty" = 1 ]; then
  echo "No Assets found in the catalogue ($n_demos Demos, $n_posters Posters)." >&2
  [ ${#PREFIXES[@]} -gt 0 ] && echo "Prefixes: ${PREFIXES[*]}" >&2
  echo "Refusing to report success over an empty set." >&2
  exit 1
fi

fail=0

if [ "$PROD" = 0 ]; then
  # ── Staging copies ────────────────────────────────────────────────────────
  # Every referenced Asset must be on disk, and every Demo must be H.264 — the
  # only codec every browser decodes. This is what the publish tool runs before
  # it uploads anything.

  # `grep .` drops the blank line printf leaves when a narrowed run selects
  # only one kind of Asset — without it an empty set reads as a missing file.
  missing=$(printf '%s\n%s\n' "$demos" "$posters" | grep . \
    | while read -r p; do [ -f "public/$p" ] || echo "$p"; done)
  if [ -n "$missing" ]; then
    echo "Assets referenced by the catalogue with no Staging copy on disk:"
    echo "$missing" | sed 's/^/  /'
    fail=1
  fi

  bad_codec=$(printf '%s\n' "$demos" | grep . \
    | xargs -P 8 -I{} sh -c '
        f="public/$1"; [ -f "$f" ] || exit 0
        c=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "$f" | head -1)
        [ "$c" = "h264" ] || echo "$c	$1"' _ {})
  if [ -n "$bad_codec" ]; then
    echo "Demos that are not H.264 — browsers without that codec show nothing:"
    echo "$bad_codec" | sed 's/^/  /'
    echo
    echo "  Fix: ffmpeg -i IN.mp4 -c:v libx264 -profile:v high -pix_fmt yuv420p \\"
    echo "         -crf 21 -preset slow -movflags +faststart -c:a aac -b:a 96k OUT.mp4"
    fail=1
  fi

  # Filenames must be pure ASCII. macOS stores them decomposed (NFD) while the
  # data/*.ts strings are composed (NFC); byte-exact object storage 404s on the
  # mismatch, and macOS itself is normalization-insensitive so `[ -f ]` above
  # cannot see it. LC_ALL=C + a printable-ASCII class, because BSD grep has no -P.
  bad_name=$(find public -type f \( -name '*.mp4' -o -name '*.avif' \) | LC_ALL=C grep '[^ -~]' || true)
  if [ -n "$bad_name" ]; then
    echo "Asset filenames with non-ASCII characters — these 404 on byte-exact hosts:"
    echo "$bad_name" | sed 's/^/  /'
    fail=1
  fi

  [ "$fail" = 0 ] && echo "All $n_demos Demos are H.264 and all $n_posters Posters are present, with ASCII filenames."
else
  # ── Published Assets ──────────────────────────────────────────────────────
  # What the CDN hands a browser is the only thing users experience, so check
  # the delivered bytes and the delivered headers rather than the local file.

  EP="${NEXT_PUBLIC_CDN_URL:-}"
  [ -z "$EP" ] && EP=$(grep -h '^NEXT_PUBLIC_CDN_URL=' .env.local .env 2>/dev/null \
       | head -1 | cut -d= -f2- | tr -d '"'"'"' ')
  if [ -z "$EP" ]; then
    echo "NEXT_PUBLIC_CDN_URL is not set — cannot check what the CDN delivers." >&2
    exit 1
  fi
  EP="${EP%/}"
  echo "Checking $((n_demos + n_posters)) Published Assets at $EP ..."

  tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
  export CACHE_CONTROL

  # Demos: full download, because the codec is a property of the bytes and the
  # CDN is the only place the delivered bytes can be observed.
  bad_demo=$(printf '%s\n' "$demos" | grep . \
    | xargs -P 8 -I{} sh -c '
        body="$2/$(echo "$1" | tr "/" "_")"; head="$body.h"
        code=$(curl -sS --max-time 120 -D "$head" -o "$body" -w "%{http_code}" "$3/$1")
        if [ "$code" != 200 ]; then echo "HTTP $code	$1"
        else
          cc=$(tr -d "\r" < "$head" | grep -i "^cache-control:" | head -1 | cut -d: -f2- | sed "s/^ *//")
          [ "$cc" = "$CACHE_CONTROL" ] || echo "cache-control \"$cc\"	$1"
          c=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "$body" | head -1)
          [ "$c" = "h264" ] || echo "codec $c	$1"
        fi
        rm -f "$body" "$head"' _ {} "$tmp" "$EP")

  # Posters: headers only. They are the larger share of per-pageload traffic, so
  # reachability and the cache header are what matter; nothing re-encodes AVIF.
  bad_poster=$(printf '%s\n' "$posters" | grep . \
    | xargs -P 8 -I{} sh -c '
        head="$2/$(echo "$1" | tr "/" "_").h"
        code=$(curl -sS --max-time 60 -I -D "$head" -o /dev/null -w "%{http_code}" "$3/$1")
        if [ "$code" != 200 ]; then echo "HTTP $code	$1"
        else
          cc=$(tr -d "\r" < "$head" | grep -i "^cache-control:" | head -1 | cut -d: -f2- | sed "s/^ *//")
          [ "$cc" = "$CACHE_CONTROL" ] || echo "cache-control \"$cc\"	$1"
        fi
        rm -f "$head"' _ {} "$tmp" "$EP")

  if [ -n "$bad_demo" ] || [ -n "$bad_poster" ]; then
    echo "The CDN is serving Assets that are missing, unplayable, or uncacheable:"
    printf '%s\n%s\n' "$bad_demo" "$bad_poster" | grep . | sed 's/^/  /'
    echo
    echo "  Expected Cache-Control: $CACHE_CONTROL"
    echo "  Assets are published once and never overwritten — see docs/adr/0003-asset-paths-are-immutable.md"
    fail=1
  else
    echo "All $n_demos Demos decode as H.264 and all $n_posters Posters are reachable, every object immutable for a year."
  fi
fi

exit $fail
