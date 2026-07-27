#!/usr/bin/env bash
# commit.sh — generate a commit message with a cheap CommandCode model, then commit.
#
# Ladder:  xiaomi/mimo-v2.5-pro  ->  deepseek/deepseek-v4-pro  ->  caller (Claude) or rule-based.
# Every AI attribution trailer is stripped before the message is written, so the repo's
# commit-msg hook never has to reject us.
#
# Runs two ways off the same code:
#   * real terminal  -> interactive menus, 3s countdown before saving
#   * non-interactive (Claude Code, CI, tests) -> prints a plan and exits 5 for the caller to drive
#
# Exit codes (stable — tests and the SKILL.md depend on these):
#   0  committed
#   1  unexpected error
#   2  nothing to commit
#   3  blocked: repo is mid-merge/rebase/cherry-pick/revert, or has conflicts
#   4  blocked: possible secret in the staged changes
#   5  needs input from the caller — a plan was written to .git/commit-skill/
#   6  every model failed; caller should write the message itself
set -uo pipefail

SELF="$(basename "$0")"

# ── tunables ───────────────────────────────────────────────────────────────────
MODELS=("xiaomi/mimo-v2.5-pro" "deepseek/deepseek-v4-pro")
MODEL_TIMEOUT="${COMMIT_MODEL_TIMEOUT:-60}"
COUNTDOWN="${COMMIT_COUNTDOWN:-3}"
DIFF_BUDGET="${COMMIT_DIFF_BUDGET:-60000}"   # chars of diff shipped to the model
STYLE_SAMPLE=10                               # recent subjects shown as style reference
CC_BIN="${COMMANDCODE_BIN:-commandcode}"

# Machine-generated files: committed, but never described to the model — they are noise
# that drowns the real change. ponytail: plain glob list, move to a config file if it grows.
GENERATED_GLOBS=(
  '*.lock' 'package-lock.json' 'pnpm-lock.yaml' 'yarn.lock' 'bun.lockb'
  'public/sitemap*.xml' 'public/robots.txt'
  'data/changedItems.json' 'scripts/lastCommitDate.json'
  '*.min.js' '*.min.css' 'dist/*' 'build/*' '.next/*'
)

# ── args ───────────────────────────────────────────────────────────────────────
MODE=commit
ASSUME_YES=0
ALLOW_SECRETS=0
DRY_RUN=0
PICK=""
MSG_FILE=""
WHY=""

usage() {
  cat <<EOF
$SELF — commit with a message written by a cheap model

  $SELF [split|amend|undo] [options]

modes
  (none)            one commit from what is staged
  split             group the changes by topic, one commit per group
  amend             rewrite the message on HEAD (refuses if HEAD is already pushed)
  undo              rewind to before the last run of this script (git reset --soft)

options
  -y, --yes             don't ask before committing
  --allow-secrets       commit even if the secret scan fires
  --pick "1 3 5-7"      choose files from the menu without a terminal ("all" / "none" also work)
  --message-file FILE   use this message verbatim, skip the model entirely
  --why "one line"      why this change exists; the single biggest quality lever
  --dry-run             do everything except the commit
  --no-color            plain output
  -h, --help
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    split|amend|undo)  MODE="$1" ;;
    -y|--yes)          ASSUME_YES=1 ;;
    --allow-secrets)   ALLOW_SECRETS=1 ;;
    --dry-run)         DRY_RUN=1 ;;
    --pick)            PICK="${2:-}"; shift ;;
    --pick=*)          PICK="${1#*=}" ;;
    --message-file)    MSG_FILE="${2:-}"; shift ;;
    --message-file=*)  MSG_FILE="${1#*=}" ;;
    --why)             WHY="${2:-}"; shift ;;
    --why=*)           WHY="${1#*=}" ;;
    --no-color)        NO_COLOR=1 ;;
    -h|--help)         usage; exit 0 ;;
    *) printf 'unknown argument: %s\n\n' "$1" >&2; usage >&2; exit 1 ;;
  esac
  shift
done

# ── output helpers ─────────────────────────────────────────────────────────────
if [ -t 2 ] && [ -z "${NO_COLOR:-}" ]; then
  C_RED=$'\033[31m'; C_YEL=$'\033[33m'; C_DIM=$'\033[2m'; C_OFF=$'\033[0m'
else
  C_RED=""; C_YEL=""; C_DIM=""; C_OFF=""
