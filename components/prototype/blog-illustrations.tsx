/**
 * Section illustrations for the Legend Stack blog prototype.
 * Drawn with the site's design tokens so light and dark modes both hold.
 * Throwaway prototype art — not production components.
 */

const ACC = "var(--acc)"
const ACC_SOFT = "var(--acc-soft)"
const T1 = "var(--t1)"
const T2 = "var(--t2)"
const T3 = "var(--t3)"
const LINE = "var(--line)"
const PANEL = "var(--panel)"
const WELL = "var(--well)"
const ON_ACC = "var(--on-acc)"

type IlluProps = { className?: string; title?: string }

function Frame({
  children,
  className,
  title,
  label,
}: IlluProps & { children: React.ReactNode; label: string }) {
  return (
    <figure
      className={`relative overflow-hidden rounded-panel border border-line bg-well ${className ?? ""}`}
    >
      <svg
        viewBox="0 0 1200 630"
        role="img"
        aria-label={title ?? label}
        className="block h-auto w-full"
      >
        <title>{title ?? label}</title>
        {children}
      </svg>
      <figcaption className="absolute bottom-3 left-4 font-mono text-label text-t3">
        {label}
      </figcaption>
    </figure>
  )
}

/** Hero: nine stacked bands rising into an accent glow. */
export function IlluHero({ className, title }: IlluProps) {
  const bands = [
    { y: 480, w: 980, o: 0.35 },
    { y: 430, w: 900, o: 0.45 },
    { y: 380, w: 820, o: 0.55 },
    { y: 330, w: 740, o: 0.65 },
    { y: 280, w: 660, o: 0.75 },
    { y: 230, w: 580, o: 0.85 },
    { y: 180, w: 500, o: 0.92 },
    { y: 130, w: 420, o: 0.96 },
    { y: 80, w: 340, o: 1 },
  ]
  return (
    <Frame className={className} title={title} label="THE STACK / 9 AREAS">
      <defs>
        <linearGradient id="heroGlow" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={ACC} stopOpacity="0.05" />
          <stop offset="100%" stopColor={ACC} stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id="heroHalo" cx="50%" cy="30%" r="55%">
          <stop offset="0%" stopColor={ACC} stopOpacity="0.28" />
          <stop offset="100%" stopColor={ACC} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1200" height="630" fill={PANEL} />
      <rect width="1200" height="630" fill="url(#heroHalo)" />
      <rect width="1200" height="630" fill="url(#heroGlow)" />
      {bands.map((b, i) => (
        <g key={i}>
          <rect
            x={(1200 - b.w) / 2}
            y={b.y}
            width={b.w}
            height={36}
            rx={8}
            fill={ACC}
            opacity={b.o * 0.22}
            stroke={ACC}
            strokeOpacity={b.o * 0.55}
            strokeWidth={1.5}
          />
          <rect
            x={(1200 - b.w) / 2 + 16}
            y={b.y + 12}
            width={b.w * 0.22}
            height={12}
            rx={4}
            fill={ACC}
            opacity={b.o * 0.7}
          />
        </g>
      ))}
      <circle cx="600" cy="70" r="8" fill={ACC} />
      <circle cx="600" cy="70" r="22" fill="none" stroke={ACC} strokeWidth="1.5" opacity="0.5" />
      <circle cx="600" cy="70" r="38" fill="none" stroke={ACC} strokeWidth="1" opacity="0.25" />
    </Frame>
  )
}

/** Nine-area grid overview. */
export function IlluNineAreas({ className, title }: IlluProps) {
  const cells = [
    "Framework",
    "Editor",
    "Navigation",
    "Local data",
    "State",
    "Must-haves",
    "Services",
    "Backend",
    "UI",
  ]
  return (
    <Frame className={className} title={title} label="MAP / NINE AREAS">
      <rect width="1200" height="630" fill={PANEL} />
      {cells.map((label, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const x = 150 + col * 310
        const y = 90 + row * 160
        return (
          <g key={label}>
            <rect
              x={x}
              y={y}
              width={270}
              height={120}
              rx={12}
              fill={i === 4 ? ACC_SOFT : WELL}
              stroke={i === 4 ? ACC : LINE}
              strokeWidth={i === 4 ? 2 : 1.5}
            />
            <rect x={x + 20} y={y + 24} width={36} height={36} rx={8} fill={ACC} opacity={i === 4 ? 1 : 0.35} />
            <text
              x={x + 20}
              y={y + 88}
              fill={T1}
              fontSize={18}
              fontFamily="var(--font-grotesk), system-ui, sans-serif"
              fontWeight={500}
            >
              {label}
            </text>
            <text
              x={x + 200}
              y={y + 48}
              fill={T3}
              fontSize={12}
              fontFamily="var(--font-jetbrains), ui-monospace, monospace"
              letterSpacing="0.12em"
            >
              {String(i + 1).padStart(2, "0")}
            </text>
          </g>
        )
      })}
    </Frame>
  )
}

