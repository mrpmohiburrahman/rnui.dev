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
#   ./scripts/check-video-codecs.sh demo/buttons        only Asset paths containing those fragments
#   ./scripts/check-video-codecs.sh --paths-from FILE   exactly the Asset paths listed in FILE
#
# --paths-from is how publish-assets.ts calls this: it resolves the list it is
# about to upload and hands that list over, so the gate inspects precisely what
# will be published. It used to pass its fragments instead and this script
# re-derived the selection, which is a disagreement waiting to happen — and one
# that fails silently in the dangerous direction, because a checker selecting
# fewer paths than the publisher still exits 0. The self-deriving modes above
# are untouched; the CI job runs --production with no list at all.
#
# The Asset list comes from the catalogue, never from the filesystem: once
# Staging copies leave the repo, CI has no Assets on disk, and a check that
# walks an empty directory reports "all 0 Assets are fine" — a vacuous green.
#
# Exits non-zero if any Asset is unplayable, unreachable, or served without the
# immutable cache header. Requires ffprobe (brew install ffmpeg).

set -uo pipefail
CALLER_PWD=$PWD
cd "$(dirname "$0")/.." || exit 1

CACHE_CONTROL="public, max-age=31536000, immutable"
PROD=0
PREFIXES=()
PATHS_FILE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --production) PROD=1 ;;
    --paths-from)
      shift
      # A missing value must not read as a missing flag. Defaulting to the empty
      # string here would silently widen the run to the whole catalogue and exit
      # 0 over a set nobody asked for — the failure this flag exists to prevent.
      if [ $# -eq 0 ]; then
        echo "--paths-from needs a FILE" >&2
        exit 1
      fi
      PATHS_FILE="$1"
      ;;
    *) PREFIXES+=("$1") ;;
  esac
  shift
done