fi
say()  { printf '%s\n' "$*" >&2; }
# macOS ships no timeout(1), so fall back to a watchdog. A cutoff is not optional here:
# CommandCode has no request timeout of its own, and a hung request would hang the commit.
if   command -v timeout  >/dev/null 2>&1; then TIMEOUT_CMD=timeout
elif command -v gtimeout >/dev/null 2>&1; then TIMEOUT_CMD=gtimeout
else TIMEOUT_CMD=""
fi
with_timeout() {
  local secs="$1"; shift
  if [ -n "$TIMEOUT_CMD" ]; then "$TIMEOUT_CMD" "$secs" "$@"; return $?; fi
  # <&0 is load-bearing: bash points an async job's stdin at /dev/null unless the job has an
  # explicit redirection, which would hand CommandCode an empty prompt.
  "$@" <&0 & local pid=$!
  ( sleep "$secs"; kill -TERM "$pid" 2>/dev/null ) & local wd=$!
  wait "$pid"; local rc=$?
  kill -TERM "$wd" 2>/dev/null; wait "$wd" 2>/dev/null
  [ "$rc" -eq 143 ] && rc=124      # killed by the watchdog — report it as timeout(1) would
  return "$rc"
}
note() { printf '%s%s%s\n' "$C_DIM" "$*" "$C_OFF" >&2; }
warn() { printf '%s%s%s\n' "$C_YEL" "$*" "$C_OFF" >&2; }
die()  { printf '%s%s%s\n' "$C_RED" "$*" "$C_OFF" >&2; exit "${2:-1}"; }
interactive() { [ -t 0 ] && [ -t 2 ]; }

# ── repo preflight ─────────────────────────────────────────────────────────────
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "not a git repository" 1
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT" || die "cannot cd to repo root" 1

STATE_DIR="$(git rev-parse --git-dir)/commit-skill"
mkdir -p "$STATE_DIR"
PLAN="$STATE_DIR/plan"
UNDO_REF="$STATE_DIR/undo"

HAS_HEAD=0; git rev-parse --verify -q HEAD >/dev/null 2>&1 && HAS_HEAD=1
GIT_DIR="$(git rev-parse --git-dir)"

# ── mode: undo ─────────────────────────────────────────────────────────────────
if [ "$MODE" = undo ]; then
  [ -s "$UNDO_REF" ] || die "no undo point recorded — nothing this script committed to rewind" 2
  target="$(cat "$UNDO_REF")"
  if [ "$target" = "__ROOT__" ]; then
    # The undone commit was the repo's first; there is no parent to reset to.
    git update-ref -d HEAD || die "failed to remove HEAD" 1
    say "rewound to an empty repo; every change is staged and intact"
  else
    git rev-parse --verify -q "$target^{commit}" >/dev/null 2>&1 \
      || die "recorded undo point $target no longer exists" 1
    git reset --soft "$target" || die "git reset --soft $target failed" 1
    say "rewound to $target — every change is staged and intact"
  fi
  rm -f "$UNDO_REF"
  exit 0
fi

# ── repo state gate ────────────────────────────────────────────────────────────
# In-progress sequences: committing by hand here corrupts the sequence, so refuse
# and print the command that actually belongs in that state.
if [ -d "$GIT_DIR/rebase-merge" ] || [ -d "$GIT_DIR/rebase-apply" ]; then
  die "rebase in progress — finish it first:  git rebase --continue   (or --abort)" 3
fi
if [ -f "$GIT_DIR/CHERRY_PICK_HEAD" ]; then
  die "cherry-pick in progress — finish it first:  git cherry-pick --continue   (or --abort)" 3
fi
if [ -f "$GIT_DIR/REVERT_HEAD" ]; then
  die "revert in progress — finish it first:  git revert --continue   (or --abort)" 3
fi

CONFLICTS="$(git diff --name-only --diff-filter=U 2>/dev/null)"
if [ -n "$CONFLICTS" ]; then
  say "${C_RED}unresolved conflicts — cannot commit:${C_OFF}"
  printf '  %s\n' $CONFLICTS >&2
  say ""
  say "resolve them, then re-run. Claude Code has a /resolving-merge-conflicts skill for this."
  exit 3
fi

MERGING=0; [ -f "$GIT_DIR/MERGE_HEAD" ] && MERGING=1

# Detached HEAD: legitimate, but a commit made here is easy to lose forever.
if [ "$HAS_HEAD" = 1 ] && ! git symbolic-ref -q HEAD >/dev/null 2>&1; then
  warn "detached HEAD — a commit made here is not on any branch and is easy to lose."
  if [ "$ASSUME_YES" = 1 ]; then
    note "  --yes given, continuing"
  elif interactive; then
    printf 'type "yes" to commit anyway: ' >&2
    read -r ans
    [ "$ans" = "yes" ] || die "cancelled" 1
  else
    {
      echo "STATUS: detached-head"
      echo "HEAD is not on a branch. Re-run with -y to commit anyway, or checkout a branch first."
    } > "$PLAN"
    say "detached HEAD — re-run with -y to confirm, or 'git switch -c <branch>' first"
    exit 5
  fi