/** Framework: phone silhouette with SDK badge. */
export function IlluFramework({ className, title }: IlluProps) {
  return (
    <Frame className={className} title={title} label="FRAMEWORK / EXPO SDK 58">
      <rect width="1200" height="630" fill={PANEL} />
      <rect x="480" y="70" width="240" height="480" rx="28" fill={WELL} stroke={LINE} strokeWidth="2" />
      <rect x="500" y="110" width="200" height="400" rx="8" fill={PANEL} stroke={LINE} strokeWidth="1" />
      <rect x="560" y="86" width="80" height="8" rx={4} fill={LINE} />
      {/* app blocks */}
      <rect x="516" y="130" width="168" height="48" rx={8} fill={ACC} opacity="0.2" stroke={ACC} strokeWidth="1" />
      <rect x="516" y="194" width="80" height="80" rx={8} fill={WELL} stroke={LINE} />
      <rect x="604" y="194" width="80" height="80" rx={8} fill={WELL} stroke={LINE} />
      <rect x="516" y="290" width="168" height="16" rx={4} fill={LINE} />
      <rect x="516" y="318" width="140" height="16" rx={4} fill={LINE} opacity="0.6" />
      <rect x="516" y="360" width="168" height="40" rx={8} fill={ACC} />
      {/* badge */}
      <g>
        <rect x="780" y="240" width="220" height="72" rx={12} fill={ACC} />
        <text x="800" y="272" fill={ON_ACC} fontSize={14} fontFamily="var(--font-jetbrains), monospace" letterSpacing="0.14em">
          EXPO SDK
        </text>
        <text x="800" y="298" fill={ON_ACC} fontSize={28} fontFamily="var(--font-grotesk), sans-serif" fontWeight={600}>
          58
        </text>
        <line x1="700" y1="276" x2="780" y2="276" stroke={ACC} strokeWidth="2" strokeDasharray="4 4" />
      </g>
      <text x="200" y="320" fill={T2} fontSize={16} fontFamily="var(--font-grotesk), sans-serif">
        New Architecture
      </text>
      <text x="200" y="348" fill={T3} fontSize={13} fontFamily="var(--font-jetbrains), monospace">
        by default
      </text>
      <line x1="360" y1="330" x2="480" y2="330" stroke={LINE} strokeWidth="1.5" />
    </Frame>
  )
}

