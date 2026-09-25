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
//   1. **The size rule runs the moment a file is picked**, before the Turnstile
//      widget is even rendered. Ticket 02 measured browser compression in
//      minutes; discovering the file was too large afterwards spends a visitor's
//      time on real work that was never going to be sent.
//   2. **The widget renders only once a file is accepted** — the same reasoning
//      from the other end. A token lives 300 seconds, so one minted on page load
//      is dead before a visitor who took a minute to choose a file can submit.
//      Ticket 06 inserts compression between these two steps; the widget still
//      belongs after it.
//
// public-submissions ticket 05. Discovery — a link from the footer and the
// Contributors page — is ticket 11 and is deliberately absent.
import { useRef, useState, type ChangeEvent, type FormEvent } from "react"
import Link from "next/link"
import { CATEGORIES } from "@/data/categories"

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
const fieldClass =
  "min-h-[40px] w-full rounded-[10px] border border-line bg-field px-[11px] text-[12.5px] text-t1 placeholder:text-t3 focus:border-acc focus:shadow-[0_0_0_3px_var(--acc-soft)] focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-2 md:h-[34px] md:min-h-0"
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

export default function SubmitPage() {
  const [values, setValues] = useState<Omit<SubmissionFields, "fileBytes">>({
    contributor: "",
    github: "",
    linkedin: "",
    twitter: "",
    caption: "",
    category: "",
    source: "",
    consent: false,
  })
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<SubmissionErrors>({})
  const [status, setStatus] = useState<Status>("idle")
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
    setFile(picked)
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
  }

  function clearFile() {
    setFile(null)
    setToken("")
    setStatus("idle")
    setServerMessage("")
    setErrors((prev) => ({ ...prev, fileBytes: undefined }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const found = validateSubmission(fields)
    setErrors(found)
    if (hasErrors(found) || !file) return

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
      // These bytes become ticket 06's compressed output once that lands.
      body.set(DEMO_FIELD, file, file.name)

      const res = await fetch(SUBMIT_ENDPOINT, { method: "POST", body })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        message?: string
      }
      if (!res.ok || data.ok !== true) {
        throw new Error(data.message || "The submission could not be sent.")
      }
      setStatus("done")
    } catch (err) {
      setStatus("failed")
      setServerMessage(
        err instanceof Error ? err.message : "The submission could not be sent."
      )
    } finally {
      // Tokens are single-use, so this is what makes a retry work at all:
      // without it the second attempt sends a token already spent and is refused
      // with `timeout-or-duplicate` — which reads to a visitor as a broken form.
      turnstile.current?.reset()
    }
  }

  const busy = status === "submitting"
  // The button waits on a verified token, so a visitor is never shown a Submit
  // control with nothing to send.
  const canSubmit = Boolean(file) && Boolean(token) && !busy

  return (
    <div className="max-w-[720px]">
      <span className="block pb-[2px] font-mono text-[9px] tracking-[0.14em] text-t3">
        SUBMIT
      </span>
      <h1 className="m-0 text-hero text-t1">Send us a Demo</h1>
      <p className="mt-[9px] max-w-[520px] text-[13px] leading-[1.5] text-t2">
        Built something worth showing? Send the screen recording and the details
        below. The maintainer looks at every one, and publishes the ones that
        fit the catalogue.
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
            <label htmlFor="contributor" className={labelClass}>
              NAME TO CREDIT
            </label>
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
            <label htmlFor="caption" className={labelClass}>
              CAPTION
            </label>
            <input
              id="caption"
              type="text"
              value={values.caption}
              onChange={text("caption")}
              placeholder="Radial FAB"
              className={fieldClass}
            />
            <FieldError message={errors.caption} />
          </div>

          <div className="flex flex-col gap-[4px]">
            <label htmlFor="category" className={labelClass}>
              CATEGORY
            </label>
            <select
              id="category"
              value={values.category}
              onChange={text("category")}
              className={fieldClass}
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
            <label htmlFor="source" className={labelClass}>
              SOURCE
            </label>
            <input
              id="source"
              type="url"
              value={values.source}
              onChange={text("source")}
              placeholder="https://github.com/you/the-component"
              className={fieldClass}
              autoComplete="url"
            />
            <FieldError message={errors.source} />
          </div>
        </div>

        {/* Handles are optional and always bare slugs — no `@`, no URL. The
            placeholders show the shape, because a visitor who types what the
            field asks for never sees a refusal at all. */}
        <div className="mt-[12px] grid grid-cols-1 gap-[12px] sm:grid-cols-3">
          <div className="flex flex-col gap-[4px]">
            <label htmlFor="github" className={labelClass}>
              GITHUB
            </label>
            <input
              id="github"
              type="text"
              value={values.github}
              onChange={text("github")}
              placeholder="hewad-mubariz"
              className={fieldClass}
            />
            <FieldError message={errors.github} />
          </div>
          <div className="flex flex-col gap-[4px]">
            <label htmlFor="linkedin" className={labelClass}>
              LINKEDIN
            </label>
            <input
              id="linkedin"
              type="text"
              value={values.linkedin}
              onChange={text("linkedin")}
              placeholder="hewadm"
              className={fieldClass}
            />
            <FieldError message={errors.linkedin} />
          </div>
          <div className="flex flex-col gap-[4px]">
            <label htmlFor="twitter" className={labelClass}>
              X
            </label>
            <input
              id="twitter"
              type="text"
              value={values.twitter}
              onChange={text("twitter")}
              placeholder="hewadM1"
              className={fieldClass}
            />
            <FieldError message={errors.twitter} />
          </div>
        </div>

        <div className="mt-[12px] flex flex-col gap-[4px]">
          <label htmlFor="demo" className={labelClass}>
            DEMO — UP TO 5 MB
          </label>
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

        {/* Rendered only once a file is accepted, so the token is minted when it
            can still be spent. See the note at the top of this file. */}
        {file && !errors.fileBytes && (
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
          {busy ? "Sending…" : status === "done" ? "Sent" : "Send it"}
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
        {status === "done" && (
          <div className="mt-[14px]">
            <span className="block pb-[2px] font-mono text-[9px] tracking-[0.14em] text-acc">
              SENT
            </span>
            <p className="m-0 text-[12px] leading-[1.45] text-t1">
              Thank you — it has reached the maintainer. You will hear back
              through one of the handles you gave.
            </p>
          </div>
        )}
      </form>
    </div>
  )
}