fi

# ── mode: amend ────────────────────────────────────────────────────────────────
if [ "$MODE" = amend ]; then
  [ "$HAS_HEAD" = 1 ] || die "no commits yet — nothing to amend" 2
  if [ -n "$(git branch -r --contains HEAD 2>/dev/null)" ]; then
    die "HEAD is already pushed — amending it rewrites published history. Make a new commit instead." 3
  fi
fi

# ── helpers ────────────────────────────────────────────────────────────────────
is_generated() {
  local f="$1" g
  for g in "${GENERATED_GLOBS[@]}"; do
    # shellcheck disable=SC2053
    [[ "$f" == $g ]] && return 0
    [[ "$f" == */$g ]] && return 0
  done
  return 1
}

# Expand "all" / "none" / "1 3 5-7" against $1 = total count. Echoes indices, one per line.
parse_pick() {
  local spec="$1" total="$2" tok a b i
  case "$spec" in
    all|ALL|"") seq 1 "$total"; return 0 ;;
    none|NONE)  return 0 ;;
  esac
  for tok in $spec; do
    case "$tok" in
      *-*) a="${tok%%-*}"; b="${tok##*-}"
           [[ "$a" =~ ^[0-9]+$ && "$b" =~ ^[0-9]+$ ]] || { echo "BAD:$tok" ; return 1; }
           [ "$a" -ge 1 ] && [ "$b" -le "$total" ] && [ "$a" -le "$b" ] || { echo "BAD:$tok"; return 1; }
           for ((i=a; i<=b; i++)); do echo "$i"; done ;;
      *)   [[ "$tok" =~ ^[0-9]+$ ]] || { echo "BAD:$tok"; return 1; }
           [ "$tok" -ge 1 ] && [ "$tok" -le "$total" ] || { echo "BAD:$tok"; return 1; }
           echo "$tok" ;;
    esac
  done
}

# Every AI attribution shape the repo's commit-msg hook rejects, removed at the source.
# Patterns mirror ~/.claude/skills/no-ai-coauthor/templates/commit-msg — keep them in sync.
strip_trailers() {
  local names='claude|copilot|cursor|aider|codex|windsurf|codeium|devin|jules|gemini|commandcode|hermes'
  local emails='noreply@anthropic\.com|cursoragent@cursor\.com|aider@aider\.chat|codex@openai\.com|[0-9]*\+?copilot@users\.noreply\.github\.com|copilot@github\.com|noreply@commandcode\.ai|hermes@|noreply@hermes-agent\.local'
  sed -E \
    -e "/^[[:space:]]*[Cc]o-[Aa]uthored-[Bb]y:[[:space:]]*(${names})/Id" \
    -e "/^[[:space:]]*[Cc]o-[Aa]uthored-[Bb]y:.*(${emails})/Id" \
    -e "/(🤖[[:space:]]*)?[Gg]enerated with (\[)?(Claude Code|Cursor|[Aa]ider|Codex|Copilot|CommandCode|Hermes)/Id" \
    -e "/^[[:space:]]*[Mm]ade-with:[[:space:]]*[Cc]ursor/Id" \
  | awk 'BEGIN{blank=0} {if ($0 ~ /^[[:space:]]*$/) {blank++} else {blank=0}} blank<2' \
  | sed -e :a -e '/^\n*$/{$d;N;};/\n$/ba'
}

# Secret shapes worth blocking. Deliberately conservative on the generic rule — the
# --allow-secrets override exists because this WILL false-positive on test fixtures.
SECRET_PATTERNS=(
  'AKIA[0-9A-Z]{16}'
  'ASIA[0-9A-Z]{16}'
  '\bsk-[A-Za-z0-9_-]{20,}'
  '\bgh[pousr]_[A-Za-z0-9]{20,}'
  '\bgithub_pat_[A-Za-z0-9_]{20,}'
  '\bxox[baprs]-[A-Za-z0-9-]{10,}'
  '\bAIza[0-9A-Za-z_-]{30,}'
  '-----BEGIN [A-Z ]*PRIVATE KEY-----'
  '\bey[JI][A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.'
  '(password|passwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token)[[:space:]]*[:=][[:space:]]*["'"'"'][^"'"'"']{8,}["'"'"']'
)
SECRET_PATH_RE='(^|/)\.env($|\.[A-Za-z0-9_.-]+$)|(^|/)id_(rsa|dsa|ecdsa|ed25519)$|\.pem$|\.p12$|\.pfx$|(^|/)credentials(\.json)?$'

