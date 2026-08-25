# Design.md — TrueHire Design System

This is the single source of truth for visual decisions. Every prompt to Stitch, every component built by hand or by an AI coding tool, should match these tokens exactly — no re-deriving colors or spacing per screen.

## 1. Design philosophy
Flat, monochrome, engineering-tool feel — closer to Linear/Vercel/shadcn than a typical "AI-generated SaaS" look. Depth comes from **hairline borders**, not shadows or glow. Color is **rationed**: it appears only where it's functionally meaningful (risk level, match %), never as ambient decoration.

## 2. Color tokens

### Base (dark, primary theme)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#0A0A0B` | App background |
| `--surface` | `#0F0F11` | Table rows, flat surfaces |
| `--glass` | `rgba(255,255,255,0.035)` | Card background (very faint tint, not heavy frosted glass) |
| `--glass-hover` | `rgba(255,255,255,0.06)` | Hover state background |
| `--border` | `rgba(255,255,255,0.08)` | Default hairline border |
| `--border-strong` | `rgba(255,255,255,0.14)` | Hover/focus border |

### Text
| Token | Value | Use |
|---|---|---|
| `--ink` | `#F2F2F3` | Primary text |
| `--ink-dim` | `#9A9AA2` | Secondary text |
| `--ink-faint` | `#5C5C64` | Muted/labels |

### Status colors (used ONLY in badges, pills, rings, bars)
| Token | Value | Meaning |
|---|---|---|
| `--teal` | `#2FBFA8` | Low risk / good match / brand accent |
| `--teal-dim` | `#1B7A6B` | Teal gradient partner (match bars) |
| `--amber` | `#D69A45` | Medium risk |
| `--red` | `#D9564D` | High risk |

**Rule:** status colors never become full-card backgrounds. They appear as: a 1px border + ~10% tint background on pills, a stroke color on the risk ring, or a gradient fill on the match bar. Everything else — buttons, nav, sidebar, inputs — stays grayscale.

## 3. Typography
- **Inter** — all UI text, headings and body both (weights 400/500/600/700). One family only; do not mix in a second display font.
- **JetBrains Mono** — numeric/data values only: scores, day counts, percentages, timestamps, IDs.

## 4. Spacing & shape
- Corner radius: `12px` for cards, `7-8px` for buttons/inputs/nav items, `99px` (full) for pills/badges
- Borders: `1px solid`, always — this is the primary depth cue instead of shadows
- Shadows: reserved for modals/popovers only, and kept subtle: `0 4px 12px rgba(0,0,0,0.4)`

## 5. Motion principles
**Every animation must be a response to a specific user action or a one-time load event. Nothing loops or runs ambiently in the background.**

Approved motion patterns:
1. **Cursor-tracking spotlight** on card/row hover — a soft radial glow that follows the mouse position within the card, fades out on mouse-leave
2. **Sliding indicator** for the sidebar nav — glides to whatever is hovered, eases back to the active item on mouse-leave
3. **Count-up numbers** — stat values (days open, match %) animate from 0 to their value once, on load, ~900ms–1.1s, ease-out-cubic
4. **Ring/progress draw-in** — SVG stroke-dashoffset animates once on load
5. Standard hover/focus transitions: 150ms ease on border-color/background-color changes only

**Explicitly not allowed:** orbiting/rotating decorative elements, marquees/tickers, pulsing/breathing backgrounds, magnetic buttons, animated gradient blobs, infinite-loop shine sweeps on static content. These read as generic "AI-generated" flourish rather than purposeful interaction, and this product's differentiator is trust/credibility — the UI should reinforce that with restraint, not undercut it with decoration.

## 6. Component patterns (reference)
- **Requisition row:** grid layout, hairline bottom border, spotlight-on-hover, risk pill + match bar as the only colored elements
- **Risk signal card:** ring (draws in once) + stat row in mono font + "Why this score?" ghost button — never a triangle-icon warning toast
- **Badges/pills:** uppercase-adjacent small text, colored border + faint tint background, small dot indicator matching the status color
- **Buttons:** primary = solid white bg / black text (inverted, shadcn-default); secondary = outline; ghost = text-only, no border; destructive = red text/border, transparent background
- **Focus states:** 2px ring in `--ink` or `--border-strong`, 2px offset — must always be visible, this is a non-negotiable accessibility requirement

### Glass card (spotlight-hover)
- Background: `--glass` token + `backdrop-blur-md` (monochrome frosted-glass, never colored)
- Border: `--border`, becomes `--border-strong` on hover
- Hover: lifts `-4px` (translateY), soft **white** shadow glow (`rgba(255,255,255,0.08)`) — never colored/brand-tinted
- Spotlight: pure white radial gradient (`rgba(255,255,255,0.06)`) that follows the cursor within the card bounds, fades in/out on enter/leave — this is the approved cursor-tracking pattern from §5.1, now implemented as `components/ui/GlassCard.tsx`
- **Explicitly rejected from the Lumina reference:** purple/indigo glow shadows, ambient WebGL shader backgrounds, colored blur — all violate §8's "no purple" and §5's "no ambient/looping motion" rules

## 7. Logo & brand mark
Primary mark: **Verified Beacon** (shield outline with a check-stroke that draws in once, teal gradient stroke). Used at icon-only size in the sidebar/favicon; paired with the "TrueHire" wordmark (Inter, 700 weight, "True" in `--ink`, "Hire" in `--teal`) in the navbar and marketing contexts.

Alternate mark: **Connection Bars** (three horizontal bars + vertical stem, teal→cyan gradient, floating idle animation + hover pulse) — kept as an explored alternate/hero-moment asset alongside Verified Beacon; not used interchangeably in the product chrome (nav/favicon stay Verified Beacon for consistency).

## 8. What NOT to do (running list from past iterations)
- No purple/indigo/violet — an earlier Stitch export drifted to `#7C6FF0`; this was rejected in favor of the zinc/teal system above
- No heavy glassmorphism/backdrop-blur — earlier "Lumina" system used frosted glass panels; replaced with flat surfaces + hairline borders
- No mixing multiple display fonts (earlier drafts mixed Space Grotesk/Sora/Satoshi) — Inter only, per §3