/** Editor: Herdr (sketched from herdr.dev) beside Zed. */
export function IlluEditor({ className, title }: IlluProps) {
  const MONO = "var(--font-jetbrains), ui-monospace, monospace"
  const SANS = "var(--font-grotesk), system-ui, sans-serif"
  const spaces = [
    { name: "website", branch: "main", needs: true },
    { name: "core", branch: "master", needs: false },
    { name: "plugins", branch: "main", needs: false },
  ]
  const agents = [
    { name: "pricing page", age: "<1m", state: "working" },
    { name: "og tags", age: "4m", state: "working" },
    { name: "blog pass", age: "9m", state: "idle" },
    { name: "docs nav", age: "<1m", state: "needs" },
  ]
  const tabs = ["pricing page", "og tags", "blog pass", "docs nav"]
  return (
    <Frame className={className} title={title} label="EDITOR / HERDR + ZED">
      <rect width="1200" height="630" fill={PANEL} />

      {/* ---------- Herdr window ---------- */}
      <rect x="60" y="60" width="780" height="490" rx={14} fill={WELL} stroke={LINE} strokeWidth="1.5" />
      {/* title bar */}
      <circle cx="86" cy="86" r="6" fill={T3} opacity="0.5" />
      <circle cx="106" cy="86" r="6" fill={T3} opacity="0.35" />
      <circle cx="126" cy="86" r="6" fill={T3} opacity="0.25" />
      <rect x="150" y="78" width="16" height="16" rx={4} fill={ACC} />
      <text x="174" y="91" fill={T1} fontSize={13} fontFamily={SANS} fontWeight={500}>
        Herdr
      </text>

      {/* sidebar */}
      <rect x="60" y="110" width="220" height="440" fill={PANEL} opacity="0.6" />
      <line x1="280" y1="110" x2="280" y2="550" stroke={LINE} />
      <text x="80" y="136" fill={T3} fontSize={10} fontFamily={MONO} letterSpacing="0.12em">
        SPACES
      </text>
      <text x="80" y="160" fill={T3} fontSize={10} fontFamily={MONO}>
        ▭ This computer
      </text>
      {spaces.map((s, i) => {
        const y = 176 + i * 34
        return (
          <g key={s.name}>
            {s.needs && (
              <rect x="70" y={y} width="200" height="28" rx={6} fill={ACC_SOFT} />
            )}
            <rect x="80" y={y + 6} width="16" height="16" rx={4} fill={i === 0 ? ACC : LINE} />
            <text x="104" y={y + 18} fill={T1} fontSize={12} fontFamily={SANS} fontWeight={500}>
              {s.name}
            </text>
            <text x="166" y={y + 18} fill={T3} fontSize={10} fontFamily={MONO}>
              {s.branch}
            </text>
            {s.needs ? (
              <>
                <rect x="212" y={y + 6} width="54" height="16" rx={4} fill={ACC} />
                <text x="239" y={y + 17.5} textAnchor="middle" fill={ON_ACC} fontSize={9} fontFamily={SANS} fontWeight={600}>
                  Needs you
                </text>
              </>
            ) : (
              <circle cx="258" cy={y + 14} r="4" fill={ACC} opacity={i === 1 ? 0.9 : 0.4} />
            )}
          </g>
        )
      })}
      <text x="80" y="296" fill={T3} fontSize={10} fontFamily={MONO}>
        ▭ vps
      </text>
      <rect x="80" y="308" width="16" height="16" rx={4} fill={LINE} />
      <text x="104" y="320" fill={T1} fontSize={12} fontFamily={SANS} fontWeight={500}>
        service-api
      </text>
      <text x="178" y="320" fill={T3} fontSize={10} fontFamily={MONO}>
        master
      </text>
      <circle cx="258" cy="316" r="4" fill={ACC} opacity="0.5" />

      <line x1="70" y1="352" x2="270" y2="352" stroke={LINE} />
      <text x="80" y="376" fill={T3} fontSize={10} fontFamily={MONO} letterSpacing="0.12em">
        AGENTS
      </text>
      <text x="80" y="396" fill={T3} fontSize={10} fontFamily={MONO}>
        website
      </text>
      {agents.map((a, i) => {
        const y = 408 + i * 30
        return (
          <g key={a.name}>
            {a.state === "needs" && (
              <rect x="70" y={y} width="200" height="24" rx={6} fill={ACC_SOFT} />
            )}
            <rect x="80" y={y + 5} width="12" height="12" rx={3} fill={ACC} opacity={a.state === "idle" ? 0.3 : 0.9} />
            <text x="100" y={y + 16} fill={a.state === "idle" ? T3 : T1} fontSize={11} fontFamily={SANS}>
              {a.name}
            </text>
            <text x="196" y={y + 16} fill={T3} fontSize={9} fontFamily={MONO}>
              {a.age}
            </text>
            {a.state === "needs" ? (
              <>
                <rect x="216" y={y + 4} width="50" height="15" rx={4} fill={ACC} />
                <text x="241" y={y + 15} textAnchor="middle" fill={ON_ACC} fontSize={8.5} fontFamily={SANS} fontWeight={600}>
                  Needs you
                </text>
              </>
            ) : a.state === "working" ? (
              <circle cx="258" cy={y + 12} r="5" fill="none" stroke={ACC} strokeWidth="1.5" strokeDasharray="6 4" />
            ) : (
              <circle cx="258" cy={y + 12} r="3" fill={T3} opacity="0.4" />
            )}
          </g>
        )
      })}

      {/* tab strip */}
      <rect x="280" y="110" width="560" height="34" fill={PANEL} opacity="0.4" />
      <line x1="280" y1="144" x2="840" y2="144" stroke={LINE} />
      {tabs.map((t, i) => {
        const x = 292 + i * 128
        const active = i === 0
        return (
          <g key={t}>
            <rect x={x} y="117" width="120" height="22" rx={6} fill={active ? ACC_SOFT : "transparent"} stroke={active ? ACC : "transparent"} strokeWidth="1" />
            <rect x={x + 8} y="123" width="10" height="10" rx={2} fill={ACC} opacity={active ? 1 : 0.4} />
            <text x={x + 24} y="132" fill={active ? T1 : T2} fontSize={10.5} fontFamily={SANS} fontWeight={active ? 500 : 400}>
              {t}
            </text>
            {i === 3 && <circle cx={x + 108} cy="128" r="3" fill={ACC} />}
          </g>
        )
      })}

      {/* two agent panes */}
      {/* left: Claude Code */}
      <rect x="292" y="156" width="268" height="380" rx={8} fill={PANEL} stroke={ACC} strokeWidth="1.5" />
      <rect x="302" y="164" width="12" height="12" rx={3} fill={ACC} />
      <text x="320" y="174" fill={T1} fontSize={10.5} fontFamily={SANS} fontWeight={500}>
        Claude Code
      </text>
      <text x="396" y="174" fill={T3} fontSize={9} fontFamily={MONO}>
        ~/code/website
      </text>
      <rect x="302" y="188" width="248" height="34" rx={4} fill={WELL} />
      <text x="310" y="202" fill={T2} fontSize={9} fontFamily={MONO}>
        › tighten the pricing copy, one
      </text>
      <text x="310" y="215" fill={T2} fontSize={9} fontFamily={MONO}>
        idea per sentence
      </text>
      <text x="310" y="242" fill={T2} fontSize={9} fontFamily={MONO}>
        ● Read(src/pages/index.astro)
      </text>
      <text x="310" y="262" fill={T2} fontSize={9} fontFamily={MONO}>
        ● Update(src/pages/index.astro)
      </text>
      <rect x="310" y="272" width="232" height="14" rx={2} fill="var(--fail)" opacity="0.18" />
      <text x="316" y="283" fill={T2} fontSize={8.5} fontFamily={MONO}>
        118 - Herdr is free for individuals
      </text>
      <rect x="310" y="288" width="232" height="14" rx={2} fill={ACC} opacity="0.18" />
      <text x="316" y="299" fill={T2} fontSize={8.5} fontFamily={MONO}>
        118 + Free for individuals. Forever.
      </text>
      <text x="310" y="326" fill={T2} fontSize={9} fontFamily={MONO}>
        ● Done. Two changes.
      </text>
      <text x="310" y="350" fill={T3} fontSize={9} fontFamily={MONO}>
        ✻ Worked for 51s
      </text>

      {/* right: Codex */}
      <rect x="572" y="156" width="256" height="380" rx={8} fill={PANEL} stroke={LINE} strokeWidth="1" />
      <rect x="582" y="164" width="12" height="12" rx={3} fill={T3} opacity="0.6" />
      <text x="600" y="174" fill={T1} fontSize={10.5} fontFamily={SANS} fontWeight={500}>
        Codex
      </text>
      <text x="640" y="174" fill={T3} fontSize={9} fontFamily={MONO}>
        ~/code/website
      </text>
      <rect x="582" y="188" width="236" height="34" rx={4} fill={WELL} />
      <text x="590" y="202" fill={T2} fontSize={9} fontFamily={MONO}>
        › find unused css selectors in
      </text>
      <text x="590" y="215" fill={T2} fontSize={9} fontFamily={MONO}>
        site.css and remove five
      </text>
      <text x="590" y="242" fill={T2} fontSize={9} fontFamily={MONO}>
        • Exploring
      </text>
      <text x="600" y="258" fill={T3} fontSize={9} fontFamily={MONO}>
        └ Read site.css
      </text>
      <text x="600" y="274" fill={T3} fontSize={9} fontFamily={MONO}>
        Search hero-meta|cap-soon
      </text>
      <text x="590" y="300" fill={ACC} fontSize={9} fontFamily={MONO}>
        • Working (3s · esc to interrupt)
      </text>
      <rect x="590" y="312" width="6" height="12" fill={ACC} opacity="0.8" />

      {/* ---------- Zed window ---------- */}
      <rect x="880" y="60" width="260" height="490" rx={14} fill={WELL} stroke={LINE} strokeWidth="1.5" />
      <circle cx="906" cy="86" r="6" fill={T3} opacity="0.5" />
      <circle cx="926" cy="86" r="6" fill={T3} opacity="0.35" />
      <circle cx="946" cy="86" r="6" fill={T3} opacity="0.25" />
      <text x="970" y="91" fill={T1} fontSize={13} fontFamily={SANS} fontWeight={500}>
        Zed
      </text>
      <line x1="880" y1="110" x2="1140" y2="110" stroke={LINE} />
      <text x="900" y="134" fill={T3} fontSize={10} fontFamily={MONO}>
        app/products/[id].tsx
      </text>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
        const y = 160 + i * 26
        const w = [150, 120, 190, 96, 170, 130, 180, 110, 150][i]
        const hot = i === 4
        return (
          <g key={i}>
            <text x="900" y={y + 9} fill={T3} fontSize={9} fontFamily={MONO}>
              {String(i + 12).padStart(2, " ")}
            </text>
            {hot && <rect x="916" y={y - 6} width="214" height="22" rx={3} fill={ACC_SOFT} />}
            <rect x="924" y={y} width={w} height={9} rx={3} fill={hot ? ACC : T3} opacity={hot ? 0.9 : 0.3} />
          </g>
        )
      })}
      <rect x="1078" y="258" width="2" height="18" fill={ACC} />
      <text x="900" y="430" fill={T3} fontSize={9.5} fontFamily={MONO}>
        one line · typed by hand
      </text>
      <text x="900" y="520" fill={T3} fontSize={9.5} fontFamily={MONO}>
        ⌘S · opens fast
      </text>
    </Frame>
  )
}

