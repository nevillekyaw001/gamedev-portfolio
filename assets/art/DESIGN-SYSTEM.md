# Lacquer & Light - the nyankyaw.dev design system

A small, opinionated system for a founder portfolio that had to do three jobs at once:
be **fun** to poke at, feel **juicy** like a good game, and stay **clean** enough that a
B2B client takes it seriously. The mix it targets: ~40% playful interactivity,
~40% game-feel polish, ~20% restraint. Take any of it - it is yours.

Charcoal canvas, Myanmar accents (pagoda gold, jade, lacquer red), editorial serif
headings, calm sans body, and one rule above all: **colour and motion are earned, never
default.** The background sits still; the moments you touch come alive.

---

## 1. Colour

Vibrant accents on a near-black canvas. The accents only appear on things you can act on
(links, buttons, the game, focus states) and on brand signals - never as page-wide fill.

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#121110` | Page canvas, near-black charcoal |
| `--ink` | `#f2ecdc` | Primary text (warm cream) |
| `--ink-soft` | `#b8b0a0` | Secondary text |
| `--ink-faint` | `#837b6c` | Labels, captions, meta |
| `--gold` | `#f4ba38` | Primary accent - pagoda gold |
| `--jade` | `#4fd6a3` | Secondary accent - jade |
| `--lacquer` | `#f2654d` | Tertiary accent - lacquer red |
| `--line` | `rgba(242,236,220,.14)` | Hairline borders |
| `--glass` | `rgba(242,236,220,.05)` | Glass surface fill |
| `--glass-strong` | `rgba(242,236,220,.09)` | Raised glass surface |

Each accent ships three derivatives used for interaction states:

- `--gold-soft` / `--jade-soft` / `--lacquer-soft` - `rgba(...,.16)` tints for hover fills and focus rings.
- `--gold-glow` / `--jade-glow` / `--lacquer-glow` - `rgba(...,.55)` for outer glows on hover/active.

**Contrast:** cream `#f2ecdc` on `#121110` clears WCAG AA for body text. Accents are used
for non-essential emphasis or large text; never rely on colour alone to carry meaning -
every accent pairs with a label, icon, or shape.

**Pairing rule (from the GMM brand book):** gold and lacquer may gradient together. Jade
stays on its own - do not gradient jade into the warm accents.

---

## 2. Type

| Role | Font | Notes |
|---|---|---|
| Display / headings | **Newsreader** (serif) | weight 400, slight negative tracking on the big H1 |
| Body / UI | **Inter** (sans) | weight 300 body, 400-500 for emphasis and labels |
| Burmese | **Noto Sans Myanmar** | for any Burmese script (piece names, cultural notes) |

- Headlines use a serif for editorial warmth; everything functional uses the sans.
- Section labels: 11.5px, uppercase, `0.18em` tracking, `--ink-faint`. On the active tab
  the tracking eases out to `0.24em` - a tiny "this is where you are" cue.
- Lede paragraphs use the serif at `clamp(19px, 3vw, 23px)` to slow the reader down.
- House style: **no em dashes** - use a spaced hyphen ` - `. Voice is humble, confident,
  a little playful. Never corporate filler.

---

## 3. Space, shape, surface

- **Single editorial column**, `max-width: 760px`, `24px` gutters. One screen per tab, no
  endless scroll.
- **Radius:** `--r: 22px` for cards; `999px` for pills and buttons; `14-18px` for inputs
  and chips. Nothing has hard 0px corners.
- **Glass surfaces:** `1px var(--line)` border + `var(--glass)` fill + `backdrop-filter:
  blur(10-14px)`. Borders brighten toward the accent on hover; surfaces never use heavy
  drop shadows at rest - depth comes on interaction.

---

## 4. Motion - the juicy part

Restraint at rest, spring on contact. The signature easing is a gentle overshoot:

```
cubic-bezier(0.34, 1.56, 0.64, 1)   /* "spring" - buttons, chips, icons, cards */
cubic-bezier(0.25, 0.8, 0.3, 1)     /* "settle" - reveals, tab transitions */
```

Patterns to reuse:

- **Press feedback:** interactive elements scale to ~0.94-0.97 on `:active`. Cheap, and it
  makes everything feel physical.
- **Hover lift + glow:** `translateY(-2 to -5px)` plus a tone-matched
  `box-shadow: 0 .. -Npx var(--*-glow)`. The glow colour matches the element's accent.
