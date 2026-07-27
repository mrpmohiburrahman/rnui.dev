# CommandCode CLI — headless / non-interactive surface

Research date: 2026-07-27. Primary sources only: the installed binary, its shipped JS bundle, this machine's
`~/.commandcode/*.json`, and `commandcode.ai/docs`. No blog posts, no memory.

**Installed version: `0.52.5`.** The official docs describe **`1.4.x`**. They disagree on several load-bearing
points (`--output-format json`, `--effort`, `--config`, `--max-turns` default, exit code 10). Where they
disagree, **the binary wins** and this document says so explicitly.

---

## How to reproduce every claim below

```bash
readlink -f /opt/homebrew/bin/commandcode
# → /opt/homebrew/lib/node_modules/command-code/dist/index.mjs   (2-line shim → ./cli.mjs)
```

The real code is `/opt/homebrew/lib/node_modules/command-code/dist/cli.mjs` — **1,270,783 bytes on 15
physical lines**, esbuild-minified but *not* obfuscated: identifiers are mangled, **all string literals and
`process.exit()` calls are intact**, and esbuild's `__name(fn,"realName")` calls preserve the original
function names. Line numbers are useless; cite byte offsets. Extract a region with:

```bash
python3 -c "print(open('/opt/homebrew/lib/node_modules/command-code/dist/cli.mjs',encoding='utf8',errors='replace').read()[482000:487000])"
```

Everything headless lives in one ~5 KB stretch at **offset 482000–487000** (`readStdin`, `printMode`,
`resolvePrintSession`, `processQuery`, `executeToolCall`). Read that once and you have the whole surface.

---

## TL;DR

| | |
|---|---|
| **Headless flag** | `-p` / `--print [query]` — kept, same spelling as Claude Code |
| **Prompt source** | argv **or** stdin; **argv wins**, stdin is then never read |
| **Model flag** | `-m` / `--model <id>`, case-insensitive, accepts bare name after the `/` |
| **Failure detectable?** | **YES — richly.** 8 distinct exit codes (0,1,3,4,5,6,7,8,9,130), never "always 1" |
| **The ambiguity that remains** | **exit 1 is a bucket**: unknown model, empty prompt, *and* insufficient credits all land on 1. Disambiguate on stderr text, not on the code |
| **Timeout** | **None.** No flag, no default. Wrap in `timeout(1)` |
| **Output** | Plain UTF-8 text on stdout, no ANSI, no banner, exactly one trailing `\n`. Verified byte-for-byte |
| **Hooks** | **Print mode does not run PreToolUse / PostToolUse / Stop / SessionStart hooks at all** |
| **TTY** | Not required. Runs fine fully detached |
| **cwd** | Never written to. Transcript goes to `~/.commandcode/projects/<slug-of-cwd>/<uuid>.jsonl` |
| **AI attribution** | None. Zero occurrences of `co-authored`, `generated with`, `🤖`, or even `git commit` in the entire bundle |
| **Biggest trap** | `allowUnknownOption()` — **misspelled and future-version flags are silently ignored, not rejected** |

**The copy-pasteable invocation** (details and rationale in the last section):

```bash
CI=1 timeout 120 commandcode -p --no-auto-update --skip-onboarding --max-turns 4 \
    --model deepseek/deepseek-v4-flash < prompt.txt
```

---

## A. Headless / print mode

**`-p` survived intact.** Claude Code's spelling was kept, including the short form.

`commandcode --help` (exit 0):

```
  -p, --print [query]               Run in non-interactive mode, output response and exit
  --max-turns <number>              Cap conversation turns in -p mode (default 10; exit 8 on cap-hit)
  --verbose                         Stream tool execution progress to stderr in print mode
```

Option registration, `cli.mjs` offset **1105060**:

```js
.option("-p, --print [query]","Run in non-interactive mode, output response and exit")
```

Dispatch, offset **1100125** (`interactiveModeAction`):

```js
if(void 0!==t.print){const o=iS(t,e);return void await printMode({query:o,
  dangerouslySkipPermissions:t.dangerouslySkipPermissions,maxTurns:t.maxTurns,verbose:t.verbose,
  model:n,benchmarkOutput:t.benchmarkOutput,resume:t.resume,continue:t.continue})}
```

Note the guard is `void 0 !== t.print`, so a bare `-p` with no value still enters print mode.

`--dangerously-skip-permissions` also survived (hidden from `--help`, offset 1103980) with `--yolo` as a
visible alias that `.implies({dangerouslySkipPermissions:!0})`.

**There is no `--headless`, no `--non-interactive`, no `-q`.** Confirmed by reading the full
`createProgram()` option chain, offsets 1103300–1105600.

```bash
commandcode -p "your query"          # copy-pasteable
```

---

## B. Prompt input — argv, stdin, and which wins

**Both work. argv wins, unconditionally.**

Query extraction, offset **1099984** (`extractPrintQuery`, minified as `iS`):

```js
iS=__name((e,t)=>"string"==typeof e.print&&e.print.trim()?e.print
                : t&&!t.startsWith("-")?t : "","extractPrintQuery")
```

So the query is, in order: (1) the value attached to `-p`, (2) the bare positional prompt argument if it
doesn't start with `-`, (3) empty string.

`printMode`, offset **484830**:

```js
async function printMode(e={}){setupSignalHandlers(),hu=new AbortController;let t=e.query||"";
if(!t){process.stdin.isTTY&&(process.stderr.write(`Error: No query provided. Usage: ${getBinaryCommand()} -p "your query"\n`),process.exit(1));
  try{t=await readStdin()}catch(e){...process.exit(1)}}
t.trim()||(process.stderr.write(`Error: No query provided. ...`),process.exit(1)),
```

Read that carefully:

- **stdin is only consulted when the argv query is empty.** If you pass both, stdin is never read — and
  never drained. The upstream writer in `git diff | commandcode -p "msg"` will sit on a full pipe and get
  EPIPE when the CLI exits. Harmless, but don't write a script that assumes the diff was consumed.
- If argv is empty **and** stdin is a TTY, it exits **1** immediately rather than hanging. Good behavior.
- Whitespace-only stdin → exit 1, same message.

`readStdin`, offset **484100** — note the **hard 30-second cap**:

```js
async function readStdin(){return new Promise((e,t)=>{let n="";
  const o=setTimeout(()=>{t(new Error("Timeout reading from stdin"))},3e4);
  process.stdin.setEncoding("utf8"),process.stdin.on("data",e=>{n+=e}),
  process.stdin.on("end",()=>{clearTimeout(o),e(n.trim())}),...})}
```

The timer starts when `readStdin()` is called and is only cleared on `end`. A producer that takes >30 s to
close the pipe kills the run with `Error reading from stdin: Timeout reading from stdin` and exit 1. Note
also `n.trim()` — leading/trailing whitespace in your piped payload is stripped.

Verified on this machine:

```
$ commandcode -p --no-auto-update < /dev/null ; echo "exit=$?"
Error: No query provided. Usage: cmd -p "your query"
exit=1
```

**Sharp edge:** a query that starts with `-` cannot be passed via argv — commander refuses to consume it as
the optional value of `-p`. Use stdin for anything you don't fully control.

```bash
commandcode -p "your query"                        # argv form
printf '%s' "$PROMPT" | commandcode -p             # stdin form (use for untrusted/multiline text)
```

---

## C. Model selection

Flag: **`-m, --model <model>`**, offset **1105340**:

```js
.option("-m, --model <model>","Run on a specific model this session (e.g. claude-sonnet-4-6, kimi-k2.5). Unknown ids are rejected; see --list-models.")
.option("--list-models","List the models available for use")
```

There is a `--list-models` flag but **no `commandcode models` subcommand** (checked the full
`addCommand` chain at offset 1267473: `help`, `info`, `whoami`, `update`, `feedback`, `taste`, `mcp`,
`skills`, `login`, `logout`, `status`, `learn-taste`, and `sandbox` behind `--experimental`).

### The three ids you asked about

