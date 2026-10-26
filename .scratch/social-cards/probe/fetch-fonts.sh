#!/usr/bin/env bash
# Fetch the Design's two webfonts for the ticket-02 probe.
#
# Two shapes matter and they come from different places:
#
#   * static TTF, one instance per weight — what `fonts.googleapis.com/css2`
#     serves a legacy UA. This is the shape Satori definitely accepts.
#   * variable TTF (a real wght axis), from the google/fonts repo. Google Fonts'
#     CSS API will not serve a variable TTF to any UA; it serves a variable
#     *woff2*, which Satori cannot read.
#
# Run: bash .scratch/social-cards/probe/fetch-fonts.sh
set -uo pipefail
cd "$(dirname "$0")"
mkdir -p fonts

fetch_static() {
  local family="$1" out="$2" weight="$3" url
  url=$(curl -s "https://fonts.googleapis.com/css2?family=${family}:wght@${weight}" \
    -H "User-Agent: Mozilla/4.0" --max-time 20 | grep -o 'https://[^)]*\.ttf' | head -1)
  if [ -z "$url" ]; then echo "  MISS ${out}-${weight}" >&2; return 1; fi
  curl -s "$url" -o "fonts/${out}-${weight}.ttf" --max-time 30
  echo "  fonts/${out}-${weight}.ttf  $(wc -c <"fonts/${out}-${weight}.ttf") bytes"
}

fetch_variable() {
  local url="$1" out="$2"
  curl -sL "$url" -o "fonts/${out}-var.ttf" --max-time 60
  local n; n=$(wc -c <"fonts/${out}-var.ttf")
  if [ "$n" -lt 20000 ]; then echo "  MISS ${out}-var (${n} bytes)" >&2; rm -f "fonts/${out}-var.ttf"; return 1; fi
  echo "  fonts/${out}-var.ttf  ${n} bytes"
}

echo "static TTF (one instance per weight) — the shape Satori definitely accepts:"
for w in 300 400 500 700; do fetch_static "Space+Grotesk" SpaceGrotesk "$w"; done
for w in 400 700; do fetch_static "JetBrains+Mono" JetBrainsMono "$w"; done

echo "variable TTF (a real wght axis) — needed to test whether Satori uses it:"
fetch_variable \
  "https://github.com/google/fonts/raw/main/ofl/spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf" \
  SpaceGrotesk
fetch_variable \
  "https://github.com/google/fonts/raw/main/ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf" \
  JetBrainsMono