/** Navigation: Expo Router file tree and the routes it produces. */
export function IlluNavigation({ className, title }: IlluProps) {
  const MONO = "var(--font-jetbrains), ui-monospace, monospace"
  const SANS = "var(--font-grotesk), system-ui, sans-serif"
  // depth 0 = app/, depth 1 = child, depth 2 = grandchild
  const files: { name: string; depth: number; route?: string; hot?: boolean }[] = [
    { name: "app/", depth: 0 },
    { name: "_layout.tsx", depth: 1 },
    { name: "index.tsx", depth: 1, route: "/" },
    { name: "products/", depth: 1 },
    { name: "index.tsx", depth: 2, route: "/products" },
    { name: "[id].tsx", depth: 2, route: "/products/42" },
    { name: "blog/", depth: 1 },
    { name: "[slug].tsx", depth: 2, route: "/blog/legend-stack", hot: true },
    { name: "+not-found.tsx", depth: 1 },
  ]
  const ROW = 44
  const TOP = 150
  const rowY = (i: number) => TOP + i * ROW
  const routed = files
    .map((f, i) => ({ ...f, i }))
    .filter((f) => f.route)
  return (
    <Frame className={className} title={title} label="NAVIGATION / EXPO ROUTER · FILE = ROUTE">
      <rect width="1200" height="630" fill={PANEL} />

      {/* file tree panel */}
      <rect x="100" y="90" width="400" height="470" rx={12} fill={WELL} stroke={LINE} strokeWidth="1.5" />
      <text x="124" y="122" fill={T3} fontSize={10} fontFamily={MONO} letterSpacing="0.12em">
        FILES
      </text>
      {files.map((f, i) => {
        const y = rowY(i)
        const x = 124 + f.depth * 28
        const isDir = f.name.endsWith("/")
        const color = f.hot ? ACC : f.depth === 0 ? ACC : isDir ? T1 : T2
        return (
          <g key={`${f.name}-${i}`}>
            {f.hot && (
              <rect x="112" y={y - 18} width="376" height="30" rx={6} fill={ACC_SOFT} />
            )}
            {/* guide lines */}
            {f.depth > 0 && (
              <line x1={124 + (f.depth - 1) * 28 + 6} y1={y - 22} x2={124 + (f.depth - 1) * 28 + 6} y2={y - 4} stroke={LINE} strokeWidth="1" />
            )}
            {f.depth > 0 && (
              <line x1={124 + (f.depth - 1) * 28 + 6} y1={y - 4} x2={x - 6} y2={y - 4} stroke={LINE} strokeWidth="1" />
            )}
            {isDir ? (
              <path d={`M${x} ${y - 11} h7 l3 3 h8 v10 h-18 z`} fill={ACC} opacity={f.depth === 0 ? 1 : 0.55} />
            ) : (
              <path d={`M${x + 2} ${y - 12} h9 l5 5 v10 h-14 z`} fill="none" stroke={color} strokeWidth="1.2" />
            )}
            <text x={x + 26} y={y} fill={color} fontSize={15} fontFamily={MONO} fontWeight={f.hot || f.depth === 0 ? 600 : 400}>
              {f.name}
            </text>
          </g>
        )
      })}

      {/* connectors + routes */}
      {routed.map((f) => {
        const y = rowY(f.i) - 5
        return (
          <g key={f.route}>
            <line x1="500" y1={y} x2="560" y2={y} stroke={ACC} strokeWidth="2" opacity={f.hot ? 1 : 0.6} />
            <circle cx="560" cy={y} r="5" fill={ACC} opacity={f.hot ? 1 : 0.7} />
            <line x1="560" y1={y} x2="620" y2={y} stroke={ACC} strokeWidth="2" opacity={f.hot ? 1 : 0.6} />
            <rect x="620" y={y - 20} width="440" height="40" rx={9} fill={f.hot ? ACC_SOFT : WELL} stroke={f.hot ? ACC : LINE} strokeWidth="1.5" />
            <text x="640" y={y + 6} fill={f.hot ? ACC : T1} fontSize={17} fontFamily={MONO} fontWeight={f.hot ? 600 : 400}>
              {f.route}
            </text>
            {f.route?.includes("42") && (
              <text x="1040" y={y + 5} textAnchor="end" fill={T3} fontSize={11} fontFamily={MONO}>
                [id] → 42
              </text>
            )}
            {f.hot && (
              <text x="1040" y={y + 5} textAnchor="end" fill={T3} fontSize={11} fontFamily={MONO}>
                [slug] → legend-stack
              </text>
            )}
          </g>
        )
      })}
      {/* vertical spine through connector dots */}
      <line x1="560" y1={rowY(2) - 5} x2="560" y2={rowY(7) - 5} stroke={ACC} strokeWidth="2" opacity="0.5" />

      <text x="620" y="540" fill={T2} fontSize={14} fontFamily={SANS}>
        A deep link is the same path the screen already uses.
      </text>
      <text x="620" y="562" fill={T3} fontSize={11.5} fontFamily={MONO}>
        myapp://blog/legend-stack · https://example.com/blog/legend-stack
      </text>
    </Frame>
  )
}