| Candidate | Verdict | Evidence |
|---|---|---|
| `deepseek/deepseek-v4-pro` | **VALID** | Appears in `--list-models` under "Open Source"; registry entry at offset ~28000 |
| `xiaomi/mimo-v2.5-pro` | **VALID** | In `--list-models`; also the active model in `~/.commandcode/config.json` |
| MiniMax M3 → **`MiniMaxAI/MiniMax-M3`** | **VALID** — note the doubled `AI` and the exact casing | `--list-models` prints `MiniMaxAI/MiniMax-M3  frontier coding, agents & native multimodality`; docs table agrees |
| `tencent/Hy3` (from this machine's `featureModels`) | **VALID but hidden** | Registry entry at offset **28421** carries `hidden:!0,badge:"free"`, which is why `--list-models` omits it. `getModelGroupsInOrder()` filters `!e.hidden` (offset 102400). Accepted by `--model` — verified below |

The docs' models page lists `tencent/hy3-paid` and `inclusionai/ling-3.0-flash-free`, which **do not exist in
0.52.5's registry** — more 1.4.x drift.

### Full accepted list on 0.52.5 (45 visible + 1 hidden)

From `commandcode --list-models` (exit 0), which prints `Available models  ·  45 models`:

**Open Source (25):** `deepseek/deepseek-v4-pro`, `deepseek/deepseek-v4-flash` *(marked default)*,
`moonshotai/Kimi-K3`, `moonshotai/Kimi-K2.7-Code`, `moonshotai/Kimi-K2.7-Code-Highspeed`,
`moonshotai/Kimi-K2.6`, `moonshotai/Kimi-K2.5`, `zai-org/GLM-5.2`, `zai-org/GLM-5.2-Fast`, `zai-org/GLM-5.1`,
`zai-org/GLM-5`, `MiniMaxAI/MiniMax-M3`, `MiniMaxAI/MiniMax-M2.7`, `MiniMaxAI/MiniMax-M2.5`,
`xiaomi/mimo-v2.5-pro`, `xiaomi/mimo-v2.5`, `Qwen/Qwen3.6-Max-Preview`, `Qwen/Qwen3.6-Plus`,
`Qwen/Qwen3.7-Max`, `Qwen/Qwen3.7-Plus`, `stepfun/Step-3.7-Flash`, `stepfun/Step-3.5-Flash`,
`nvidia/nemotron-3-ultra-550b-a55b`, `thinkingmachines/inkling`, `poolside/laguna-s-2.1-free` *(FREE)*

**Anthropic (6):** `claude-sonnet-5`, `claude-sonnet-4-6`, `claude-fable-5`, `claude-opus-4-8`,
`claude-opus-4-7`, `claude-haiku-4-5`

**OpenAI (7):** `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`, `gpt-5.5`, `gpt-5.4`, `gpt-5.3-codex`,
`gpt-5.4-mini`

**Google (4):** `google/gemini-3.6-flash`, `google/gemini-3.5-flash`, `google/gemini-3.5-flash-lite`,
`google/gemini-3.1-flash-lite`

**Sakana (1):** `sakana/fugu-ultra` — **Meta (1):** `meta/muse-spark-1.1` — **xAI (1):** `xai/grok-4.5`

**Hidden (1):** `tencent/Hy3` — free, 262144-token window, not printed by `--list-models`.

> The docs list `claude-opus-5`; 0.52.5's registry does not have it. `claude-haiku-4-5` resolves internally
> to `claude-haiku-4-5-20251001` via the date-suffix regex `/[-@]\d{8}$/` at offset 103423.

### Matching rules (offsets 103629 and 1094935)

```js
function tryResolveCanonical(e){const t=(Yt[e.toLowerCase()]??e).toLowerCase(),
  n=Object.values(Kt).find(e=>e.id.toLowerCase()===t); if(n)return n.id; ...}
function resolveModelFlag({model:e}){const t=resolveKnownModelId(e); if(t)return t;
  const n=modelNameOf(e),o=getAllModelOptions().filter(e=>modelNameOf(e.id)===n);
  return 1===o.length?o[0].id:void 0}
```

Full ids are matched **case-insensitively**; failing that, the segment after the last `/` is matched
lowercased, and accepted only if it is unique. So all of these are the same model:
`moonshotai/Kimi-K2.5`, `MOONSHOTAI/KIMI-K2.5`, `kimi-k2.5`.

Verified on this machine (all zero-cost — model resolution happens before any API call, and empty stdin
aborts before the request):

```
$ commandcode -p --model 'MOONSHOTAI/KIMI-K2.5' --no-auto-update < /dev/null
Error: No query provided. Usage: cmd -p "your query"        ← model RESOLVED
$ commandcode -p --model 'mimo-v2.5-pro'        --no-auto-update < /dev/null
Error: No query provided. Usage: cmd -p "your query"        ← short name RESOLVED
$ commandcode -p --model 'tencent/Hy3'          --no-auto-update < /dev/null
Error: No query provided. Usage: cmd -p "your query"        ← hidden id RESOLVED
```

If `--model` is omitted, the model comes from `~/.commandcode/config.json` `"model"` (offset 486990:
`const r=getConfiguredModel()` inside `callApi`), which on this machine is `xiaomi/mimo-v2.5-pro`.
Confirmed by `commandcode status --json`.

```bash
commandcode -p "query" --model MiniMaxAI/MiniMax-M3     # copy-pasteable
```

---

## D. Failure modes and exit codes

**Failure is detectable, and far better than "always 1".** This is the good news for the caller.

Every code below is a literal `process.exit(N)` I read in the bundle, all inside `printMode`'s body and
`catch` block, offsets **485000–486760**. Verbatim from the bundle (whitespace added):

```js
// entry guards
process.stderr.write(`Error: No query provided. Usage: ${getBinaryCommand()} -p "your query"\n`), process.exit(1)
await isAuthenticated() || (process.stderr.write(`Error: Not authenticated. Please run "${getBinaryCommand()} login" first.\n`), process.exit(3))

// success path
process.stdout.write(a), a.endsWith("\n") || process.stdout.write("\n"),
l && (process.stderr.write("Warning: The model produced no response (continuation budget exhausted). Retry, or try a different model.\n"), process.exit(9)),
process.exit(i ? 8 : 0)

// catch block
"AbortError" === e.name && (process.stderr.write("\nCancelled.\n"), process.exit(130))
e instanceof ks && (process.stderr.write(`Error: Authentication failed. Please run "${getBinaryCommand()} login" first.\n`), process.exit(3))
e instanceof Cs && (process.stderr.write(`Error: ${e.message}\n`), process.exit(4))
e instanceof xs && (… `Error: Rate limit exceeded. Please wait a moment and try again.\n`, process.exit(5))
e instanceof ws && (process.stderr.write("Error: Unable to connect to the API. Please check your network connection.\n"), process.exit(6))
e instanceof As && (process.stderr.write("Error: The API server encountered an error. Please try again later.\n"), process.exit(7))
/permission denied|access denied|not permitted|unauthorized/i.test(t) && (process.stderr.write(`Error: ${t}\n`), process.exit(4))
process.stderr.write(`Error: ${t}\n`), process.exit(1)
```

The mangled class names resolve at offset **153785–154500**, where esbuild's `__name` calls give the
originals:

| Minified | Real class | HTTP |
|---|---|---|
| `ks` | `AuthenticationError` | 401 |
| `Cs` | `PermissionDeniedError` | 403 |
| `xs` | `RateLimitError` | 429 |
| `ws` | `APIConnectionError` | — (fetch threw) |
| `As` | `InternalServerError` | ≥500 |
| `Es` | `BadRequestError` | 400 — **not handled in print mode** |

### The table

| Code | Meaning | stderr | Where |
|---|---|---|---|
| `0` | Success | *(empty)* | off. 485840 |
| `1` | **Catch-all** — no query, unknown model, unknown/400 API error, insufficient credits | varies | off. 484975, 1096700, 486740 |
| `3` | Not logged in / 401 | `Error: Not authenticated. Please run "cmd login" first.` / `Error: Authentication failed…` | off. 485200, 486090 |
| `4` | 403 permission denied | `Error: <api message>` | off. 486280 |
| `5` | 429 rate limit / usage-window limit | `Error: Rate limit exceeded…` or `formatWindowLimitMessage` | off. 486420 |
| `6` | Network failure | `Error: Unable to connect to the API. Please check your network connection.` | off. 486550 |
| `7` | API 5xx | `Error: The API server encountered an error. Please try again later.` | off. 486690 |
| `8` | `--max-turns` cap hit before a final answer | `Warning: Reached maximum conversation turns (N). …Retry with --max-turns 2N…` | off. 485960 |
| `9` | Model returned nothing | `Warning: The model produced no response (continuation budget exhausted)…` | off. 485880 |
| `130` | SIGINT / SIGTERM | `Interrupted.` / `Terminated.` / `Cancelled.` | off. 484440, 486010 |

Full census of exit calls across the whole bundle:

```
$ grep -o 'process\.exit([^)]*)' cli.mjs | sort | uniq -c | sort -rn
  71 process.exit(1)     19 process.exit(0)      3 process.exit(130)
   2 process.exit(4)      2 process.exit(3)      1 process.exit(i?8:0)
   1 process.exit(9)      1 process.exit(7)      1 process.exit(6)   1 process.exit(5)
   1 process.exit(75)                    ← self-update handoff, not reachable from -p
```

### Your four scenarios

**(i) Not logged in / auth failure → exit 3.** Two paths: a pre-flight `isAuthenticated()` check that reads
`~/.commandcode/auth.json` before any network call, and a 401 from the API. Both print a message containing
`Not authenticated` or `Authentication failed`. Clean and unambiguous.

**(ii) Quota / credits exhausted → exit 1. ⚠️ THIS IS THE HOLE.**
`process.exit(10)` **does not exist in this build** (grep count: 0) even though the 1.4.x docs document
`10 = EXIT_INSUFFICIENT_CREDITS`. On 0.52.5 credit exhaustion arrives as an HTTP **400 BadRequestError**
whose message contains `insufficient credits` — see the two guards that key off exactly that shape:

```js
// offset 475802, formatAPIError
if(e instanceof Es && 400===e.status && e.message?.toLowerCase().includes("insufficient credits"))
    return new Error("Insufficient credits");
// offset 474815, isNonRetryableError — same predicate, so it is never retried
```

`Es` (BadRequestError) is **not** in `printMode`'s instanceof chain, so it falls through to the final
`process.stderr.write(\`Error: ${t}\`), process.exit(1)`. **Detect credit exhaustion by grepping stderr for
`insufficient credits` (case-insensitive), not by exit code.** The user-facing string is
`You have insufficient credits to make this request. Please purchase more credits to continue using Command
Code: https://commandcode.ai/billing` (offset 1004900), and there is a separate `Premium credits exhausted`
message for plan-premium exhaustion — but the auto-fallback-to-Kimi behavior behind it
(`applyPremiumCreditsFallback`, offset 662100) lives only in the interactive React component, **not** in
print mode.

> **UNVERIFIED:** if the backend ever returns credit exhaustion as HTTP **403** instead of 400, print mode
> would exit **4**, not 1. Settling test: exhaust credits (or point `--local`/`--staging` at a stub) and run
> `commandcode -p 'hi'; echo $?`. I did not spend credits to find out. Treat 1 *and* 4 as possible and match
> on stderr text either way.

**(iii) Unknown or unavailable model → exit 1**, and the check runs **before any network call or auth
check**, so it costs nothing. Offset **1096700**:

```js
function resolveModelFlagOrExit({model:e}){const t=resolveModelFlag({model:e}); if(t)return t;
  const n=suggestModel(e),o=n?` Did you mean "${n}"?`:"";
  process.stderr.write(`Error: unknown model "${e}".${o}\nRun "${getBinaryCommand()} --list-models" to see all available models\n`),
  process.exit(1)}
```

Verified:

```
$ commandcode -p --model 'deepseek/deepseek-v9-turbo' --no-auto-update < /dev/null ; echo "exit=$?"
Error: unknown model "deepseek/deepseek-v9-turbo". Did you mean "deepseek/deepseek-v4-pro"?
Run "cmd --list-models" to see all available models
exit=1
```

Note **stdout stayed empty** — the error is stderr-only. A *known-but-not-in-your-plan* model is different:
it comes back from the API as `MODEL_NOT_IN_PLAN:` (offset 622600), which is only special-cased in the
interactive engine, so in print mode it degrades to a raw API error → exit 1 or 4.

**(iv) Network failure → exit 6**, cleanly. Offset 154940 wraps the `fetch` and rethrows as
`APIConnectionError`:

```js
try{s=await this.makeRequest({url:n,options:e,headers:r})}
catch(e){const t=new ws({cause:e instanceof Error?e:void 0}); throw o.end({statusCode:0,error:t}),t}
```

Before you see exit 6, print mode retries up to **5 times with 200 ms × 2ⁿ backoff** (offset 487500) — but
only when the error carries `isRetryable === true`. Worst case that's 0.2+0.4+0.8+1.6 = 3 s of extra wall
clock on top of four connection timeouts.

### Exit-code disambiguation cheat sheet

```bash
rc=$?
case $rc in
  0)   : ;;                                  # ok
  3)   echo "auth: run 'commandcode login'" ;;
  5)   echo "rate limited — back off" ;;
  6|7) echo "transient (network / 5xx) — retry once" ;;
  8)   echo "hit --max-turns; output is partial" ;;
  9)   echo "model returned nothing" ;;
  130) echo "interrupted" ;;
  124) echo "timeout(1) killed it" ;;        # from the wrapper, not the CLI
  *)   grep -qi 'insufficient credits' "$errfile" && echo "OUT OF CREDITS" \
       || grep -qi '^Error: unknown model' "$errfile" && echo "bad --model" \
       || echo "unknown failure" ;;
esac
```

---

## E. Timeouts

**There is no built-in request timeout in print mode and no flag to set one.** The caller must wrap.

The HTTP client *supports* a timeout, but only if constructed with one — offset **156098**:

```js
async makeRequest({url:e,options:t,headers:n}){const o=new AbortController,
  r=this.config.timeout?setTimeout(()=>o.abort(),this.config.timeout):null;
  try{const s=await fetch(e,{headers:n,method:t.method,body:…,signal:t.signal??o.signal}); …}
```

Print mode constructs it **without** `timeout` — offset **490560**, inside `processQuery`:

```js
const c=getApiBaseUrl(), d=new Ms({baseUrl:c});
```

Compare with the one place that *does* set one — the telemetry fingerprint call at offset 1267400 uses
`new Ms({baseUrl:getApiBaseUrl(),timeout:4e3})`. So the omission in `processQuery` is deliberate, not an
oversight I'm misreading.

Note also the `signal: t.signal ?? o.signal` precedence: print mode always passes the SIGINT
`AbortController`'s signal, so even if a timeout were configured it would be shadowed.

The only clocks that exist in the print path:

| Clock | Value | Source |
|---|---|---|
| stdin read | **30 s** | `setTimeout(…,3e4)` at offset 484130 |
| retry backoff | 200 ms × 2ⁿ, 5 attempts | offset 487500 |
| turn cap | `--max-turns`, default **10** | `var wu=10` at offset 486915 |
| API request / stream | **none** | offset 490560 |

`--max-turns` is a turn cap, not a time cap: 10 turns of a slow reasoning model on a large repo can run for
many minutes. The docs claim the default is 100; on 0.52.5 it is **10** — verify with `commandcode --help`,
which prints `default 10`.

```bash
timeout --signal=TERM 120 commandcode -p "query"   # rc 124 on timeout; SIGTERM → CLI exits 130
```

`timeout`'s SIGTERM is handled gracefully — `setupSignalHandlers` (offset 484350) aborts the in-flight
request, writes `Terminated.` to stderr, and exits 130. Only if `timeout -k` escalates to SIGKILL do you get
124/137 with a half-written transcript.

---

## F. Output shape

**stdout is plain text and nothing else.** Offset **485700**:

```js
process.stdout.write(a), a.endsWith("\n")||process.stdout.write("\n"),
```

`a` is the raw concatenation of the model's text blocks (`f+=y` in the turn loop) — no markdown renderer, no
`chalk`, no `marked-terminal`, no banner, no JSON envelope. **Exactly one trailing newline**, appended only
if the model didn't already end with one.

Verified byte-for-byte, one live probe, free model, in an empty temp dir:

```
$ echo 'reply with the single word: ok' | commandcode -p --no-auto-update --skip-onboarding \
      --max-turns 2 --model poolside/laguna-s-2.1-free
EXIT=0   SECONDS=5
--- stdout hexdump ---   00000000: 6f6b 0a     ok.
--- stderr hexdump ---   (empty)
--- cwd after ---        CWD UNCHANGED
```

3 bytes. No escape sequences, no BOM, nothing on stderr.

### Is there `--output-format json`?

**Not in 0.52.5.** `grep -c 'output-format' cli.mjs` → **0**; `grep -c 'outputFormat'` → **0**. The 1.4.x
docs describe an NDJSON stream with `subtype`/`usage`/`durationMs`/`finalText`/`sessionId`/`stopReason`
fields. **That does not exist in the installed build.**

Worse, because of `allowUnknownOption()` (offset 1105600) the flag is **silently swallowed** rather than
rejected:

```
$ commandcode -p --output-format=json --no-auto-update < /dev/null ; echo "exit=$?"
Error: No query provided. Usage: cmd -p "your query"
exit=1
```

It reached the "no query" guard, i.e. commander accepted and ignored `--output-format=json`. Same for
`--effort=high` and `--config`. **A script written against the published docs will run on 0.52.5 and quietly
produce plain text.** Guard with a version check.

The one machine-readable surface that *does* exist is `commandcode status --json` (offset 150305):

```
$ commandcode status --json ; echo "exit=$?"
{"authenticated":true,"version":"0.52.5","user":"…","provider":"command-code","model":"xiaomi/mimo-v2.5-pro","context_window":1000000}
exit=0
```

`const o = !n.authenticated || n.error ? 1 : 0` — exit 1 if not authenticated. A perfect pre-flight check.

### What goes to stderr

Everything non-answer, by construction. The spinner is explicitly bound to stderr — offset **490760**:

```js
const b={stream:process.stderr,color:"cyan"}, T=s?Be(b):null;
```

…and `T` is `null` unless `--verbose`. So **by default there is no spinner at all**. With `--verbose` you get
`session: <uuid>` plus per-tool progress lines, all on stderr.

| Emission | Stream | Condition |
|---|---|---|
| The answer | **stdout** | always |
| `session: <uuid>` | stderr | `--verbose` |
| ora spinner + tool labels | stderr | `--verbose` |
| `Warning: Reached maximum conversation turns…` | stderr | max-turns hit |
| `Warning: The model produced no response…` | stderr | empty result |
| All `Error:` lines | stderr | always |
| **`Updated 0.52.5 → 1.4.1`** | **stdout** ⚠️ | see below |

**The one stdout polluter.** `notifyCompletedUpdate()` at offset **705024** uses `console.log`, which is
stdout, with green ANSI:

```js
if(!dt.gte(t,e.pending.targetVersion))return;
console.log(Ce.green(`Updated ${e.pending.currentVersion} → ${t}`));
```

It runs from `preRun()` (offset 698700) on **every** invocation, before commander even parses:

```js
const e=lS.has(cS()??"")||uS().includes("--no-auto-update");
e||(notifyCompletedUpdate(),maybeRunPendingUpdate()), … e||checkForUpdateAsync();
```

So the first headless run after a background self-update completes will print a coloured banner **to stdout,
ahead of the model's answer**. If that answer is a commit message, you commit `Updated 0.52.5 → 1.4.1`.
`--no-auto-update` short-circuits the whole block; `CI=1` or `COMMANDCODE_SKIP_UPDATES=1` also work, via
`shouldSkipUpdateSystem()` at offset 699037:

```js
function shouldSkipUpdateSystem(){return !!process.env.CI||!!process.env.COMMANDCODE_SKIP_UPDATES||!!isLocalDevelopmentBuild()}
```

**Use both belts.** This is not hypothetical — my own read-only `--help` and `--list-models` probes (run
without `--no-auto-update`) mutated `~/.commandcode/updates.json` `lastCheckedAt` from `1785110826615` to
`1785111680986` and left a live `update.lock` holding PID 70644, with a pending 0.52.5 → 1.4.1 update.

---

## G. Everything that would break scripted use

### TTY: not required ✅

`printMode` never renders Ink. The only TTY reference in the print path is the *helpful* guard
`process.stdin.isTTY && (…exit(1))` — it errors when there's no query **and** no pipe, rather than blocking on
a read. `isTTY()` (offset 1097390) exists but is used only for colouring `--list-models`:

```js
function isTTY(){return Boolean(process.stdout.isTTY&&process.stdin.isTTY&&!process.env.CI)}
```

Verified: the live probe ran with stdout, stderr and stdin all redirected to files/`/dev/null`.

### cwd: never written to ✅

Transcripts go under `$HOME`. Offset **575688**:

```js
function getProjectsBasePath(){return t.join(M.homedir(),".commandcode","projects")}
function getProjectDirName(e){return je(e.cwd)}                       // je = @sindresorhus/slugify
function getTranscriptPath(e){return t.join(getProjectsBasePath(),getProjectDirName({cwd:e.cwd}),`${e.sessionId}.jsonl`)}
```

Verified after the probe:

```
~/.commandcode/projects/private-tmp-…-scratchpad-probeh-im-6/1a8a30a2-6db5-459d-b1b5-20e59fb921f1.jsonl   720 B
```

…and the temp cwd was byte-identical before and after. **But note it does grow:** every headless run in a new
directory creates a new slugified project dir plus a `.jsonl`. On this machine `~/.commandcode/projects/`
already holds 72 directories. A `/commit` skill run once per commit will accumulate one transcript per run
forever — nothing prunes them.

`~/.commandcode/history.jsonl` (the interactive input history) was **not** touched — mtime unchanged at
`1784975420`. Headless runs don't pollute interactive history.

### Hooks: DO NOT fire in print mode ✅ (the answer you wanted)

This machine has `PreToolUse`, `PostToolUse` (both `matcher: ".*"`) and two `Stop` hooks in
`/Users/mrp/.commandcode/settings.json`, one of which shells out to `mempalace mine`. **A headless one-shot
fires none of them.**

Print mode has its **own** tool executor with no hook plumbing whatsoever — offset **488500**:

```js
async function executeToolCall(e,t,n){
  if(yu.has(e.toolName)&&!n)return{…output:{type:"error-text",value:`Error: Tool "${e.toolName}" requires permissions. Use --yolo (or --dangerously-skip-permissions) to enable file writes and shell commands in print mode.`}};
  try{const n=await executeTool(e.toolName,e.input,{abortSignal:t}); return {…} } catch(t){…}}
```

Straight to `executeTool`. No `firePreToolUseHook`, no `firePostToolUseHook`. Every hook call site in the
bundle — offsets 590324, 590718, 602965, 625739 — is a method on the interactive `ContextEngine` class:

```js
async firePreToolUseHook(e){return this.hookSystem?firePreToolUseHook({hookSystem:this.hookSystem,…}):null}
```

`printMode` never constructs a `ContextEngine` and never calls `createHookSystem`. Same for `Stop` and
`SessionStart`.

Empirically confirmed: the `Stop` hook `/Users/mrp/.commandcode/hooks/mempal-save.sh` creates
`/tmp/mempal-cc-<md5>.lock` whenever it runs. After the live probe, `ls /tmp/mempal-cc-*.lock` → **no
matches**. The hook did not run.

> Consequence worth naming: if you rely on those hooks as a *safety net* (an anti-attribution guard, an audit
> log, a secret scanner), **a headless run bypasses it silently**. Don't move a guardrail into a CommandCode
> hook and then invoke CommandCode with `-p`.
>
> There is also a hook-trust gate — `~/.commandcode/trusted-hooks.json` fingerprints hooks per project — but
> it's moot here since no hook system is built at all.

### Write-capable tools are blocked by default ⚠️

Same `executeToolCall` guard. The gated set is `yu = new Set([Ds,$s,_s,Us,zs])`, which the string constants
resolve to:

```
Ds="edit_file"   $s="write_file"   _s="shell_command"   Us="monitor_command"   zs="kill_shell"
```

Without `--yolo`, each of those returns an **error string to the model** rather than failing the run — so the
model keeps going, burns turns, and may exit 8. Reads (`read_file`, `grep`, `glob`, `read_directory`,
`web_fetch`, …) are always allowed. The official docs confirm the same table.

**For a commit skill this is the decisive fork:** either pass `--yolo` and let it run `git` itself, or don't
pass it and hand it the diff on stdin. The second is strictly safer and cheaper.

### AI attribution: none ✅

```
$ grep -icE 'co-authored|coauthor|generated with|attribution' cli.mjs   → 0
$ grep -c 'git commit' cli.mjs                                          → 0
```

The bundle contains no commit-message conventions, no `Co-Authored-By` trailer, no 🤖 emoji, nothing. Whatever
the model writes is entirely a function of your prompt (plus `AGENTS.md`/memory/taste/skills — see next
point). CommandCode adds nothing of its own.

### Context that gets injected anyway

`setupConversationContext` (offset 486990) is called by print mode and loads **memory, taste, and skills**:

```js
const a=getEnvironmentContext(), i=await getMemoryContent([]), l=await getTasteContent(),
      c=await loadAllSkillSummaries(), {names:d}=await loadDisabledSkills(),
      u=generateSkillsXML(filterDisabledSkills({summaries:c,disabled:d}))||null,
```

So `AGENTS.md`, the taste profile, and all 68 entries in `~/.commandcode/skills/` are in the prompt on every
headless run. That's context cost you're paying whether you want it or not, and a behavioural coupling: a
skill or an `AGENTS.md` line can change your headless output. `"tasteLearning": false` in this machine's
`config.json` limits the taste side.

MCP is a different story: `getToolSchemas` only adds MCP tools when
`getMcpConnectionManager().isInitialized` (offset 482900), and nothing in the print path initializes it, so
the `mempalace` server in `~/.commandcode/mcp.json` is **not** connected headlessly.
**UNVERIFIED** by execution — settling test: `commandcode -p --verbose 'list your available tools' 2>&1 >/dev/null`
and check whether any `mcp__` tool label appears on stderr.

### Model request parameters are fixed

Offset 487100: `max_tokens: clampMaxOutputTokens({modelId:r,requested:64e3})`, `temperature: .3`,
`stream: !0`. **No flag exposes temperature or max_tokens.** `reasoningEffort` is read from
`config.json` per model, not from a CLI flag (`--effort` is 1.4.x-only).

### Other background side effects on every run

- **Telemetry is unconditional.** `handleUnhandledErrors(), setupTelemetry(), setImmediate(()=>recordCliFingerprintInBackground()), await preRun();` — offset **1267473**, at module top level, before commander. `recordCliFingerprint` POSTs a machine fingerprint (4 s timeout). OpenTelemetry OTLP exporter is in the dependency list. No opt-out flag was found. **UNVERIFIED:** whether `DO_NOT_TRACK` or a `COMMANDCODE_TELEMETRY` env var is honoured — settling test: `grep -oE 'process\.env\.[A-Z_]*(TELEMETRY|TRACK)[A-Z_]*' cli.mjs`.
- **VS Code extension auto-install.** `preRun` schedules `ensureExtensionInstalled()` on a 100 ms unref'd timer. It early-returns on `process.env.CI` (offset 720088) — another reason to set `CI=1`.
- **`Gw.parse()` is synchronous at top level**, so `preRun()`'s awaits (including the update check's `npm view command-code versions --json`, a 5 s subprocess) run before any work.

