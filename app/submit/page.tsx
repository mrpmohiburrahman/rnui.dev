"use client"

// app/submit/page.tsx
//
// The page a stranger uses to send rnui.dev their work.
//
// A sibling of app/contactus/page.tsx rather than a new design: the same eyebrow,
// the same field and label classes, the same full-width accent button, and the
// same NOT SENT / SENT idiom at the foot.
//
// The field list is not invented here. It is what a Recording needs, taken from
// data/recording.ts and `.claude/skills/add-recording/SKILL.md`, so publishing a
// Submission stays mechanical for the maintainer rather than a transcription
// exercise.
//
// Two orderings are deliberate, and they are why this file is not simpler:
//
//   1. **The size rule runs the moment a file is picked**, before compression
//      starts and before the Turnstile widget is even rendered. The transcode is
//      tens of seconds (21.3s for a 4.46 MB 1080p clip, measured); discovering
//      the file was too large afterwards spends a visitor's time on real work
//      that was never going to be sent.
//   2. **Compression runs next** (ticket 06), and **the widget renders last**,
//      once a compressed file exists. A token lives 300 seconds, so one minted
//      before a transcode that takes minutes is dead before Submit can be
//      pressed. This is why the widget is not rendered on page load, and moving
//      it earlier would break it.
//
// public-submissions ticket 05, with ticket 06's compression step and ticket 11's
// discovery. Both have landed: the transcode sits between the size check and the
// widget, and the three entrances to this page are the footer, the Contributors
// page, and the sitemap (on purpose, see next-sitemap.config.js).
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react"
import Link from "next/link"
import { CATEGORIES } from "@/data/categories"

import {
  COMPRESSED_DEMO_NAME,
  COMPRESSION_NOTICE,
  formatSize,
} from "@/lib/demo-compression"
import {
  compressDemo,
  type CompressionPhase,
} from "@/lib/demo-compression-runner"
import {
  PRIVACY_PATH,
  SUBMISSION_DISCLOSURE_BODY,
  SUBMISSION_DISCLOSURE_POLICY_SENTENCE,
} from "@/lib/submission-consent"
import {
  DEMO_ACCEPT,
  DEMO_FIELD,
  hasErrors,
  SUBMISSION_FIELD,
  SUBMIT_ENDPOINT,
  validateSubmission,
  type SubmissionErrors,
  type SubmissionFields,
  type TextWireField,
} from "@/lib/submission-form"
import { TURNSTILE_FIELD } from "@/lib/turnstile-shared"
import {
  TurnstileWidget,
  type TurnstileHandle,
} from "@/components/turnstile-widget"

type Status = "idle" | "submitting" | "done" | "failed"

/** Every Category, alphabetically. The table is the only source of these. */
const CATEGORY_OPTIONS = Object.keys(CATEGORIES).sort((a, b) =>
  a.localeCompare(b)
)

const MB = 1024 * 1024

/**
 * The form's geometry, lifted from app/contactus/page.tsx rather than restated.
 * `min-h-[40px]` is the phone metric and md restores the desktop 34px, so the
 * touch target clears the 44px floor only on the submit.
 */
/**
 * The control geometry, deliberately without a text colour.
 *
 * Split from `fieldClass` because the Category select needs a different colour
 * while it still reads "Choose one...". Two colour utilities on one element do not
 * resolve by their order in the attribute: they have equal specificity, so the
 * stylesheet decides, which is not something this file can see. So exactly one of
 * `text-t1` and `text-t3` is applied, never both.
 */
const fieldBase =
  "min-h-[40px] w-full rounded-[10px] border border-line bg-field px-[11px] text-[12.5px] placeholder:text-t3 focus:border-acc focus:shadow-[0_0_0_3px_var(--acc-soft)] focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-2 md:h-[34px] md:min-h-0"
const fieldClass = `${fieldBase} text-t1`
const labelClass = "pb-[2px] font-mono text-[9px] tracking-[0.14em] text-t3"

/** One field's refusal, rendered under the field it belongs to. */
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="m-0 pt-[3px] text-[11px] leading-[1.4] text-fail">
      {message}
    </p>
  )
}

/**
 * A label, with its obligation stated on the label itself.
 *
 * Six of these fields cannot be left blank and three can, and until now nothing
 * on the page said which was which. An accent asterisk for required, and the word
 * OPTIONAL for the other three, rather than one bare asterisk explained by a
 * legend elsewhere: a legend is one more thing to find, and the optional fields
 * are exactly the ones a visitor would otherwise fill in with something.
 */