/** Local data: SQLite cylinder + MMKV card. */
export function IlluLocalData({ className, title }: IlluProps) {
  return (
    <Frame className={className} title={title} label="LOCAL DATA / SQLITE + MMKV">
      <rect width="1200" height="630" fill={PANEL} />
      {/* SQLite */}
      <ellipse cx="360" cy="180" rx="160" ry="50" fill={ACC_SOFT} stroke={ACC} strokeWidth="2" />
      <rect x="200" y="180" width="320" height="220" fill={ACC_SOFT} stroke="none" />
      <path d="M200 180 V400" stroke={ACC} strokeWidth="2" fill="none" />
      <path d="M520 180 V400" stroke={ACC} strokeWidth="2" fill="none" />
      <ellipse cx="360" cy="400" rx="160" ry="50" fill={ACC_SOFT} stroke={ACC} strokeWidth="2" />
      <ellipse cx="360" cy="290" rx="160" ry="50" fill="none" stroke={ACC} strokeWidth="1.5" opacity="0.5" />
      <text x="300" y="300" fill={T1} fontSize={22} fontFamily="var(--font-grotesk), sans-serif" fontWeight={600}>
        SQLite
      </text>
      <text x="318" y="330" fill={T2} fontSize={14} fontFamily="var(--font-jetbrains), monospace">
        + Drizzle
      </text>
      {/* MMKV */}
      <rect x="640" y="200" width="360" height="200" rx={16} fill={WELL} stroke={LINE} strokeWidth="2" />
      <rect x="672" y="240" width="64" height="64" rx={12} fill={ACC} />
      <text x="690" y="282" fill={ON_ACC} fontSize={20} fontFamily="var(--font-jetbrains), monospace" fontWeight={700}>
        KV
      </text>
      <text x="760" y="270" fill={T1} fontSize={28} fontFamily="var(--font-grotesk), sans-serif" fontWeight={600}>
        MMKV
      </text>
      <text x="760" y="300" fill={T3} fontSize={14} fontFamily="var(--font-grotesk), sans-serif">
        theme · flags · tokens
      </text>
      <rect x="672" y="330" width="300" height="14" rx={4} fill={LINE} />
      <rect x="672" y="330" width="210" height="14" rx={4} fill={ACC} opacity="0.55" />
      <text x="672" y="375" fill={T3} fontSize={12} fontFamily="var(--font-jetbrains), monospace">
        ~30× AsyncStorage · JSI
      </text>
      <text x="200" y="520" fill={T3} fontSize={15} fontFamily="var(--font-grotesk), sans-serif">
        You own migrations. MMKV needs a dev build.
      </text>
    </Frame>
  )
}