### auth.json shape

`/Users/mrp/.commandcode/auth.json`, mode `0600`, 282 bytes. Keys and types only, **values redacted**:

```
apiKey            string (93 chars)   ← bearer token, redacted
userId            string (36 chars, UUID shape)
userName          string
keyName           string
authenticatedAt   string (ISO-8601)
```

Used as `Authorization: Bearer <apiKey>` at offset 155400. An env-var override exists (`getApiKeyFromEnv`,
offset 150700) and `status` reports `Source: $<VAR> (env var)` when it's in play — handy for CI without a
login flow.

`config.json` (mode 0600) on this machine:

```json
{"provider":"command-code","installed":true,"model":"xiaomi/mimo-v2.5-pro","firstMessageSent":true,
 "reasoningEffort":{"deepseek/deepseek-v4-pro":"max"},
 "featureModels":{"titleGeneration":"tencent/Hy3","compaction":"tencent/Hy3","toolDescription":"tencent/Hy3",
                  "tasteLearning":"tencent/Hy3","tasteOnboarding":"tencent/Hy3"},
 "tasteLearning":false}
```

Settings resolution order (offset 575400): `<cwd>/.commandcode/settings.local.json` → `<cwd>/.commandcode/settings.json` → `~/.commandcode/settings.json`. Only `hooks` are read from these, and only by the interactive engine.

