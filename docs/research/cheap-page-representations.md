# Cheap page representations for LLM-driven UI verification

Written 2026-08-04. The delegated research agent for this topic died on an HTTP 524
before it could save, so this file is assembled from **first-hand measurement against
this repo** plus the installed `chrome-devtools-mcp` binary's own `--help` and MCP
`tools/list` output. Every number below was produced locally; nothing here is quoted
from a vendor page.

## 1. What each representation of one page actually costs

Measured on `http://localhost:3000/` (the catalogue, 48 cards) at 1440×900, production
build, via Playwright + CDP. Token estimates use the standard ~4 chars/token rule; the
screenshot figure is per-tile vision billing, not bytes.

| Representation | Size | ~Tokens | Ratio vs targeted read |
|---|---:|---:|---:|
| CDP `Accessibility.getFullAXTree` (3,843 nodes) | 1,219,715 ch | ~304,929 | 8,470× |
| Raw `outerHTML` | 378,556 ch | ~94,639 | 2,629× |
| A11y tree trimmed to role+name (1,365 nodes) | 47,830 ch | ~11,958 | 332× |
| `locator('body').ariaSnapshot()` | 21,799 ch | ~5,450 | 151× |
| Screenshot 1440×900 (vision) | 187,022 B | ~1,100 | 31× |
| **Scoped `ariaSnapshot()`, one card** | 70 ch | **~18** | 0.5× |
| **Targeted `page.evaluate()` of 5 CSS values** | 145 ch | **~36** | 1× |
| Assertion verdict line (`PASS 08.1 …`) | 31 ch | ~8 | 0.2× |

**The spread between a whole-page snapshot and a targeted read is ~150×.** Against the
raw a11y tree it is ~8,470×.

The decisive point: a scoped snapshot of a single component costs ~18 tokens, versus
~5,450 for the same call on `body`. Scope is the single biggest lever available, and it
requires no new tooling — just passing a locator.

## 2. The decision rule

> **If the expected value is known in advance, never send the page to a model.**

Ticket 08 says `grid-template-columns` must be five 208px tracks with a 28px row-gap and
a 24px column-gap. That is a fact with a known answer. The cheapest correct mechanism is
a `page.evaluate()` returning those five values and a code-level equality check: ~36
tokens of evidence, 0 tokens of reasoning, and a deterministic verdict.

Sending an a11y snapshot to a model and asking "is the grid right?" costs ~5,450 tokens,
is non-deterministic, and is *less* accurate — the a11y tree does not even carry
computed CSS, so the model would be guessing.

An LLM-in-the-loop browser is genuinely required only when:

1. **The expected value is not known in advance** — "does this look like the Studio Dark
   mock?", motion feel, overlay polish. In this repo that is ~2% of acceptance bullets.
2. **The failure is open-ended** — something broke and you need a hypothesis, not a
   boolean.
3. **The selector is unknown** — exploratory clicking to find the control, once, before
   freezing it into a spec.

Everything else is an assertion. In this repo that is ~74% of the 251 acceptance bullets.

## 3. `toMatchAriaSnapshot` — the cheap regression primitive

`ariaSnapshot()` yields a compact YAML rendering of the accessibility tree — roles,
accessible names and structure, no styling, no markup noise:

```yaml
- link "Wheel Picker":
  - /url: /recording/01KAY9B2AMN590C8YP5WTNDTHQ
```

Key properties for a redesign:

- **It is scopeable.** `page.locator('…').ariaSnapshot()` snapshots one subtree. This is
  the ~18-token vs ~5,450-token difference measured above.
- **Snapshots live on disk**, as `.aria.yml` files beside the spec, updatable with
  `--update-snapshots`. Diffs are reviewed in git like any other file.
- **Zero LLM tokens** — the comparison is done by the test runner. A model only ever sees
  a failure diff, and only if one occurs.
- It asserts *semantic structure*, which is what a restyle should preserve. It will not
  catch a colour change, and it should not.

## 4. `chrome-devtools-mcp` flags — measured, not documented

Tool counts obtained by speaking MCP over stdio to the installed server and calling
`tools/list` under three configurations:

| Configuration | Tools | Notes |
|---|---:|---|
| default (all categories) | **29** | full surface |
| `--categoryNetwork=false --categoryPerformance=false` | **24** | drops 5 |
| `--slim` | **3** | drops 29, renames the rest |

`--slim` exposes only `evaluate`, `navigate`, `screenshot` — and **renames** them
(`evaluate`, not `evaluate_script`). It removes `take_snapshot`, `click`, `resize_page`,
`fill`, `hover`, `press_key`, and all performance tooling.

`--categoryNetwork=false --categoryPerformance=false` drops exactly:
`get_network_request`, `list_network_requests`, `performance_analyze_insight`,
`performance_start_trace`, `performance_stop_trace`.

> **Pitfall.** A slimming flag chosen for token efficiency can silently remove the exact
> tool a task needs. `--slim` looks attractive for cost but deletes `take_snapshot` and
> every interaction tool. Always enumerate `tools/list` under a candidate flag set before
> committing to it — do not infer the surface from the docs.

Useful for this repo, and already in `.mcp.json`: `--headless`, `--isolated`,
`--viewport 1440x900`, `--screenshotFormat webp`, `--screenshotMaxWidth 1200`
(WebP/JPEG are ~3-5× smaller than PNG), `--no-performance-crux`, `--no-usage-statistics`.
These parse correctly — yargs accepts the `--no-` negation form.

## 5. Scoped / filtered snapshots by tool

| Tool | Scoping mechanism |
|---|---|
| Playwright (library) | `locator.ariaSnapshot()` — arbitrary subtree. **Best control.** |
| playwright-mcp | ref-based targeting; snapshot is page-level |
| chrome-devtools-mcp | `take_snapshot` is page-level; `evaluate_script` gives full control for targeted reads |
| browser-use | indexed interactive elements only — filtering is the compression |
| Notte | "perception layer" → NL action space (no published token figure) |

For known-value checks, `evaluate_script` / `page.evaluate()` beats every snapshot
mechanism, because it returns *only the values under test*.

## 6. Recommendation for rnui.dev

1. **Assertions for the ~74%.** Deterministic CSS, geometry, text, URL and event bullets
   become Playwright specs. Zero LLM tokens to run.
2. **Report failures as compact JSON.** A full run's report for the probe set measured
   **331 chars ≈ 83 tokens**. That is the entire payload a model needs.
3. **Read the exit code, not the tail.** `--reporter=json` plus the process exit code.
   Piping to `tail` returns *tail's* status and will report a red run as green — observed
   in this very session.
4. **`ariaSnapshot` for structural regression**, scoped to components.
5. **Vision only for the ~2%** that is genuinely subjective.

## Caveats

- Token figures use the ~4 chars/token heuristic; exact tokenisation varies by model.
- Screenshot cost (~1,100) is a typical per-tile vision figure, not measured billing.
- Measured on one page of one app on one machine. The *ratios* are the durable finding.