if [ -n "$PATHS_FILE" ]; then
  # Arguments are parsed after the cd above, so resolve a relative path against
  # the directory the caller actually stood in rather than the repo root.
  case "$PATHS_FILE" in /*) ;; *) PATHS_FILE="$CALLER_PWD/$PATHS_FILE" ;; esac
  if [ ! -f "$PATHS_FILE" ]; then
    echo "--paths-from: no such file: $PATHS_FILE" >&2
    exit 1
  fi
  if [ ${#PREFIXES[@]} -gt 0 ]; then
    echo "--paths-from is a resolved list; it cannot be narrowed further by ${PREFIXES[*]}" >&2
    exit 1
  fi
fi

if ! command -v ffprobe >/dev/null 2>&1; then
  echo "ffprobe not found — install ffmpeg (brew install ffmpeg)" >&2
  exit 1
fi

# Narrow the catalogue's Asset paths to the ones this run is about to inspect.
#
# With --paths-from, the selection was already made by the caller and this is a
# whole-line intersection, not a rule — which is the point: there is no second
# derivation here that could disagree with the publisher's. The kind split still
# comes from asset-paths.ts, so this script never restates the demo/ and
# thumbnails/ prefixes.
#
# Without it, fragments are matched as substrings, so `misc` selects both
# demo/misc and thumbnails/misc. That mode is for a human at a terminal; the
# publish gate no longer uses it.
select_paths() {
  if [ -n "$PATHS_FILE" ]; then grep -Fx -f "$PATHS_FILE" || true; return; fi
  if [ ${#PREFIXES[@]} -eq 0 ]; then cat; return; fi
  local args=()
  for p in "${PREFIXES[@]}"; do args+=(-e "$p"); done
  grep -F "${args[@]}" || true
}

all_demos=$(pnpm exec tsx scripts/asset-paths.ts demo) || exit 1
all_posters=$(pnpm exec tsx scripts/asset-paths.ts posters) || exit 1

# The catalogue must list both kinds of Asset. That is a fact about the
# catalogue rather than about this run, so it is asserted before any narrowing:
# a catalogue that stopped listing Posters is exactly what nobody would notice,
# and it would otherwise be checkable only on the one run that narrows nothing —
# which, now that the publish tool always supplies a list, no publish ever is.
if [ -z "$all_demos" ] || [ -z "$all_posters" ]; then
  echo "The catalogue lists no Demos or no Posters — refusing to report success over an empty set." >&2
  exit 1
fi

demos=$(printf '%s\n' "$all_demos" | select_paths)
posters=$(printf '%s\n' "$all_posters" | select_paths)
n_demos=$(printf '%s' "$demos" | grep -c . || true)
n_posters=$(printf '%s' "$posters" | grep -c . || true)

# "Exactly those, no more and no fewer." The intersection above can only lose
# paths, never invent them, so the one failure left to rule out is a supplied
# path the catalogue does not list — which would mean the caller and this script
# are reading different data, and the gate would quietly skip whatever it could
# not match.
if [ -n "$PATHS_FILE" ]; then
  unmatched=$(printf '%s\n%s\n' "$demos" "$posters" | grep . \
    | grep -Fxv -f - "$PATHS_FILE" || true)
  if [ -n "$unmatched" ]; then
    echo "Asset paths supplied by the caller that the catalogue does not list:" >&2
    echo "$unmatched" | sed 's/^/  /' >&2
    echo "Refusing to check a set that differs from the one being published." >&2
    exit 1
  fi
fi

# This run's own selection must be non-empty too. Here it is the total that
# matters and not each kind: a narrowed run is deliberately a subset, and one
# kind alone is normal when a Category gains a Demo but no new Poster.
if [ $((n_demos + n_posters)) -eq 0 ]; then
  echo "No Assets in the catalogue match this run ($n_demos Demos, $n_posters Posters)." >&2
  [ ${#PREFIXES[@]} -gt 0 ] && echo "Fragments: ${PREFIXES[*]}" >&2
  [ -n "$PATHS_FILE" ] && echo "Supplied list: $PATHS_FILE" >&2
  echo "Refusing to report success over an empty set." >&2
  exit 1
fi

fail=0

if [ "$PROD" = 0 ]; then
  # ── Staging copies ────────────────────────────────────────────────────────
  # Every referenced Asset must be on disk, every Demo must be H.264 — the only
  # codec every browser decodes — and every Poster must be AVIF. This is what
  # the publish tool runs before it uploads anything.

  # `grep .` drops the blank line printf leaves when a narrowed run selects
  # only one kind of Asset — without it an empty set reads as a missing file.
  missing=$(printf '%s\n%s\n' "$demos" "$posters" | grep . \
    | while read -r p; do [ -f "public/$p" ] || echo "$p"; done)
  if [ -n "$missing" ]; then
    echo "Assets referenced by the catalogue with no Staging copy on disk:"
    echo "$missing" | sed 's/^/  /'
    fail=1
  fi

  # Which of the Asset paths on stdin do not decode as the codec named in $1.
  #
  # Format is a property of the bytes, so this is the only place either kind can
  # be established — the data suite can see that a path ends in .avif, which a
  # JPG written under that name satisfies, and that is exactly the file the
  # documented Poster command used to produce.
  #
  # A file ffprobe cannot parse at all reads back as nothing, hence the default:
  # an unreadable Asset is reported rather than passed over.
  wrong_codec() {
    xargs -P 8 -I{} sh -c '
        f="public/$1"; [ -f "$f" ] || exit 0
        c=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "$f" | head -1)
        [ "$c" = "$2" ] || echo "${c:-unreadable}	$1"' _ {} "$1"
  }

  bad_codec=$(printf '%s\n' "$demos" | grep . | wrong_codec h264)
  if [ -n "$bad_codec" ]; then
    echo "Demos that are not H.264 — browsers without that codec show nothing:"
    echo "$bad_codec" | sed 's/^/  /'
    echo
    echo "  Fix: ffmpeg -i IN.mp4 -c:v libx264 -profile:v high -pix_fmt yuv420p \\"
    echo "         -crf 21 -preset slow -movflags +faststart -c:a aac -b:a 96k OUT.mp4"
    fail=1
  fi

  # An AVIF's video stream decodes as av1; a JPG under an .avif name reads back
  # as mjpeg, which is how the old Poster command's output got this far.
  #
  # The fix points at the generator rather than repeating its ffmpeg flags. The
  # encode settings live in scripts/generate-posters.ts and are the kind of
  # restatement that would diverge silently — unlike the cache instruction and
  # the extension set this script does restate, both of which fail loudly.
  bad_poster_codec=$(printf '%s\n' "$posters" | grep . | wrong_codec av1)
  if [ -n "$bad_poster_codec" ]; then
    echo "Posters that are not AVIF — the catalogue and its data suite accept nothing else:"
    echo "$bad_poster_codec" | sed 's/^/  /'
    echo
    echo "  Fix: delete them and run pnpm posters:generate, which re-encodes each"
    echo "  one as AVIF from its Demo."
    fail=1
  fi

  # Filenames must be pure ASCII. macOS stores them decomposed (NFD) while the
  # data/*.ts strings are composed (NFC); byte-exact object storage 404s on the
  # mismatch, and macOS itself is normalization-insensitive so `[ -f ]` above
  # cannot see it. So this is the one check that reads the filesystem instead of
  # the catalogue, deliberately — the catalogue's own strings are already
  # asserted printable-ASCII by the data suite, and re-reading them here would
  # inspect the wrong bytes entirely and see nothing.
  #
  # Walked per Category directory of the selected Assets rather than over all of
  # public/, so that a stray file somewhere else cannot abort a narrowed publish.
  # LC_ALL=C + a printable-ASCII class, because BSD grep has no -P.
  bad_name=$(printf '%s\n%s\n' "$demos" "$posters" | grep . | sed 's|/[^/]*$||' | sort -u \
    | while read -r d; do
        find "public/$d" -type f \( -name '*.mp4' -o -name '*.avif' \) 2>/dev/null
      done | LC_ALL=C grep '[^ -~]' || true)
  if [ -n "$bad_name" ]; then
    echo "Asset filenames with non-ASCII characters — these 404 on byte-exact hosts:"
    echo "$bad_name" | sed 's/^/  /'
    fail=1
  fi

  [ "$fail" = 0 ] && echo "All $n_demos Demos are H.264 and all $n_posters Posters are present and AVIF, with ASCII filenames."
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