---

## What this means for a scripted `/commit` skill

### The invocation

Don't let it touch git. Hand it the diff and ask for text back. No `--yolo`, no tools, no hooks, nothing
that can mutate the repo — the shell script already has the diff, and the model's only job is prose.

```bash
#!/usr/bin/env bash
set -uo pipefail          # NOT -e: we want to inspect the exit code ourselves

out=$(mktemp); err=$(mktemp)
trap 'rm -f "$out" "$err"' EXIT

{
  printf 'Write a Conventional Commits message for the staged diff below.\n'
  printf 'Reply with ONLY the commit message. No preamble, no code fences, no attribution trailer.\n'
  printf 'Do not use any tools; everything you need is in this message.\n\n'
  git diff --cached
} | CI=1 COMMANDCODE_SKIP_UPDATES=1 timeout --signal=TERM 90 \
      commandcode -p --no-auto-update --skip-onboarding \
                  --max-turns 4 --model deepseek/deepseek-v4-flash \
      >"$out" 2>"$err"
rc=$?
```

Why each piece:

| Piece | Why |
|---|---|
| stdin, not argv | a diff contains `-` lines, quotes, backticks and newlines; argv can't carry it safely, and a query starting with `-` is dropped by commander |
| `--no-auto-update` | the *only* thing that keeps `Updated X → Y` off stdout |
| `CI=1` | belt-and-braces on the updater, plus skips the VS Code extension auto-install |
| `COMMANDCODE_SKIP_UPDATES=1` | third belt; survives someone unsetting `CI` |
| `--skip-onboarding` | documented as "for non-interactive/automated runs"; avoids the taste-onboarding path |
| `--max-turns 4` | **not 1.** With `--max-turns 1`, *any* tool call the model attempts consumes the only turn and you get exit 8 with empty stdout. 4 leaves room for it to try a tool, get the "requires permissions" error, and answer anyway |
| no `--yolo` | `edit_file`/`write_file`/`shell_command` stay blocked. The model physically cannot `git commit`, `git push`, or write a file. This is the whole safety story |
| `timeout 90` | there is no request timeout in the CLI. Without this a stalled stream hangs your commit forever |
| explicit `--model` | otherwise you inherit `config.json`, which a `/model` switch in an interactive session silently changes under you |