scan_secrets() {  # $1 = file listing paths, $2 = file holding the diff
  local paths="$1" diff="$2" hits="" p pat
  while IFS= read -r p; do
    [ -n "$p" ] || continue
    printf '%s' "$p" | grep -qEi -e "$SECRET_PATH_RE" && hits+="  ${p}  (secret-bearing filename)"$'\n'
  done < "$paths"
  for pat in "${SECRET_PATTERNS[@]}"; do
    while IFS= read -r line; do
      [ -n "$line" ] && hits+="  ${line}"$'\n'
    done < <(grep -nEi -e "$pat" "$diff" 2>/dev/null | grep '^[0-9]*:+' | head -3 | cut -c1-160)
  done
  printf '%s' "$hits"
}

# ── build the change set ───────────────────────────────────────────────────────
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

staged_paths() { git diff --cached --name-only; }

if [ "$MODE" = amend ]; then
  :   # amend describes HEAD's content, not the index
elif [ "$MERGING" = 1 ]; then
  :   # a merge commit's content is whatever git already staged
else
  if [ -z "$(staged_paths)" ]; then
    # Nothing picked. Offer everything changed, tracked and untracked.
    git -c core.quotepath=false status --porcelain --untracked-files=all \
      | grep -v '^!!' > "$TMP/cands" || true
    if [ ! -s "$TMP/cands" ]; then
      say "nothing to commit — working tree is clean"
      exit 2
    fi
    mapfile -t CAND < "$TMP/cands"
    TOTAL=${#CAND[@]}

    render_menu() {
      local i=1 c
      for c in "${CAND[@]}"; do
        printf '  %2d  %s\n' "$i" "$c" >&2; i=$((i+1))
      done
    }

    if [ -z "$PICK" ]; then
      if interactive; then
        say "nothing staged. $TOTAL change(s):"; say ""
        render_menu; say ""
        printf 'which? (all / 1 3 5 / 3-6 / none) > ' >&2
        read -r PICK
      else
        {
          echo "STATUS: needs-selection"
          echo "TOTAL: $TOTAL"
          printf '%s\n' "${CAND[@]}"
        } > "$PLAN"
        say "nothing staged. $TOTAL change(s):"; say ""
        render_menu; say ""
        say "re-run with:  $SELF --pick \"all\"   (or \"1 3 5\", \"3-6\", \"none\")"
        exit 5
      fi
    fi

    IDX="$(parse_pick "$PICK" "$TOTAL")" || die "bad selection: ${IDX}" 1
    printf '%s' "$IDX" | grep -q 'BAD:' && die "bad selection: $(printf '%s' "$IDX" | tr '\n' ' ')" 1
    [ -n "$IDX" ] || { say "nothing selected"; exit 2; }

    while IFS= read -r i; do
      [ -n "$i" ] || continue
      # porcelain line: XY<space>path ; rename shows "old -> new", keep the new side
      entry="${CAND[$((i-1))]}"
      path="${entry:3}"
      [[ "$path" == *" -> "* ]] && path="${path##* -> }"
      path="${path%\"}"; path="${path#\"}"
      git add -- "$path" || die "git add failed for: $path" 1
    done <<< "$IDX"
  fi

  [ -n "$(staged_paths)" ] || { say "nothing staged after selection"; exit 2; }
fi

# ── describe the change for the model ──────────────────────────────────────────
if [ "$MODE" = amend ]; then
  git show --name-status --format= HEAD > "$TMP/status" 2>/dev/null || true
  git show --format= HEAD > "$TMP/rawdiff" 2>/dev/null || true
  git show --name-only --format= HEAD > "$TMP/paths" 2>/dev/null || true
else
  git diff --cached --name-status > "$TMP/status"
  git diff --cached --name-only  > "$TMP/paths"
  : > "$TMP/rawdiff"
fi

# Secret scan runs on the real diff, before anything leaves the machine.
if [ "$MODE" != amend ]; then
  git diff --cached > "$TMP/rawdiff"
fi
if [ "$ALLOW_SECRETS" = 0 ]; then
  FOUND="$(scan_secrets "$TMP/paths" "$TMP/rawdiff")"
  if [ -n "$FOUND" ]; then
    say "${C_RED}BLOCKED — possible secret in the staged changes:${C_OFF}"
    say ""
    printf '%s' "$FOUND" >&2
    say ""
    say "nothing sent, nothing committed."
    say "fix the files, or override on purpose:  $SELF ${MODE#commit} --allow-secrets"
    exit 4
  fi
fi

# Split described files into new / edited / generated. New files need only their path —
# shipping 800 lines of a brand-new doc buries the 19 lines that actually matter.
: > "$TMP/new"; : > "$TMP/edited"; : > "$TMP/gen"
while IFS=$'\t' read -r st path rest; do
  [ -n "${path:-}" ] || continue
  [ "${st:0:1}" = "R" ] && path="${rest:-$path}"
  if is_generated "$path"; then echo "$path" >> "$TMP/gen"
  elif [ "${st:0:1}" = "A" ]; then echo "$path" >> "$TMP/new"
  else echo "${st:0:1} $path" >> "$TMP/edited"
  fi
done < "$TMP/status"

: > "$TMP/diff"
if [ -s "$TMP/edited" ]; then
  while read -r _ p; do
    if [ "$MODE" = amend ]; then git show --format= -- "$p"
    else git diff --cached -- "$p"; fi
  done < "$TMP/edited" > "$TMP/diff" 2>/dev/null
fi
DIFF_CHARS=$(wc -c < "$TMP/diff" | tr -d ' ')
TRUNCATED=0
if [ "$DIFF_CHARS" -gt "$DIFF_BUDGET" ]; then
  head -c "$DIFF_BUDGET" "$TMP/diff" > "$TMP/diff.cut" && mv "$TMP/diff.cut" "$TMP/diff"
  TRUNCATED=1
fi

BRANCH="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || echo '(detached)')"
if [ "$HAS_HEAD" = 1 ]; then
  git log -"$STYLE_SAMPLE" --pretty=%s > "$TMP/style" 2>/dev/null || : > "$TMP/style"
else
  : > "$TMP/style"
fi

# Guard the case where everything staged is machine-generated: there is genuinely
# nothing to describe, so say so rather than letting the model invent a story.
DESCRIBABLE=1
[ -s "$TMP/new" ] || [ -s "$TMP/edited" ] || DESCRIBABLE=0

# ── prompt ─────────────────────────────────────────────────────────────────────
build_prompt() {
  cat <<'RULES'
Write ONE git commit message for the change below. Output the message and nothing else:
no preamble, no explanation, no code fences, no quotes around it.

Format: <type>(<scope>): <imperative summary>
  types: feat fix refactor perf docs test chore build ci style revert
  scope optional, lowercase, the area touched
  subject <=50 chars if you can, 72 absolute max, no trailing period
Body: omit it when the subject already says everything. Add one only for a non-obvious
WHY, a breaking change, a migration, or a revert. Wrap at 72 chars, "-" bullets.
Never write: "This commit does X", "I"/"we", "as requested", emoji, or any AI attribution
or co-author line.
RULES
  echo
  echo "Branch: $BRANCH"
  [ -n "$WHY" ] && { echo; echo "Why this change exists (authoritative — use it):"; echo "  $WHY"; }
  if [ -s "$TMP/style" ]; then
    echo; echo "Recent commit subjects in this repo — match their style:"
    sed 's/^/  /' "$TMP/style"
  fi
  if [ -s "$TMP/new" ]; then
    echo; echo "New files (contents omitted — the path is the description):"
    sed 's/^/  + /' "$TMP/new"
  fi
  if [ -s "$TMP/edited" ]; then
    echo; echo "Edited files:"
    sed 's/^/  /' "$TMP/edited"
  fi
  if [ -s "$TMP/gen" ]; then
    echo; echo "Also committed but machine-generated — do NOT describe these:"
    sed 's/^/  ~ /' "$TMP/gen"
  fi
  if [ -s "$TMP/diff" ]; then
    echo; echo "Diff of edited files:"; echo '---'
    cat "$TMP/diff"
    [ "$TRUNCATED" = 1 ] && { echo; echo "[diff truncated at $DIFF_BUDGET chars]"; }
    echo '---'
  fi
}

# ── the model ladder ───────────────────────────────────────────────────────────
# CommandCode has NO request timeout of its own; timeout(1) is the only thing standing
# between a hung request and a permanently frozen commit. Verified in
# docs/research/commandcode-cli-headless.md.
run_model() {  # $1 = model id, $2 = prompt file ; echoes message, returns 0 on success
  local model="$1" pf="$2" rc
  local out="$TMP/model.out" err="$TMP/model.err"
  CI=1 with_timeout "$MODEL_TIMEOUT" "$CC_BIN" -p \
      --no-auto-update --skip-onboarding --max-turns 4 --model "$model" \
      < "$pf" > "$out" 2> "$err"
  rc=$?
  if [ "$rc" -eq 0 ] && [ -s "$out" ]; then cat "$out"; return 0; fi
  # The reason goes to a file, not a variable: callers invoke run_model inside a command
  # substitution, and a subshell's variables never reach the parent.
  explain_rc "$rc" "$err" > "$TMP/reason"
  return 1
}
reason() { cat "$TMP/reason" 2>/dev/null; }

explain_rc() {  # $1 = exit code, $2 = stderr file — codes from the research report
  case "$1" in
    3)   echo "not logged in — run: $CC_BIN login" ;;
    4)   echo "permission denied" ;;
    5)   echo "rate limited" ;;
    6)   echo "network unreachable" ;;
    7)   echo "CommandCode API is down (5xx)" ;;
    8)   echo "hit the turn cap" ;;
    9)   echo "model returned nothing" ;;
    124) echo "timed out after ${MODEL_TIMEOUT}s" ;;
    130) echo "interrupted" ;;
    127) echo "$CC_BIN not found on PATH" ;;
    *)
      # exit 1 is a bucket: out of credits, unknown model, and empty prompt all land here,
      # so the reason has to be read off stderr rather than the code.
      if   grep -qi 'insufficient credits' "$2" 2>/dev/null; then echo "out of credits"
      elif grep -qi 'unknown model'        "$2" 2>/dev/null; then echo "unknown model id"
      elif grep -qi 'not authenticated'    "$2" 2>/dev/null; then echo "not logged in — run: $CC_BIN login"
      else echo "failed (exit $1): $(head -c 120 "$2" 2>/dev/null | tr '\n' ' ')"
      fi ;;
  esac
}