/** State: signal nodes with focus ring. */
export function IlluState({ className, title }: IlluProps) {
  const nodes = [
    { x: 600, y: 200, r: 36, label: "store" },
    { x: 380, y: 340, r: 26, label: "field" },
    { x: 600, y: 400, r: 26, label: "field" },
    { x: 820, y: 340, r: 26, label: "field" },
    { x: 300, y: 180, r: 20, label: "view" },
    { x: 900, y: 180, r: 20, label: "view" },
  ]
  const links: { a: number; b: number; stroke: string; width: number; opacity?: number }[] = [
    { a: 0, b: 1, stroke: ACC, width: 2, opacity: 0.5 },
    { a: 0, b: 2, stroke: ACC, width: 2, opacity: 0.5 },
    { a: 0, b: 3, stroke: ACC, width: 2, opacity: 0.5 },
    { a: 1, b: 4, stroke: LINE, width: 1.5 },
    { a: 3, b: 5, stroke: LINE, width: 1.5 },
    { a: 1, b: 2, stroke: LINE, width: 1.5 },
    { a: 3, b: 2, stroke: LINE, width: 1.5 },
  ]
  return (
    <Frame className={className} title={title} label="STATE / SIGNALS">
      <rect width="1200" height="630" fill={PANEL} />
      {/* links: each line ends at the circle edge, never at the centre */}
      {links.map((l) => {
        const a = nodes[l.a]
        const b = nodes[l.b]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.hypot(dx, dy)
        const ux = dx / dist
        const uy = dy / dist
        return (
          <line
            key={`${l.a}-${l.b}`}
            x1={a.x + ux * a.r}
            y1={a.y + uy * a.r}
            x2={b.x - ux * b.r}
            y2={b.y - uy * b.r}
            stroke={l.stroke}
            strokeWidth={l.width}
            opacity={l.opacity}
          />
        )
      })}
      {/* focused node glow */}
      <circle cx="600" cy="200" r="56" fill="none" stroke={ACC} strokeWidth="1.5" opacity="0.35" />
      <circle cx="600" cy="200" r="72" fill="none" stroke={ACC} strokeWidth="1" opacity="0.18" />
      {nodes.map((n) => (
        <g key={`${n.x}-${n.y}`}>
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.label === "store" ? ACC : PANEL} stroke={n.label === "store" ? ACC : LINE} strokeWidth="2" />
          <text
            x={n.x}
            y={n.y + 5}
            textAnchor="middle"
            fill={n.label === "store" ? ON_ACC : T2}
            fontSize={n.label === "store" ? 13 : 11}
            fontFamily="var(--font-jetbrains), monospace"
          >
            {n.label}
          </text>
        </g>
      ))}
      <text x="140" y="540" fill={T2} fontSize={16} fontFamily="var(--font-grotesk), sans-serif">
        A component reads one field. The rest of the tree stays put.
      </text>
      <text x="140" y="572" fill={T3} fontSize={14} fontFamily="var(--font-jetbrains), monospace">
        Legend State · TanStack Query
      </text>
    </Frame>
  )
}