- **Icon flourish:** small icons `scale(1.1-1.18) rotate(-6 to 6deg)` on parent hover.
- **Staggered reveal:** elements with `.reveal` fade up `16px` as each tab opens, delayed
  `80ms + index*70ms` so content arrives in sequence, not all at once.
- **Click sparks:** every click bursts a few particles tinted to whatever was clicked
  (gold on links, lacquer on buttons, jade on the game board). See section 6.

All motion is wrapped in `@media (prefers-reduced-motion: reduce)` - reveals resolve
instantly, floats and hover transforms switch off, the canvas renders one settled frame.

---

## 5. The context-aware cursor

A custom cursor replaces the system one on fine pointers (disabled on touch and for reduced
motion). A small dot leads; a ring trails with eased follow. Both read the UI underneath
via `el.closest(selector)` and restyle through a `data-ctx` attribute:

| Over | Shape | Colour |
|---|---|---|
| default | dot + 34px ring | gold |
| a link | ring grows to 46px | gold |
| a button / CTA | ring grows to 56px with faint fill | lacquer |
| the game board | small 30px rounded reticle | jade |
| a tilt card | wide 64px soft ring | cream |
| a text field | thin I-beam, dot hidden | gold |

The cursor is the single clearest expression of the system: the interface tells you what
it is by how the pointer answers it.

---

## 6. Components

- **Tab bar:** pill of buttons, the active one gets a soft accent fill and a glow ring.
  Hash-routed (`#play` deep-links the game).
- **Stat chips / cards:** glass pill or card with a tone (`data-tone="gold|jade|lacquer"`).
  Tone drives the icon colour and the hover glow. `data-tilt` adds a small (max ~2deg)
  cursor-tracked 3D tilt.
- **Buttons:** glass pill, accent border + fill + glow on hover, spring press. Icon nudges
  on hover.
- **Game cards / link lists:** image or gradient banner over a glass body; links grow a
  sliding `›` arrow on hover.
- **Portrait niche:** a temple-arch frame (`border-radius: 50% 50% 26% 26% / 62% 62% 22%
  22%`) where the frame itself is the mask - border, glow, and photo share one clipped
  element with `object-fit: cover`, so the border always hugs the image. Gentle float at
  rest, gold glow on hover.

---

## 7. The Sittuyin board (game-feel reference)

The portfolio's mini-game is styled as Burmese lacquerware and is the best worked example
of the system's "juicy" half:

- **Pieces** are red/black lacquer discs with gold royal-army glyphs - crown (King), sword
  (General), elephant, knight (Horse), spoked wheel (Chariot), pawn.
- **Board** is a 3D-tilted lacquer surface (`perspective` + `rotateX`) that relaxes toward
  flat on hover.
- **The general's lines** (the two great diagonals) are drawn per-square. Because the two
  diagonals run in opposite visual directions, each gets its own per-cell gradient angle
  (45deg vs 135deg) so the lines stay continuous corner to corner.
- **Feel:** eased piece slides, capture scale-fade, legal-move dots, check pulse, promotion
  pop, soft sine-wave audio behind a mute toggle, and an opponent who talks - roasts and
  compliments fired on game events, with a silence gate so commentary stays an event.

---

## 8. Background field

A seeded generative flow-field renders quietly behind everything (`quiet-field-3d.js`):
hundreds of particles drifting through a 3D noise volume, the camera leaning toward the
cursor. Accents (gold/jade/lacquer) glow only where currents converge. The rule: if you
notice the mechanism it is too loud; if the room just feels warmer, it is right. Honors
reduced-motion by rendering one settled frame.

---

## 9. Principles (the short version)

1. **Earn the colour.** Accents mark what you can touch and what is brand. Never wallpaper.
2. **Still at rest, alive on contact.** The page is calm until you interact, then it springs.
3. **One message per screen.** Tabs, not a scroll. Each tab does one job.
4. **The interface answers you.** Cursor, hover, and sound confirm every action.
5. **Restraint is the 20%.** When in doubt, remove. The fun lands harder against quiet.
6. **Accessible by default.** AA contrast, visible focus, meaning never carried by colour
   alone, and a full reduced-motion path.

---

*Built with Claude. Steal freely - if any of it helps you ship something, that is the best
outcome it could have.*