### Detecting failure and falling back

```bash
msg=$(cat "$out")

if [ "$rc" -eq 0 ] && [ -n "${msg// /}" ]; then
    :                                   # good
elif [ "$rc" -eq 3 ]; then
    echo "commandcode: not authenticated (run 'commandcode login')" >&2; fallback
elif [ "$rc" -eq 5 ]; then
    echo "commandcode: rate limited" >&2; fallback
elif [ "$rc" -eq 6 ] || [ "$rc" -eq 7 ]; then
    echo "commandcode: transient network/5xx" >&2; fallback     # retry once is also reasonable
elif [ "$rc" -eq 8 ]; then
    echo "commandcode: hit --max-turns; message may be truncated" >&2; fallback
elif [ "$rc" -eq 9 ]; then
    echo "commandcode: model returned nothing" >&2; fallback
elif [ "$rc" -eq 124 ] || [ "$rc" -eq 130 ]; then
    echo "commandcode: timed out / interrupted" >&2; fallback
elif grep -qi 'insufficient credits' "$err"; then
    echo "commandcode: OUT OF CREDITS" >&2; fallback            # arrives as rc=1 on 0.52.5
elif grep -qi '^Error: unknown model' "$err"; then
    echo "commandcode: bad --model (see 'commandcode --list-models')" >&2; fallback
else
    echo "commandcode: failed (rc=$rc): $(head -1 "$err")" >&2; fallback
fi
```

