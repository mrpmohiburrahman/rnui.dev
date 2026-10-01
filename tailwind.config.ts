// tailwind.config.ts
import type { Config } from "tailwindcss"
import defaultTheme from "tailwindcss/defaultTheme"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // The two webfonts this effort admits, self-hosted via next/font/google.
      // The leading var() is what makes `font-sans` actually the loaded family:
      // `next/font` names the face it emits and asks Tailwind to reference that
      // name, and the two must match exactly — the Haskoy face this key used to
      // name never rendered because next/font emitted `fontSans` while Tailwind
      // asked for `Haskoy`, and nothing failed, it just fell back to system-ui
      // (`.scratch/ui-ux-overhaul/issues/05-delete-dead-weight.md:24-40`).
      // `variable:` in app/layout.tsx is what writes --font-grotesk /
      // --font-jetbrains onto <html>, and the design-tokens test pins the two
      // strings together so the silent fallback cannot come back.
      fontFamily: {
        sans: ["var(--font-grotesk)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-jetbrains)", ...defaultTheme.fontFamily.mono],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Studio Dark tokens, surfaced by name so components write `bg-canvas`
        // rather than `bg-[var(--canvas)]`. These are raw `var()`, NOT
        // `hsl(var(...))` — the thirteen shadcn tokens above hold bare HSL
        // channel triples, the Studio Dark tokens hold complete colours, and
        // `hsl(#0A0B0D)` is invalid so the declaration would be dropped and
        // the element would paint nothing. The cost is that Tailwind's opacity
        // modifier (`bg-canvas/50`) does not work on these keys; that is
        // accepted, because eleven of the tokens already carry baked alpha and
        // the mock never uses the modifier.
        canvas: "var(--canvas)",
        panel: "var(--panel)",
        rail: "var(--rail)",
        header: "var(--header)",
        line: "var(--line)",
        line2: "var(--line2)",
        t1: "var(--t1)",
        t2: "var(--t2)",
        t3: "var(--t3)",
        acc: "var(--acc)",
        "acc-soft": "var(--acc-soft)",
        "on-acc": "var(--on-acc)",
        field: "var(--field)",
        "filter-bar": "var(--filter-bar)",
        empty: "var(--empty)",
        "x-bg": "var(--x-bg)",
        scrim: "var(--scrim)",
        skel: "var(--skel)",
        "new-fg": "var(--new-fg)",
        raise: "var(--raise)",
        plinth: "var(--plinth)",
        ctrl: "var(--ctrl)",
        well: "var(--well)",
        "bar-track": "var(--bar-track)",
        "bar-fill": "var(--bar-fill)",
        "new-bg": "var(--new-bg)",
        dock: "var(--dock)",
        // The design's one failure colour, promoted by ticket 12 (open
        // question 2). #F5B3A4 was drawn once, dark-only, on Tile.dc.html:21;
        // the maintainer chose to promote it, so it gained a light counterpart
        // #9E3A2C and a measured ratio (dark 11.13/10.59, light 6.16/6.78 —
        // both clear 4.5). Text on it must still be chosen for contrast.
        fail: "var(--fail)",

        base: {
          black: "#0A0A0A",
          975: "#121212",
          950: "#1B1B1B",
          900: "#242424",
          850: "#2D2D2D",
          800: "#363636",
          700: "#4A4A4A",
          600: "#5E5E5E",
          500: "#727272",
          300: "#9C9C9C",
          200: "#B6B6B6",
          150: "#D0D0D0",
          100: "#EAEAEA",
          50: "#F5F5F5",
          25: "#FAFAFA",
          paper: "#FFFFFF",
        },

        gray: {
          "25": "#fbfbfb",
          "50": "#f6f6f6",
          "100": "#e7e7e7",
          "200": "#d1d1d1",
          "300": "#b0b0b0",
          "400": "#999999",
          "500": "#6d6d6d",
          "600": "#5d5d5d",
          "700": "#4f4f4f",
          "800": "#454545",
          "900": "#3d3d3d",
          "950": "#262626",
          "975": "#1e1e1e",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // The design's four steps, Specimen.dc.html:146-149. The three keys
        // above are left exactly as they are: they dress the Radix primitives
        // under components/ui/, which have no mock to be checked against.
        tile: "16px",
        panel: "12px",
        chip: "9px",
        badge: "6px",
      },
      boxShadow: {
        // Elevation, Specimen.dc.html:150-154.
        e0: "var(--e0)",
        e1: "var(--e1)",
        e2: "var(--e2)",
        // E1 at detail scale, Detail.dc.html:135-137 — the Recording detail's
        // media box glow. Not the tile's --e1: the values differ in every term,
        // so this is its own token (ticket 09 step 2).
        media: "var(--media-glow)",
      },
      fontSize: {
        // Seven steps, Specimen.dc.html:137-145. Each tuple bakes its own
        // weight, tracking and leading so `text-hero` is one class that cannot
        // drift from the specimen.
        // The two mono steps (metric, label) cannot name a family inside a
        // fontSize tuple, so they are written with `font-mono` alongside.
        //
        // The leadings are each step's *use site* in the mock, not the 1.1 the
        // Specimen draws its own samples at. That 1.1 is the specimen sheet's
        // display convention — one line per row, set tight so the seven rows
        // stack evenly — and baking it made every heading in the build shorter
        // than the drawing. Measured against the mocks:
        //   36px  Detail.dc.html:33  1.12
        //   29px  Catalogue.dc.html:64  1.15   (the only 29px in any mock)
        //   17px  Catalogue.dc.html:86  none -> normal
        //   14.5  Tile.dc.html:45  1.32
        //   12px  Tile.dc.html:47  1.32
        //   10px / 9px  bare everywhere -> normal
        // `normal` is the same value the html rule in globals.css restores, so
        // an un-leaded step and an un-leaded arbitrary size agree.
        detail: [
          "36px",
          { lineHeight: "1.12", fontWeight: "500", letterSpacing: "-0.025em" },
        ],
        hero: [
          "29px",
          { lineHeight: "1.15", fontWeight: "500", letterSpacing: "-0.02em" },
        ],
        section: [
          "17px",
          { lineHeight: "normal", fontWeight: "500", letterSpacing: "-0.01em" },
        ],
        "tile-title": [
          "14.5px",
          { lineHeight: "1.32", fontWeight: "500", letterSpacing: "-0.01em" },
        ],
        "body-sm": [
          "12px",
          { lineHeight: "1.32", fontWeight: "400", letterSpacing: "0" },
        ],
        metric: [
          "10px",
          { lineHeight: "normal", fontWeight: "400", letterSpacing: "0" },
        ],
        // Weight 400, not the 500 the Specimen's own row prints
        // (Specimen.dc.html's `mono 9 / +14% · labels`). Every 9px mono label
        // the four surface mocks actually draw declares no font-weight and so
        // renders at 400 — `CATEGORIES`, `CONTRIBUTORS · 24`, the tile's
        // Category line, the filter bar's `3 ACTIVE`. The Specimen row is a
        // specimen: it sets the weight to show the step exists. The surfaces
        // are what ships.
        label: [
          "9px",
          { lineHeight: "normal", fontWeight: "400", letterSpacing: "0.14em" },
        ],
      },
      // Spacing is deliberately not extended. The Specimen's seven steps
      // (4, 8, 12, 16, 24, 28, 40 — Specimen.dc.html:155-159) all exist in
      // Tailwind's default 4px-based scale as `1 2 3 4 6 7 10`. Adding a key
      // here would leave two names for 28px.
      transitionDuration: {
        // The five moments the Specimen draws, Specimen.dc.html:160-167.
        120: "120ms",
        160: "160ms",
        220: "220ms",
        240: "240ms",
        260: "260ms",
      },
      transitionTimingFunction: {
        // The one custom curve, used by the playing-tile glow (220ms) and the
        // overlay's scrim-plus-rise (240ms). The other moments use the CSS
        // keywords linear / ease-out / ease-in, which Tailwind already ships.
        rise: "cubic-bezier(.2,.8,.2,1)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