# Last-resort message built from paths alone. Only used in a real terminal, where there
# is no Claude to fall back to. Honest and dull beats invented and wrong.
rule_based_message() {
  local n type scope top
  n=$(wc -l < "$TMP/paths" | tr -d ' ')
  top="$(sed 's|/.*||' "$TMP/paths" | sort -u | head -2 | paste -sd, -)"
  case "$top" in
    *docs*)                type="docs" ;;
    test*|*__tests__*)     type="test" ;;
    .github*)              type="ci" ;;
    *)                     type="chore" ;;
  esac
  scope="$(sed 's|/.*||' "$TMP/paths" | sort | uniq -c | sort -rn | head -1 | awk '{print $2}')"
  scope="${scope%%.*}"
  if [ -n "$scope" ] && [ "$n" -gt 0 ]; then
    echo "$type($scope): update $n file(s)"
  else
    echo "$type: update $n file(s)"
  fi
}

generate_message() {
  build_prompt > "$TMP/prompt"
  if [ "$DESCRIBABLE" = 0 ]; then
    note "everything staged is machine-generated — nothing to describe"
    echo "chore: update generated files"
    return 0
  fi
  local m msg
  for m in "${MODELS[@]}"; do
    if msg="$(run_model "$m" "$TMP/prompt")"; then
      note "${m##*/}: ok"
      printf '%s\n' "$msg"
      return 0
    fi
    warn "${m##*/} failed ($(reason))"
  done
  return 1
}