/** Must-haves: list rows + form field. */
export function IlluMustHaves({ className, title }: IlluProps) {
  return (
    <Frame className={className} title={title} label="MUST-HAVES / LISTS + FORMS">
      <rect width="1200" height="630" fill={PANEL} />
      {/* list */}
      <rect x="90" y="100" width="480" height="430" rx={14} fill={WELL} stroke={LINE} strokeWidth="1.5" />
      <text x="120" y="150" fill={ACC} fontSize={13} fontFamily="var(--font-jetbrains), monospace" letterSpacing="0.12em">
        LIST
      </text>
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x="120" y={175 + i * 64} width="420" height={i % 2 === 0 ? 52 : 44} rx={8} fill={PANEL} stroke={LINE} />
          <circle cx="152" cy={175 + i * 64 + (i % 2 === 0 ? 26 : 22)} r={12} fill={ACC} opacity={0.25 + i * 0.12} />
          <rect x="180" y={175 + i * 64 + (i % 2 === 0 ? 18 : 16)} width={200 - i * 12} height={12} rx={4} fill={LINE} />
          <rect x="180" y={175 + i * 64 + (i % 2 === 0 ? 36 : 32)} width={140 - i * 8} height={8} rx={3} fill={LINE} opacity="0.5" />
        </g>
      ))}
      <text x="120" y="500" fill={T3} fontSize={13} fontFamily="var(--font-jetbrains), monospace">
        Legend List · FlashList
      </text>
      {/* form */}
      <rect x="630" y="100" width="480" height="430" rx={14} fill={WELL} stroke={LINE} strokeWidth="1.5" />
      <text x="660" y="150" fill={ACC} fontSize={13} fontFamily="var(--font-jetbrains), monospace" letterSpacing="0.12em">
        FORM
      </text>
      <rect x="660" y="185" width="420" height="52" rx={8} fill={PANEL} stroke={ACC} strokeWidth="2" />
      <text x="680" y="217" fill={T2} fontSize={14} fontFamily="var(--font-grotesk), sans-serif">
        email@example.com
      </text>
      <rect x="660" y="265" width="420" height="52" rx={8} fill={PANEL} stroke={LINE} />
      <text x="680" y="297" fill={T3} fontSize={14} fontFamily="var(--font-grotesk), sans-serif">
        Password
      </text>
      <rect x="660" y="350" width="420" height="48" rx={8} fill={ACC} />
      <text x="820" y="380" fill={ON_ACC} fontSize={16} fontFamily="var(--font-grotesk), sans-serif" fontWeight={600}>
        Continue
      </text>
      <text x="660" y="450" fill={T3} fontSize={14} fontFamily="var(--font-jetbrains), monospace">
        React Hook Form + Zod
      </text>
      <text x="660" y="480" fill={T3} fontSize={13} fontFamily="var(--font-grotesk), sans-serif">
        Only the field you type in re-renders.
      </text>
    </Frame>
  )
}

/** Services: chip orbit. */
export function IlluServices({ className, title }: IlluProps) {
  const services = [
    { label: "EAS", angle: -90 },
    { label: "Clerk", angle: -30 },
    { label: "Sentry", angle: 30 },
    { label: "RevenueCat", angle: 90 },
    { label: "CodeRabbit", angle: 150 },
    { label: "PostHog", angle: 210 },
  ]
  const cx = 600
  const cy = 300
  const rx = 320
  const ry = 180
  return (
    <Frame className={className} title={title} label="SERVICES / ORBIT">
      <rect width="1200" height="630" fill={PANEL} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={LINE} strokeWidth="1.5" strokeDasharray="6 8" />
      <circle cx={cx} cy={cy} r="54" fill={ACC} />
      <text x={cx} y={cy + 6} textAnchor="middle" fill={ON_ACC} fontSize={16} fontFamily="var(--font-grotesk), sans-serif" fontWeight={600}>
        App
      </text>
      {services.map((s) => {
        const rad = (s.angle * Math.PI) / 180
        const x = cx + rx * Math.cos(rad)
        const y = cy + ry * Math.sin(rad)
        const w = Math.max(100, s.label.length * 11 + 32)
        const ux = Math.cos(rad)
        const uy = Math.sin(rad)
        // Start at the App circle edge; end at the pill edge along the same ray.
        const startX = cx + ux * 54
        const startY = cy + uy * 54
        const edge = 1 / Math.sqrt((ux / (w / 2)) ** 2 + (uy / 22) ** 2)
        const endX = x - ux * edge
        const endY = y - uy * edge
        return (
          <g key={s.label}>
            <line x1={startX} y1={startY} x2={endX} y2={endY} stroke={ACC} strokeWidth="1.5" opacity="0.35" />
            <rect x={x - w / 2} y={y - 22} width={w} height={44} rx={22} fill={PANEL} stroke={ACC} strokeWidth="1.5" />
            <text x={x} y={y + 5} textAnchor="middle" fill={T1} fontSize={15} fontFamily="var(--font-grotesk), sans-serif" fontWeight={500}>
              {s.label}
            </text>
          </g>
        )
      })}
    </Frame>
  )
}