Cheap pre-flight, one network call, no credits:

```bash
commandcode status --json >/dev/null 2>&1 || { echo "not authenticated"; exit 1; }
```

Version gate, because the docs describe a build you don't have:

```bash
[ "$(commandcode --version 2>/dev/null)" = "0.52.5" ] || echo "warn: CLI changed; re-verify flags" >&2
```

### Every sharp edge, in the order it will bite you

1. **`--output-format json` is silently ignored on 0.52.5.** `allowUnknownOption()` means no error, no
   warning — you get plain text and a script that "works". This applies to every 1.4.x flag in the docs
   (`--effort`, `--theme`, `--config`) and to any typo you make. **Never trust a flag you haven't seen in
   `commandcode --help` on this machine.**
2. **Exit 1 is a bucket.** Insufficient credits, unknown model, empty prompt and every unclassified API
   error share it. Branch on stderr text for those three. Codes 3/4/5/6/7/8/9/130 *are* precise — use them.
3. **Exit 10 does not exist here** despite the docs. If your script special-cases 10 for credits, it will
   never fire.
4. **stdout gets polluted exactly once**, by `Updated X → Y` after a background self-update lands. Coloured,
   `console.log`, ahead of the answer. `--no-auto-update` is not optional.
5. **A pending self-update is live on this machine right now** (`updates.json` → target `1.4.1`, current
   `0.52.5`, `update.lock` holding a PID). When it lands, `--max-turns`' default jumps 10 → 100 and the flag
   surface changes. Pin `--max-turns` explicitly; don't rely on the default.
