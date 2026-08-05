# LLM-native / agent-native browsers — what they actually are, and can they do CSS layout?

Research date: 2026-08-04. Sources: project READMEs (raw.githubusercontent.com), GitHub issue/PR titles, and
the Lightpanda repository file tree (GitHub trees API). Web search was unavailable (Firecrawl billing error),
so no third-party benchmark write-ups were consulted — claims below are labelled marketing vs. measured
accordingly.

## TL;DR for our use case (measuring real layout / geometry)

**None of these five gives you trustworthy CSS layout geometry except the ones that are just Chrome underneath.**
Four of the five (Notte, Stagehand, Steel, browser-use) are orchestration layers over Chromium/CDP — they inherit
Blink's full layout engine for free, because they *are* Chrome. The one genuinely new engine, Lightpanda, has a CSS
parser and cascade but **no layout engine at all** — so `getBoundingClientRect()` / offsetWidth-class geometry cannot
be real there.

## Comparison table

| Tool | What it actually is | CSS layout & rendering | Licence / pricing | Token-efficiency mechanism | Claim quality |
|---|---|---|---|---|---|
| **Lightpanda** (`lightpanda-io/browser`) | A **from-scratch headless browser engine in Zig**. Not Chromium, not Blink, not WebKit. Own JS integration (V8), own DOM, own CDP server so Playwright/Puppeteer can drive it. | **Partial CSS, NO layout.** Repo has `src/browser/css/{Parser,Tokenizer,MediaQuery,units}.zig`, `StyleManager.zig`, full CSSOM (`CSSStyleSheet`, `CSSStyleRule`, `CSSStyleDeclaration`) and a `src/cdp/domains/css.zig`. There is **no layout/ or box-tree/ path anywhere in the tree**, and the README states plainly: "No graphical rendering engine". `getComputedStyle` historically returned `""` for every property except `display`/`visibility` (issue #2733, closed 2026-06-30; PR #2836 added inline-`style=` resolution), so cascade-level computed style is *recent and incomplete*. Geometry (`getBoundingClientRect`, offset/client dimensions) has no layout pass to derive from — only `Range.getBoundingClientRect` appears as a PR (#1744). | Open source (see repo LICENSE badge); free binaries + nightly builds. Company sells a hosted cloud. | Not a token story per se — a *resource* story: 123MB peak vs 2GB for 100 pages, 5s vs 46s (~9x faster, ~16x less RAM), from their own `lightpanda-io/demo` benchmark. Also `lightpanda agent <script>.js` runs deterministic, "token-free" scripts against native primitives. | Perf numbers are **self-published, self-run**. The layout gap is **verified from source tree + issue tracker**, not assumed. |
| **Notte** (`nottelabs/notte`) | A Python **agent framework + hosted cloud** on top of Playwright-compatible browser sessions. Adds a "perception layer" that turns page state into a compact natural-language action space, plus stealth sessions, CAPTCHA solving, proxies, secrets vault, digital personas. | **Yes — full layout**, because the underlying runtime is a real Chromium session driven via Playwright-compatible primitives. The perception layer is a *representation* on top, not a replacement engine. | **SSPL-1.0** (not OSI-permissive; copyleft-for-service — matters if you'd ever host it). Cloud requires a Notte API key; free tier at console.notte.cc. | Perception layer collapses raw DOM into a natural-language action space so the LLM sees actions, not markup; plus hybrid workflows — script the deterministic parts, invoke the agent only where reasoning is needed. | README publishes a **WebVoyager-style benchmark table**: Notte 86.2% self-report / 79.0% LLM-eval / 47s per task / 96.6% reliability, vs browser-use 77.3% / 60.2% / 113s / 83.3%. **Vendor-run benchmark against a competitor — treat as marketing.** No explicit "X% fewer tokens" figure appears in the README; the token-reduction framing is qualitative. |
| **Stagehand** (`browserbase/stagehand`) | A **TypeScript wrapper over Playwright** (from Browserbase) exposing three primitives — `act` / `extract` / `observe` — that you mix freely with normal Playwright code. Runs locally or on Browserbase cloud. | **Yes — full layout.** It is Playwright/Chromium; nothing about layout is reimplemented. | **MIT.** Library free; Browserbase hosting is paid. | The strongest *cost* story of the five: **preview-then-replay**. `observe` returns a candidate action you can inspect before executing; actions are **cached and replayed without LLM inference**, with "self-healing" that re-invokes the model only when the page changes and the cached selector breaks. So repeat runs approach zero marginal token cost. | Mechanism is concrete and inspectable in the API design, but the README gives **no measured token/cost deltas**. |
| **Steel** (`steel-dev/steel-browser`) | An **open-source browser API / session infrastructure** — a Chromium instance wrapped in a REST + CDP service with session management, proxies, anti-detect, file handling, one-click deploys (Render etc.). Infrastructure, not an agent framework and not an engine. | **Yes — full layout.** It's Chrome behind an API. | **Apache 2.0** — the most permissive of the set. Self-host free; Steel Cloud is the paid product. | **None specific.** Steel is a transport/session layer; token efficiency is whatever your agent framework does on top. Any "LLM-native" framing here is positioning, not a mechanism. | Straightforwardly infra; few claims to discount. |
| **browser-use** (`browser-use/browser-use`) | A **Python agent library** that drives a real browser (Chromium via CDP/Playwright) and feeds an LLM a **serialised DOM of indexed interactive elements** — each clickable/typable node gets a numeric index the model references (`click 12`), typically alongside a screenshot for vision models. | **Yes — full layout**, inherited from Chrome. Notably, its element filtering *depends* on real layout: visibility and hit-testing decide which nodes make it into the indexed list. This is exactly the capability Lightpanda lacks. | **MIT** for the library. Free and runs locally; you pay only your LLM provider (or use their hosted service). | Indexing itself is the compression: instead of raw HTML, the model gets a flat numbered list of actionable elements. Payload size is **not stated in the README** — in practice it scales with interactive-element count, commonly a few thousand tokens per step on a normal page and much worse on dense apps. Treat any specific figure as unverified here. | README is honest and light on cost claims; the competitive numbers cited *about* browser-use come from Notte's own table. |

## Verdicts

- **Lightpanda** — The only real engineering novelty in this list, and the only one that could ever be cheap at
  thousands of concurrent sessions. But for anything that needs to know *where things are on the page*, it is
  disqualified today: CSS is parsed and cascaded, never laid out. Its own README says "no graphical rendering
  engine", and the absence of any layout path in the source tree confirms that goes deeper than just not painting
  pixels. Watch it; don't measure layout with it.
- **Notte** — Interesting perception-layer idea and the boldest efficiency claims, but SSPL licensing and a
  vendor-run benchmark that conveniently beats browser-use mean the numbers need independent replication before
  you cite them.
- **Stagehand** — Best answer if the goal is *not re-paying the model on every run*. Caching + replay is a real
  mechanism, MIT-licensed, and composes with plain Playwright so you can drop to raw APIs for geometry.
- **Steel** — Solid Apache-2.0 infrastructure. Don't expect token savings from it; it's the plumbing layer.
- **browser-use** — The reference implementation of DOM-indexing for agents, MIT, easy to run locally. Its
  indexed-element payload is the thing to measure if payload size matters to you.

## Caveats

- Web search and managed extraction were unavailable during this survey; findings come from primary repo content only.
- Pricing for the hosted tiers (Browserbase, Steel Cloud, Notte Console, Lightpanda Cloud) was not fetched — only
  the open-source licences are stated above.
- The browser-use payload size figure is explicitly **not** sourced; it needs a direct measurement before use.