# ── mode: split ────────────────────────────────────────────────────────────────
if [ "$MODE" = split ]; then
  [ -n "$(staged_paths)" ] || die "stage the changes you want split first (or run '$SELF --pick all' style selection)" 2

  # Building the plan stages each group in turn to read its diff, which destroys the index
  # the user handed us. Remember it so any path out of here can put it back.
  staged_paths > "$TMP/orig_staged"
  restore_index() {
    git reset -q >/dev/null 2>&1
    while IFS= read -r p; do [ -n "$p" ] && git add -- "$p" 2>/dev/null; done < "$TMP/orig_staged"
  }

  {
    cat <<'SPLITRULES'
Group these changed files into topical commits. Output ONLY lines in this exact form,
one per file, no preamble and no blank lines:

<group-number>|<path>|<group label>

Rules: every listed path appears exactly once. Group by topic, not by folder — files in
different folders that serve one purpose belong together. Use as few groups as honestly
fit; one group is a fine answer. The label is 2-5 words, lowercase.
SPLITRULES
    echo; echo "Files:"; sed 's/^/  /' "$TMP/paths"
    [ -n "$WHY" ] && { echo; echo "Context: $WHY"; }
  } > "$TMP/splitprompt"

  GROUPING=""
  for m in "${MODELS[@]}"; do
    if GROUPING="$(run_model "$m" "$TMP/splitprompt")"; then note "${m##*/}: grouped"; break; fi
    warn "${m##*/} failed ($(reason))"; GROUPING=""
  done
  [ -n "$GROUPING" ] || { say "no model could group the changes — commit them as one with: $SELF"; exit 6; }

  printf '%s\n' "$GROUPING" | grep -E '^[0-9]+\|' > "$TMP/groups" || true
  [ -s "$TMP/groups" ] || die "model returned an unusable grouping" 1

  # Renumber by label. Models name the groups well but number them badly — six files each
  # labelled "commit skills" under six different numbers is six pointless commits.
  awk -F'|' '{ lab=$3; gsub(/^ *| *$/,"",lab)
               if (!(lab in id)) id[lab]=++n
               print id[lab] "|" $2 "|" lab }' "$TMP/groups" > "$TMP/groups.merged"
  mv "$TMP/groups.merged" "$TMP/groups"

  # Every listed path must be accounted for, or files would silently go uncommitted.
  cut -d'|' -f2 "$TMP/groups" | sed 's/^ *//;s/ *$//' | sort -u > "$TMP/grouped_paths"
  sort -u "$TMP/paths" > "$TMP/all_paths"
  MISSING="$(comm -23 "$TMP/all_paths" "$TMP/grouped_paths")"
  if [ -n "$MISSING" ]; then
    warn "model left files ungrouped; adding them to a final group:"
    printf '  %s\n' $MISSING >&2
    last=$(cut -d'|' -f1 "$TMP/groups" | sort -n | tail -1)
    while IFS= read -r p; do
      [ -n "$p" ] && echo "$((last+1))|$p|remaining changes" >> "$TMP/groups"
    done <<< "$MISSING"
  fi

  # Record the undo point BEFORE the first commit, so one command rewinds the whole run.
  if [ "$HAS_HEAD" = 1 ]; then git rev-parse HEAD > "$UNDO_REF"; else echo "__ROOT__" > "$UNDO_REF"; fi

  GIDS="$(cut -d'|' -f1 "$TMP/groups" | sort -nu)"
  NGROUPS="$(printf '%s\n' "$GIDS" | grep -c .)"

  # Build every message up front so all of them can be reviewed in one stop.
  : > "$TMP/plan.txt"
  gi=0
  while IFS= read -r g; do
    [ -n "$g" ] || continue
    gi=$((gi+1))
    label="$(awk -F'|' -v g="$g" '$1==g{print $3; exit}' "$TMP/groups")"
    awk -F'|' -v g="$g" '$1==g{gsub(/^ *| *$/,"",$2); print $2}' "$TMP/groups" > "$TMP/g.$g.paths"

    git reset -q >/dev/null 2>&1
    while IFS= read -r p; do [ -n "$p" ] && git add -- "$p" 2>/dev/null; done < "$TMP/g.$g.paths"
    git diff --cached --name-status > "$TMP/status"
    git diff --cached --name-only  > "$TMP/paths"
    git diff --cached              > "$TMP/rawdiff"
    : > "$TMP/new"; : > "$TMP/edited"; : > "$TMP/gen"
    while IFS=$'\t' read -r st path rest; do
      [ -n "${path:-}" ] || continue
      [ "${st:0:1}" = "R" ] && path="${rest:-$path}"
      if is_generated "$path"; then echo "$path" >> "$TMP/gen"
      elif [ "${st:0:1}" = "A" ]; then echo "$path" >> "$TMP/new"
      else echo "${st:0:1} $path" >> "$TMP/edited"; fi
    done < "$TMP/status"
    : > "$TMP/diff"
    [ -s "$TMP/edited" ] && while read -r _ p; do git diff --cached -- "$p"; done < "$TMP/edited" > "$TMP/diff"
    DESCRIBABLE=1; { [ -s "$TMP/new" ] || [ -s "$TMP/edited" ]; } || DESCRIBABLE=0
    WHY_SAVE="$WHY"; WHY="${WHY:+$WHY — }this commit: $label"
    msg="$(generate_message)" || msg="$(rule_based_message)"
    WHY="$WHY_SAVE"
    printf '%s\n' "$msg" | strip_trailers > "$TMP/g.$g.msg"
    { echo "GROUP $gi/$NGROUPS  ($label)"; sed 's/^/  /' "$TMP/g.$g.paths"; echo "  ---"; sed 's/^/  /' "$TMP/g.$g.msg"; echo; } >> "$TMP/plan.txt"
  done <<< "$GIDS"

  restore_index
  cat "$TMP/plan.txt" >&2

  if [ "$ASSUME_YES" = 0 ]; then
    if interactive; then
      printf '[enter] commit all %s   n = cancel  > ' "$NGROUPS" >&2
      read -t "$COUNTDOWN" -r ans || ans=""
      echo >&2
      [ "$ans" = "n" ] && { rm -f "$UNDO_REF"; die "cancelled" 1; }
    else
      cp "$TMP/plan.txt" "$PLAN"
      say "re-run with -y to commit these $NGROUPS groups, or edit the plan first"
      rm -f "$UNDO_REF"
      exit 5
    fi
  fi

  [ "$DRY_RUN" = 1 ] && { say "dry run — nothing committed"; restore_index; rm -f "$UNDO_REF"; exit 0; }

  done_n=0
  while IFS= read -r g; do
    [ -n "$g" ] || continue
    git reset -q >/dev/null 2>&1
    while IFS= read -r p; do [ -n "$p" ] && git add -- "$p" 2>/dev/null; done < "$TMP/g.$g.paths"
    if ! git commit -q -F "$TMP/g.$g.msg" --cleanup=strip; then
      say ""
      say "${C_RED}committed $done_n of $NGROUPS, then stopped.${C_OFF}"
      say "group $((done_n+1)) failed — the remaining groups are unsaved, nothing is lost."
      restore_index                       # leave the index exactly as it was handed to us
      [ "$done_n" -gt 0 ] && say "rewind everything with:  $SELF undo"
      exit 1
    fi
    done_n=$((done_n+1))
  done <<< "$GIDS"

  say "committed $done_n commit(s).  wrong? → $SELF undo"
  exit 0