function FieldLabel({
  htmlFor,
  children,
  optional = false,
}: {
  htmlFor: string
  children: ReactNode
  optional?: boolean
}) {
  return (
    <label htmlFor={htmlFor} className={labelClass}>
      {children}
      {optional ? (
        <span className="text-t3"> (OPTIONAL)</span>
      ) : (
        <span aria-hidden="true" className="text-acc">
          {" *"}
        </span>
      )}
    </label>
  )
}

export default function SubmitPage() {
  const [values, setValues] = useState<Omit<SubmissionFields, "fileBytes">>({
    contributor: "",
    email: "",
    github: "",
    linkedin: "",
    twitter: "",
    caption: "",
    category: "",
    source: "",
    consent: false,
  })
  const [file, setFile] = useState<File | null>(null)
  /**
   * The compressed Demo, which is the only thing that may be sent.
   *
   * Null until compression succeeds, and `canSubmit` requires it, so there is no
   * path from "a file is chosen" to "a request is made" that skips the transcode.
   * Ticket 06's acceptance forbids a silent pass-through of the raw file, and this
   * is where that is enforced rather than promised.
   */
  const [compressed, setCompressed] = useState<{
    blob: Blob
    bytes: number
  } | null>(null)
  const [compressPhase, setCompressPhase] = useState<CompressionPhase | null>(
    null
  )
  /** 0..1 while compressing, only ever shown when the browser reports it. */
  const [compressRatio, setCompressRatio] = useState<number | null>(null)
  const [compressing, setCompressing] = useState(false)
  /** Cancel is `abort()` rather than a flag: the runner terminates the worker. */
  const compression = useRef<AbortController | null>(null)

  // Leaving the page mid-transcode would otherwise leave a WASM worker busy in a
  // tab the visitor has already left, and a `setState` on a component that is
  // gone. React runs this on unmount only.
  useEffect(() => () => compression.current?.abort(), [])
  const [errors, setErrors] = useState<SubmissionErrors>({})
  const [status, setStatus] = useState<Status>("idle")
  /**
   * Whether the maintainer was told, which is the only thing the success copy
   * branches on (submission-receipt ticket 06). Defaults to `false`, so a response
   * that somehow lacks the field promises nothing rather than promising by accident.
   */
  const [notified, setNotified] = useState(false)
  const [serverMessage, setServerMessage] = useState("")
  const [token, setToken] = useState("")
  const turnstile = useRef<TurnstileHandle>(null)

  /** `fileBytes` is derived, never stored, so the two cannot disagree. */
  const fields: SubmissionFields = { ...values, fileBytes: file?.size ?? null }

  const text =
    (key: TextWireField) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }))

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null
    cancelCompression()
    setFile(picked)
    setCompressed(null)
    // A token belongs to the attempt that minted it, so a new file invalidates
    // it. The widget remounts below and mints a fresh one.
    setToken("")
    setStatus("idle")
    setServerMessage("")
    // Only the file's own error is touched here. Validating every field would
    // shout at a visitor about a form they have not started filling in.
    const next = validateSubmission({
      ...values,
      fileBytes: picked?.size ?? null,
    })
    setErrors((prev) => ({ ...prev, fileBytes: next.fileBytes }))
    // Compression starts only once the size rule has passed, which is the
    // ordering this file's header records. Refusing first is the difference
    // between a visitor losing a second and losing tens of seconds.
    if (picked && !next.fileBytes) void startCompression(picked)
  }

  /** Stop a transcode in flight. Safe to call when none is running. */
  function cancelCompression() {
    if (!compression.current) return
    compression.current.abort()
    compression.current = null
    setCompressing(false)
    setCompressPhase(null)
    setCompressRatio(null)
  }

  /**
   * Compress the chosen file, and report every outcome as a sentence.
   *
   * `compressDemo` resolves to a refusal rather than throwing for all three
   * failure kinds, so there is one branch here and no way for an error path to
   * end in "send the original" by being forgotten.
   */
  async function startCompression(picked: File) {
    const controller = new AbortController()
    compression.current = controller
    setCompressing(true)
    setCompressPhase("downloading")
    setCompressRatio(null)

    const result = await compressDemo(picked, {
      signal: controller.signal,
      onPhase: setCompressPhase,
      onProgress: setCompressRatio,
    })

    // A newer file, or a cancel, replaced this attempt while it ran. Its result
    // belongs to a file that is no longer the one chosen, so it is dropped: the
    // alternative is showing sizes for a file the visitor already replaced.
    if (compression.current !== controller) return
    compression.current = null
    setCompressing(false)
    setCompressPhase(null)
    setCompressRatio(null)

    if (result.ok) {
      setCompressed({ blob: result.blob, bytes: result.bytes })
      setErrors((prev) => ({ ...prev, fileBytes: undefined }))
      return
    }
    setCompressed(null)
    setErrors((prev) => ({ ...prev, fileBytes: result.message }))
  }

  function clearFile() {
    cancelCompression()
    setFile(null)
    setCompressed(null)
    setToken("")
    setStatus("idle")
    setServerMessage("")
    setErrors((prev) => ({ ...prev, fileBytes: undefined }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const found = validateSubmission(fields)
    setErrors(found)
    // `compressed` is required, not merely expected: this is the guard that makes
    // "the compressed bytes are what the endpoint receives" true rather than
    // intended. Without it a visitor whose transcode failed could still submit.
    if (hasErrors(found) || !file || !compressed) return

    setStatus("submitting")
    setServerMessage("")

    try {
      const body = new FormData()
      // Named from SUBMISSION_FIELD rather than written out here, because the
      // route handler reads these by the same names and nothing type-checks that
      // the two agree. The map's comment records the failure that prevents.
      body.set(SUBMISSION_FIELD.contributor, values.contributor.trim())
      body.set(SUBMISSION_FIELD.github, values.github.trim())
      body.set(SUBMISSION_FIELD.linkedin, values.linkedin.trim())
      body.set(SUBMISSION_FIELD.twitter, values.twitter.trim())
      body.set(SUBMISSION_FIELD.caption, values.caption.trim())
      body.set(SUBMISSION_FIELD.category, values.category)
      body.set(SUBMISSION_FIELD.source, values.source.trim())
      // Sent, and required by the handler, rather than assumed on the server's
      // side: lib/submission-form.ts records why the tick travels at all.
      body.set(SUBMISSION_FIELD.consent, String(values.consent))
      body.set(TURNSTILE_FIELD, token)
      // The compressed bytes, never the chosen file. Ticket 06's entire point is
      // that only the smaller file leaves the device, so this line is where that
      // is either true or not. The blob carries `video/mp4`, which the route
      // requires of the part's declared type.
      body.set(DEMO_FIELD, compressed.blob, COMPRESSED_DEMO_NAME)

      const res = await fetch(SUBMIT_ENDPOINT, { method: "POST", body })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        notified?: boolean
        message?: string
      }
      if (!res.ok || data.ok !== true) {
        throw new Error(data.message || "The submission could not be sent.")
      }
      setStatus("done")
      setNotified(data.notified === true)
    } catch (err) {
      setStatus("failed")
      setServerMessage(
        err instanceof Error ? err.message : "The submission could not be sent."
      )
    } finally {
      // Tokens are single-use, so this is what makes a retry work at all:
      // without it the second attempt sends a token already spent and is refused
      // with `timeout-or-duplicate`, which reads to a visitor as a broken form.
      turnstile.current?.reset()
    }
  }

  const busy = status === "submitting"
  // The button waits on two things, and both are honest: a verified token, so a
  // visitor is never shown a Submit control with nothing to send, and a finished
  // transcode, so pressing it can only ever send the compressed Demo.
  const canSubmit =
    Boolean(compressed) && Boolean(token) && !busy && !compressing

  return (
    <div className="max-w-[720px]">
      <span className="block pb-[2px] font-mono text-[9px] tracking-[0.14em] text-t3">
        SUBMIT
      </span>
      <h1 className="m-0 text-hero text-t1">Send us a Demo</h1>
      <p className="mt-[9px] max-w-[520px] text-[13px] leading-[1.5] text-t2">
        Built something worth showing? Send the screen recording and the details
        below. The maintainer looks at every one, and publishes the ones that
        fit the catalogue. Include an email address so you can be reached about
        it.
      </p>

      {/* The same one-panel form as /contactus: 14px pad, 12px radius,
          border-line on bg-well, one column inside a 520px measure. */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-[18px] max-w-[520px] rounded-panel border border-line bg-well p-3.5"
      >
        <div className="flex flex-col gap-[12px]">
          <div className="flex flex-col gap-[4px]">
            <FieldLabel htmlFor="contributor">NAME TO CREDIT</FieldLabel>
            <input
              id="contributor"
              type="text"
              value={values.contributor}
              onChange={text("contributor")}
              className={fieldClass}
              autoComplete="name"
            />
            <FieldError message={errors.contributor} />
          </div>

          <div className="flex flex-col gap-[4px]">
            <FieldLabel htmlFor="email">EMAIL</FieldLabel>
            <input
              id="email"
              type="email"
              value={values.email}
              onChange={text("email")}
              className={fieldClass}
              autoComplete="email"
              inputMode="email"
            />
            <FieldError message={errors.email} />
          </div>

          <div className="flex flex-col gap-[4px]">
            <FieldLabel htmlFor="caption">CAPTION</FieldLabel>
            <input
              id="caption"
              type="text"
              value={values.caption}
              onChange={text("caption")}
              className={fieldClass}
            />
            <FieldError message={errors.caption} />
          </div>

          <div className="flex flex-col gap-[4px]">
            <FieldLabel htmlFor="category">CATEGORY</FieldLabel>
            {/* Greyed while it still reads "Choose one…". A select cannot use
                `::placeholder`, so without this the prompt renders at full
                contrast and reads as a Category that has already been chosen. */}
            <select
              id="category"
              value={values.category}
              onChange={text("category")}
              className={`${fieldBase} ${values.category ? "text-t1" : "text-t3"}`}
            >
              <option value="">Choose one…</option>
              {CATEGORY_OPTIONS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <FieldError message={errors.category} />
          </div>

          <div className="flex flex-col gap-[4px]">
            <FieldLabel htmlFor="source">SOURCE</FieldLabel>
            <input
              id="source"
              type="url"
              value={values.source}
              onChange={text("source")}
              placeholder="https://"
              className={fieldClass}
              autoComplete="url"
            />
            <FieldError message={errors.source} />
          </div>
        </div>

        {/* Handles are optional and are always bare slugs, with no `@` and no URL.
            Deliberately no placeholder on any of the three: a plausible-looking
            handle reads as a suggestion, and grey text naming somebody is the kind
            of thing a visitor copies. The rule is carried by the refusal message
            instead, which names the field and says what it accepts. */}
        <div className="mt-[12px] grid grid-cols-1 gap-[12px] sm:grid-cols-3">
          <div className="flex flex-col gap-[4px]">
            <FieldLabel htmlFor="github" optional>
              GITHUB
            </FieldLabel>
            <input
              id="github"
              type="text"
              value={values.github}
              onChange={text("github")}
              className={fieldClass}
            />
            <FieldError message={errors.github} />
          </div>
          <div className="flex flex-col gap-[4px]">
            <FieldLabel htmlFor="linkedin" optional>
              LINKEDIN
            </FieldLabel>
            <input
              id="linkedin"
              type="text"
              value={values.linkedin}
              onChange={text("linkedin")}
              className={fieldClass}
            />
            <FieldError message={errors.linkedin} />
          </div>
          <div className="flex flex-col gap-[4px]">
            <FieldLabel htmlFor="twitter" optional>
              X
            </FieldLabel>
            <input
              id="twitter"
              type="text"
              value={values.twitter}
              onChange={text("twitter")}
              className={fieldClass}
            />
            <FieldError message={errors.twitter} />
          </div>
        </div>

        <div className="mt-[12px] flex flex-col gap-[4px]">
          <FieldLabel htmlFor="demo">DEMO (UP TO 5 MB)</FieldLabel>
          <input
            id="demo"
            type="file"
            accept={DEMO_ACCEPT}
            onChange={handleFile}
            className={`${fieldClass} file:mr-[9px] file:rounded-[7px] file:border-0 file:bg-acc file:px-[9px] file:py-[4px] file:text-[11px] file:text-on-acc`}
          />
          {file && (
            <p className="m-0 flex items-baseline gap-[8px] pt-[3px] text-[11px] tabular-nums text-t2">
              <span>
                {file.name} · {(file.size / MB).toFixed(2)} MB
              </span>
              <button
                type="button"
                onClick={clearFile}
                className="font-mono text-[9px] tracking-[0.14em] text-t3 underline underline-offset-2 hover:text-t1"
              >
                REMOVE
              </button>
            </p>
          )}
          <FieldError message={errors.fileBytes} />
        </div>

        {/* Ticket 06's step, between the size check above and the widget below.
            Two things are said before the wait rather than during it: that the
            work happens in this browser, and that a phone can take a minute or
            two. Measured on a laptop it is tens of seconds, so a visitor who ends
            up watching this deserves to be told it is running.
            No progress bar unless the browser reports a ratio: a bar nobody
            measured would be a claim about work rather than a report of it. */}
        {compressing && (
          <div className="mt-[12px] flex flex-col gap-[6px]">
            <span className="font-mono text-[9px] tracking-[0.14em] text-t3">
              {compressPhase === "downloading"
                ? "LOADING THE COMPRESSOR"
                : "COMPRESSING"}
            </span>
            <p className="m-0 max-w-[420px] text-[11px] leading-[1.45] text-t2">
              {COMPRESSION_NOTICE}
            </p>
            {compressRatio !== null && (
              <div
                role="progressbar"
                aria-label="Compression progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(compressRatio * 100)}
                className="h-[4px] w-full max-w-[320px] overflow-hidden rounded-full border border-line bg-field"
              >
                <span
                  className="block h-full bg-acc"
                  style={{ width: `${Math.round(compressRatio * 100)}%` }}
                />
              </div>
            )}
            {/* Cancelling drops the file as well as stopping the transcode, which
                is why it calls `clearFile`: a chosen file with no compressed
                result is a dead end, since Submit requires one. The picker ends
                up empty and ready instead, and the runner's cancellation message
                is dropped rather than shown, because nothing is wrong. */}
            <button
              type="button"
              onClick={clearFile}
              className="self-start font-mono text-[9px] tracking-[0.14em] text-t3 underline underline-offset-2 hover:text-t1"
            >
              CANCEL
            </button>
          </div>
        )}

        {/* The before-and-after, both on screen before Submit is reachable. The
            "before" is the size already printed beside the chosen file above. */}
        {compressed && file && (
          <p className="m-0 pt-[3px] text-[11px] tabular-nums text-t2">
            Ready to send {formatSize(compressed.bytes)}, down from{" "}
            {formatSize(file.size)}.
          </p>
        )}

        {/* Rendered only once the transcode has produced the file that will be
            sent, so the token is minted when it can still be spent. See the note
            at the top of this file. */}
        {compressed && !errors.fileBytes && (
          <div className="mt-[12px]">
            <TurnstileWidget ref={turnstile} onToken={setToken} />
          </div>
        )}

        <div className="mt-[14px] flex flex-col gap-[4px]">
          <label
            htmlFor="consent"
            className="flex items-start gap-[8px] text-[12px] leading-[1.5] text-t2"
          >
            <input
              id="consent"
              type="checkbox"
              checked={values.consent}
              onChange={(e) =>
                setValues((v) => ({ ...v, consent: e.target.checked }))
              }
              className="mt-[2px] size-[15px] flex-none rounded-[4px] border border-line bg-field accent-acc focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-2"
            />
            {/* The joined string is what the record stores, so this renders the
                two halves rather than a second copy of the words. */}
            <span>
              {SUBMISSION_DISCLOSURE_BODY}{" "}
              <Link
                href={PRIVACY_PATH}
                className="text-t1 underline underline-offset-2"
              >
                {SUBMISSION_DISCLOSURE_POLICY_SENTENCE}
              </Link>
            </span>
          </label>
          <FieldError message={errors.consent} />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-[18px] min-h-[44px] w-full rounded-[9px] bg-acc px-[13px] py-[9px] text-[12.5px] font-medium text-on-acc transition-colors duration-120 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3 disabled:opacity-70 md:min-h-0"
        >
          {compressing
            ? "Compressing…"
            : busy
              ? "Sending…"
              : status === "done"
                ? "Sent"
                : "Send it"}
        </button>

        {/* The mock's one failure idiom (Tile.dc.html:21-22): a mono eyebrow
            above a sentence. Success in acc, failure in the fail token. */}
        {status === "failed" && (
          <div className="mt-[14px]">
            <span className="block pb-[2px] font-mono text-[9px] tracking-[0.14em] text-fail">
              NOT SENT
            </span>
            <p className="m-0 text-[12px] leading-[1.45] text-t1">
              {serverMessage}
            </p>
          </div>
        )}
        {/* "Your Demo was received" is a claim about the file, and it is true whether
            or not the notification reached the maintainer: the object is in the
            bucket and the consent record is written before this branch can render.
            The sentence this replaced promised the visitor would hear back "through
            one of the handles you gave", which stopped being true the moment this
            form started asking for an email address.
            The either-way line is submission-receipt ticket 06's decision, and it is
            offered only when `notified`. What keeps that promise is the outcome
            message, which the maintainer sends by hand, so if the maintainer was
            never told then nobody can keep it and nothing is promised. */}
        {status === "done" && (
          <div className="mt-[14px]">
            <span className="block pb-[2px] font-mono text-[9px] tracking-[0.14em] text-acc">
              SENT
            </span>
            <p className="m-0 text-[12px] leading-[1.45] text-t1">
              {notified
                ? "Thank you, your Demo was received. We will email you either way."
                : "Thank you, your Demo was received."}
            </p>
          </div>
        )}
      </form>
    </div>
  )
}
