---
name: seo-blog-writer
description: "Turn raw notes, scripts, or transcripts into an SEO and AI-citation blog post with humanizer anti-AI editing. Use when writing or rewriting a blog post, technical article, or stack guide from source notes that must rank in search, earn AI citations, and avoid AI-writing tells."
---

<what-to-do>

Turn source material (a script, transcript, or rough notes) into a published Markdown blog post that combines three passes in strict order:

1. **Content strategy** (`content-strategy`): search intent and information gain.
2. **AI SEO structure** (`ai-seo`): extractable answer blocks, a single summary table, and query fan-out FAQs.
3. **Humanizer edit** (`humanizer` §1-§26): voice alignment, fact-ledger check, and removal of AI structural and lexical tells.

Do not merge drafting and humanizing into one pass. Complete each step's exit check before starting the next step.

</what-to-do>

<supporting-info>

## Workflow

### Step 1: Build the verified fact and limit ledger

Read every source file end to end before drafting. Build a ledger with five columns for every item in the source:

`Area | Pick & Version | Mechanism | Limit / Tradeoff | Source & Verification`

Rules for the ledger:
1. **Fix spoken transcript errors.** Transcripts often misname tools (for example, `RevenueKit` instead of `RevenueCat`). Verify every package name, version number, and primary documentation URL with web search before recording it.
2. **Separate measured facts from third-party claims.** When the source quotes a benchmark or percentage the author did not measure (for example, `"30x faster"` or `"2% of apps"`), mark the row `attributed: <speaker/source>`. In the draft, attribute that number to the source and state that you did not re-run the benchmark.
3. **Require a limit for every pick.** If the source gives only praise for a tool, extract its real operational tradeoff (migration cost, lock-in, dev-build requirement, pricing tier, or learning curve) before moving on.

**Completion criterion:** Every category in the source has a row in the ledger, every version and URL is verified live, and every unmeasured number is marked `attributed`.

### Step 2: Lock target-site voice and domain terms

If the user names a target site or repository:
1. Read `CONTEXT.md` or `GLOSSARY.md` in that repository to learn required and avoided domain terms.
2. Read one existing blog post, prototype, or maintainer note in that repository.
3. Record four voice rules from that sample:
   - Person (`I` vs `we`)
   - Typical sentence length
   - Punctuation habits (whether the writer uses em dashes; if no sample exists, ban em and en dashes)
   - How the site frames opinions (for example, recommendation paired with its limit)

**Completion criterion:** The voice profile and domain vocabulary list are written down before any article prose is drafted.

### Step 3: Build the SEO and AI-citation skeleton

Apply the `content-strategy` and `ai-seo` rules to build the outline before writing body paragraphs:

1. **Information-gain gate (`content-strategy`):** Write one sentence stating what this post adds that top search results omit (for example, every pick includes its limit, plus specific tool swaps against a named baseline). If you cannot state the information gain in one sentence, stop and ask the user for the angle.
2. **Frontmatter and H1 (`content-strategy`):** Put the primary search topic and year in the YAML `title`, YAML `description`, and `H1`. Use sentence case for the `H1` and all subheadings.
3. **Lead answer block (`ai-seo`):** Make paragraph 1 a 40-to-60-word self-contained answer that names the primary picks and versions directly. Do not open with a story, throat-clearing, or a complaint about how hard the ecosystem is.
4. **Master summary table (`ai-seo`):** When the post covers 3 or more areas, place one Markdown table right after the intro that lists every area in one view (`Area | Pick | Limit`). Do not split the summary across multiple tables.
5. **Area sections (`ai-seo`):** Create one `H2` per area in the same order as the summary table. Each section must state:
   - The pick and version
   - The one mechanism that justifies it
   - The limit or when to pick the alternative
   - A link to primary documentation or changelog where relevant
6. **Query fan-out FAQ (`ai-seo`):** Add a final `H2` with 4 to 6 `H3` questions written the way developers type them into search or chat (`"Should I use X or Y?"`, `"Do I need Z?"`). Start each `H3` answer with a standalone 40-to-60-word direct verdict.

**Completion criterion:** The skeleton has frontmatter, a 40-to-60-word lead answer, one complete summary table covering all areas, one `H2` per area, and 4 to 6 fan-out `H3` questions.

### Step 4: Write the draft from the ledger

Write the full draft into the target Markdown file using only claims present in the Step 1 ledger.

Hard rules during drafting:
- **Zero invented personal history.** Do not invent bugs, weekend outages, team stories, or production incidents that are not in the source material.
- **Attribute borrowed reasons.** When a recommendation comes from a reference video or talk (such as Simon Grimm or Jay Meistrich), name that speaker and link the source.
- **Vary sentence length.** Alternate short verdicts (5 to 10 words) with longer mechanism sentences (15 to 25 words).

**Completion criterion:** The complete draft is written to disk and every factual claim maps to a row in the Step 1 ledger.

### Step 5: Run the dedicated Humanizer pass (`humanizer` §1-§26)

Re-read the draft from disk as a separate step. Check the entire text against all six pattern groups below and edit in place:

#### Group A: Staging instead of stating (§1-§5)
- **§1 Not X, but Y:** Cut `"It is not X, it is Y"`, `"not just X, but Y"`, and `"This does not mean X. It means Y."` State the positive claim directly. Keep a contrast only when comparing two real tools in the ledger.
- **§2 One-line closers and fragments:** Cut standalone one-line paragraphs that repeat the point (`"That is the real win."`, `"That is how apps feel premium."`, `"Read that again."`).
- **§3 Deep-sounding sayings:** Cut `"at its core"`, `"the real question is"`, `"what really matters"`, `"the heart of the matter"`, and `"X is the currency/language of Y"`.
- **§4 Staged run-ups:** Cut YouTube and blog transitions inherited from spoken scripts (`"Let's dive in"`, `"Here is where it gets interesting"`, `"And here is the big news"`, `"Here's the thing"`, `"Honestly?"`).
- **§5 Arguing with no one:** Cut `"I'm not saying..."`, `"To be clear..."`, `"Don't get me wrong..."`, and fake strawman alternatives.

#### Group B: Rhythm by rule (§6-§11)
- **§6 Forced triads:** Break up three-adjective and three-noun chains written only for rhythm. Keep three items only when the technical fact has three parts.
- **§7 Repeated sentence openings:** Merge or vary adjacent sentences that start with the same subject or pronoun.
- **§8 Dashes as universal connectors:** Remove every em dash (`—`), en dash (`–`), and spaced double hyphen (` -- `) in prose unless the user's writing sample uses them. Use a period, comma, colon, or parentheses instead.
- **§9-§11 Qualifiers, hyphens, passive voice:** Cut stacked hedges (`"could potentially"`), drop hyphens on compound modifiers after a noun (`"is type safe"`, `"is well documented"`), and use active voice.

#### Group C: Inflation and borrowed authority (§12-§18)
- **§12 Watch words:** Delete or replace every occurrence of: `actually`, `additionally`, `align with`, `bolstered`, `crucial`, `deep dive`, `delve`, `enduring`, `enhance`, `garner`, `highlight` (verb), `interplay`, `intricate`, `key` (adjective), `landscape`, `meticulous`, `pivotal`, `quietly`, `robust`, `seamless`, `showcase`, `tapestry`, `testament`, `underscore`, `valuable`, `vibrant`.
- **§13 Inflated significance:** Cut `"marks a pivotal moment"`, `"evolves the ecosystem"`, and send-off paragraphs (`"The future looks bright"`, `"The ecosystem is more stable than ever"`). End on a concrete fact or question.
- **§14-§18 Vague links, `-ing` riders, sales words, fancy copulas:** Cut trailing participial clauses (`"...ensuring seamless performance"`, `"...highlighting its speed"`). Replace `"serves as"`, `"stands as"`, `"boasts"`, and `"features"` with `is`, `are`, or `has`.

#### Group D: Formatting by rule (§19-§21)
- **§19 Bold as decoration:** Do not use bullet lists where every item starts with `**Bold Label:**`. Use a table for parallel records or write plain prose paragraphs.
- **§20 Decorative headings:** Use sentence case on every heading. Do not put emojis, arrows (`→`), or horizontal rules (`---`) between sections.

#### Group E & F: Leftovers and meta-narration (§22-§26)
- **§22-§23 Chatbot residue and disclaimers:** Cut greetings, sign-offs, and `"as of [date] / based on available information"` disclaimers.
- **§24 Heading repeated in first sentence:** Do not follow a heading with a short sentence that repeats the heading topic (`## Performance` followed by `"Performance matters."`). Start with the pick or mechanism.
- **§25 Writing about the document instead of its subject:** Cut sentences that describe the article's own layout (`"The table below shows all nine areas"`, `"In this section we cover"`, `"The notes under it are..."`). Let the table and headings speak for themselves.

### Step 6: Run the automated verification gate

Run this command against the output file before presenting it:

```bash
grep -nEi '—|–| -- |\b(actually|additionally|bolstered|crucial|deep dive|delve|enduring|enhance|garner|interplay|intricate|landscape|meticulous|pivotal|quietly|robust|seamless|showcase|tapestry|testament|underscore|valuable|vibrant|serves as|stands as|boasts|let'\''s dive in|here is the thing|at its core|table below|section below|in this article)\b' "<output-file>"
```

1. Every match outside a quoted title, code block, or URL must be rewritten.
2. Re-check every first-person claim against the Step 1 ledger and delete any unverified personal anecdote.
3. If the user asked to open the file, run `open "<output-file>"` after the check passes.

**Completion criterion:** The `grep` gate returns zero unapproved matches, zero sentences describe the document's layout (§25), and every factual or personal claim exists in the Step 1 ledger.

## Companion skills note

If you ever install the three upstream reference skills onto a new machine with the Skills CLI, install them in separate commands (`npx skills add` only installs the first package argument per invocation):

```bash
npx skills add coreyhaines31/marketingskills@content-strategy -g -y
npx skills add coreyhaines31/marketingskills@ai-seo -g -y
npx skills add blader/humanizer@humanizer -g -y
```

</supporting-info>