fi

# ── single commit / amend ──────────────────────────────────────────────────────
if [ -n "$MSG_FILE" ]; then
  [ -f "$MSG_FILE" ] || die "message file not found: $MSG_FILE" 1
  strip_trailers < "$MSG_FILE" > "$TMP/msg"
elif [ "$MERGING" = 1 ] && [ -f "$GIT_DIR/MERGE_MSG" ]; then
  # Git's merge message records which branches merged. That is structural information a
  # generated sentence would throw away, so keep it.
  note "merge in progress — keeping git's own merge message"
  strip_trailers < "$GIT_DIR/MERGE_MSG" > "$TMP/msg"
else
  if MSG="$(generate_message)"; then
    printf '%s\n' "$MSG" | strip_trailers > "$TMP/msg"
  else
    if interactive; then
      warn "every model failed — falling back to a generated-from-paths message"
      rule_based_message > "$TMP/msg"
    else
      cp "$TMP/prompt" "$PLAN"
      say "every model failed. The full prompt is at: $PLAN"
      say "write the message yourself and re-run:  $SELF --message-file <file>"
      exit 6
    fi
  fi
fi

[ -s "$TMP/msg" ] || die "empty commit message after stripping" 1

# ── approval ───────────────────────────────────────────────────────────────────
if [ "$ASSUME_YES" = 0 ]; then
  say ""; cat "$TMP/msg" >&2; say ""
  if interactive; then
    printf '[enter] save   e = edit   n = cancel  (auto-saves in %ss) > ' "$COUNTDOWN" >&2
    read -t "$COUNTDOWN" -r ans || ans=""
    echo >&2
    case "$ans" in
      n|N) die "cancelled" 1 ;;
      e|E) "${EDITOR:-vi}" "$TMP/msg"
           strip_trailers < "$TMP/msg" > "$TMP/msg.s" && mv "$TMP/msg.s" "$TMP/msg"
           [ -s "$TMP/msg" ] || die "empty message after edit" 1 ;;
    esac
  else
    cp "$TMP/msg" "$PLAN"
    say "re-run to commit this message:  $SELF ${MODE#commit} -y --message-file $PLAN"
    exit 5
  fi
fi

[ "$DRY_RUN" = 1 ] && { say "dry run — nothing committed"; cat "$TMP/msg"; exit 0; }

# Undo point, recorded before we touch history.
if [ "$MODE" = amend ]; then
  git rev-parse HEAD^ > "$UNDO_REF" 2>/dev/null || echo "__ROOT__" > "$UNDO_REF"
elif [ "$HAS_HEAD" = 1 ]; then
  git rev-parse HEAD > "$UNDO_REF"
else
  echo "__ROOT__" > "$UNDO_REF"
fi

if [ "$MODE" = amend ]; then
  git commit -q --amend -F "$TMP/msg" --cleanup=strip || die "git commit --amend failed" 1
  say "amended.  wrong? → $SELF undo"
else
  # -F, never -m: a literal \n in a -m argument is a real and common agent failure, and -F
  # also guarantees no editor is ever opened.
  if ! git commit -q -F "$TMP/msg" --cleanup=strip; then
    rm -f "$UNDO_REF"
    say ""
    die "git commit failed (a hook rejected it, or there was nothing staged). Not retrying automatically." 1
  fi
  say "committed.  wrong? → $SELF undo"
fi
exit 0