/** Backend: three option cards. */
export function IlluBackend({ className, title }: IlluProps) {
  const opts = [
    { name: "Supabase", sub: "Postgres · SQL", hot: true },
    { name: "Instant", sub: "Firebase-like", hot: false },
    { name: "API route", sub: "Thin handler", hot: false },
  ]
  return (
    <Frame className={className} title={title} label="BACKEND / THREE PICKS">
      <rect width="1200" height="630" fill={PANEL} />
      {opts.map((o, i) => {
        const x = 100 + i * 350
        return (
          <g key={o.name}>
            <rect
              x={x}
              y={140}
              width={310}
              height={340}
              rx={16}
              fill={o.hot ? ACC_SOFT : WELL}
              stroke={o.hot ? ACC : LINE}
              strokeWidth={o.hot ? 2.5 : 1.5}
            />
            <rect x={x + 28} y={180} width={48} height={48} rx={10} fill={o.hot ? ACC : LINE} opacity={o.hot ? 1 : 0.5} />
            <text x={x + 28} y={280} fill={T1} fontSize={28} fontFamily="var(--font-grotesk), sans-serif" fontWeight={600}>
              {o.name}
            </text>
            <text x={x + 28} y={318} fill={T2} fontSize={16} fontFamily="var(--font-jetbrains), monospace">
              {o.sub}
            </text>
            <rect x={x + 28} y={360} width={250} height={10} rx={4} fill={LINE} />
            <rect x={x + 28} y={384} width={200} height={10} rx={4} fill={LINE} opacity="0.55" />
            <rect x={x + 28} y={408} width={230} height={10} rx={4} fill={LINE} opacity="0.35" />
            {o.hot && (
              <text x={x + 28} y={455} fill={ACC} fontSize={13} fontFamily="var(--font-jetbrains), monospace" letterSpacing="0.1em">
                MY DEFAULT
              </text>
            )}
          </g>
        )
      })}
    </Frame>
  )
}

/** UI ladder: four ascending steps. */
export function IlluUI({ className, title }: IlluProps) {
  const steps = [
    { label: "StyleSheet", h: 70 },
    { label: "Unistyles", h: 130 },
    { label: "Uniwind", h: 190 },
    { label: "Expo UI", h: 250 },
  ]
  return (
    <Frame className={className} title={title} label="UI / STYLING LADDER">
      <rect width="1200" height="630" fill={PANEL} />
      {steps.map((s, i) => {
        const x = 160 + i * 240
        const y = 500 - s.h
        return (
          <g key={s.label}>
            <rect
              x={x}
              y={y}
              width={200}
              height={s.h}
              rx={12}
              fill={i === 0 ? ACC : WELL}
              stroke={i === 0 ? ACC : LINE}
              strokeWidth={i === 0 ? 2 : 1.5}
              opacity={i === 0 ? 1 : 0.7 + i * 0.1}
            />
            <text
              x={x + 100}
              y={y + s.h / 2 + 5}
              textAnchor="middle"
              fill={i === 0 ? ON_ACC : T1}
              fontSize={16}
              fontFamily="var(--font-grotesk), sans-serif"
              fontWeight={500}
            >
              {s.label}
            </text>
            <text
              x={x + 100}
              y={530}
              textAnchor="middle"
              fill={T3}
              fontSize={12}
              fontFamily="var(--font-jetbrains), monospace"
            >
              0{i + 1}
            </text>
          </g>
        )
      })}
      <path d="M160 500 H1120" stroke={LINE} strokeWidth="1.5" />
      <text x="160" y="100" fill={T2} fontSize={16} fontFamily="var(--font-grotesk), sans-serif">
        Start at StyleSheet. Move one step when a screen forces it.
      </text>
    </Frame>
  )
}

/** FAQ mark. */
export function IlluFAQ({ className, title }: IlluProps) {
  return (
    <Frame className={className} title={title} label="FAQ / QUESTIONS">
      <rect width="1200" height="630" fill={PANEL} />
      <circle cx="600" cy="280" r="120" fill={ACC_SOFT} stroke={ACC} strokeWidth="2" />
      <text x="600" y="330" textAnchor="middle" fill={ACC} fontSize={140} fontFamily="var(--font-grotesk), sans-serif" fontWeight={600}>
        ?
      </text>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={340} y={460 + i * 36} width={520 - i * 80} height={14} rx={6} fill={LINE} opacity={0.7 - i * 0.2} />
      ))}
    </Frame>
  )
}

export const SECTION_ILLUS = {
  hero: IlluHero,
  nine: IlluNineAreas,
  framework: IlluFramework,
  editor: IlluEditor,
  navigation: IlluNavigation,
  localData: IlluLocalData,
  state: IlluState,
  mustHaves: IlluMustHaves,
  services: IlluServices,
  backend: IlluBackend,
  ui: IlluUI,
  faq: IlluFAQ,
} as const

export type SectionIlluKey = keyof typeof SECTION_ILLUS
