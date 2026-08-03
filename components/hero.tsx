// components/hero.tsx
//
// The catalogue hero on `/` — Catalogue.dc.html:62-72. Decision 6: there is no
// light variant of this copy; the Specimen calls light mode
// "LIGHT — THE SAME ROOM, LIGHTS ON", so the room metaphor survives the lights
// and only the tokens change.
//
// Mobile draws no hero at all (CatalogueMobile.dc.html has no showHero block),
// which ticket 11 enforces; this component does not hide itself.
export function Hero({
  recordings,
  contributors,
  categories,
}: {
  recordings: number
  contributors: number
  categories: number
}) {
  return (
    <div className="flex items-end justify-between gap-6 pb-5">
      <div className="max-w-[640px]">
        <h1 className="text-hero m-0 text-t1 [text-wrap:pretty]">
          A dark room full of React&nbsp;Native interfaces, playing quietly.
        </h1>
        <p className="mt-[9px] max-w-[520px] text-[13px] leading-[1.5] text-t2">
          Every entry is a silent screen recording of a real phone, and a link
          to the repo that made it.
        </p>
      </div>
      <div className="flex gap-[22px] font-mono text-[10px] text-t3 text-right">
        <div>
          <div className="text-[19px] text-t1 tabular-nums">{recordings}</div>
          RECORDINGS
        </div>
        <div>
          <div className="text-[19px] text-t1 tabular-nums">{contributors}</div>
          CONTRIBUTORS
        </div>
        <div>
          <div className="text-[19px] text-t1 tabular-nums">{categories}</div>
          CATEGORIES
        </div>
      </div>
    </div>
  )
}