6. **No request timeout at all.** `timeout(1)` is mandatory, not defensive. `timeout --signal=TERM` is
   handled gracefully (CLI exits 130); a `-k` escalation to SIGKILL leaves a partial transcript.
7. **30-second stdin cap.** `git diff` is instant so this is fine — but if you ever pipe from something slow
   or from a `tee` with a lagging consumer, you get `Error reading from stdin: Timeout` and exit 1.
8. **Never pass argv and stdin together.** argv silently wins; the pipe is never drained and the writer eats
   an EPIPE. Pick one.
9. **`--max-turns 1` is a trap**, as described above. Use 3–4.
10. **Hooks do not fire.** Good for speed and determinism; bad if you were counting on a `PreToolUse` hook to
    police what the agent does. It is not policing a `-p` run.
11. **`--yolo` is the difference between a commit-message generator and a shell-executing agent.** Without
    it, `shell_command` and both file-write tools are hard-blocked in print mode. Keep it off.
12. **`~/.commandcode/projects/` grows unbounded** — one slugified directory per cwd, one `.jsonl` per run.
    Nothing prunes it. Already 72 dirs here.
13. **`AGENTS.md`, taste, and all 68 installed skills are injected into every headless prompt.** A change to
    any of them changes your commit messages. If output stability matters, that's the first thing to check
    when it drifts.
14. **CommandCode adds no attribution of its own** — zero `co-authored` / `generated with` strings — so the
    only attribution risk is whatever the model invents. Say "no attribution trailer" in the prompt and, if
    it matters, strip trailers in the script rather than trusting the model.

### Two open items

| Question | Status | Settling test |
|---|---|---|
| Does credit exhaustion ever arrive as HTTP 403 (→ exit **4**) rather than 400 (→ exit **1**)? | UNVERIFIED — I did not exhaust credits | run any `-p` query with a drained balance and read `$?`; or point `--staging`/`--local` at a stub returning 403 |
| Are MCP servers connected in print mode? | Almost certainly no (no init call in the print path), but not executed | `commandcode -p --verbose 'list your tools' 2>&1 >/dev/null \| grep mcp__` |

---

## Sources

- `/opt/homebrew/lib/node_modules/command-code/dist/cli.mjs` — the shipped bundle, v0.52.5. Byte offsets cited throughout.
- `/opt/homebrew/lib/node_modules/command-code/package.json` — version, bin aliases (`cmd`, `cmdc`, `command-code`, `commandcode`), deps.
- `/opt/homebrew/bin/commandcode` → `../lib/node_modules/command-code/dist/index.mjs` (symlink; `command-code` is the same target).
- `commandcode --help`, `--version`, `--list-models`, `status --json` — run on this machine, 2026-07-27.
- One live `-p` probe on the free `poolside/laguna-s-2.1-free` model.
- `/Users/mrp/.commandcode/{config,settings,mcp,auth,updates,trusted-hooks}.json` — token values redacted, never copied.
- <https://commandcode.ai/docs/core-concepts/headless> — official, but describes **1.4.x**.
- <https://commandcode.ai/docs/reference/cli/models> — official model table.
- `gh repo view CommandCodeAI/command-code` — public, 3,547 stars, but ships only `readme.md` and `.github`. **No source.** The bundle is the only source of truth.
