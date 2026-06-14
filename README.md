# AlcheMix 🎨
 
**Color palette generation and WCAG accessibility auditing in one tool — no backend, no framework, no build step.**
 
Pick a seed color. Pick a harmony mode. Get a palette, its design tokens, and its accessibility score simultaneously.
 
---
## Why This Exists
 
Two problems show up in every design–engineering handoff:
 
**Problem 1 — Inconsistent color tokens.**  
Designers pick brand colors in Figma. Developers translate them manually into CSS variables, often inconsistently across codebases. There is no standard step between "a color swatch" and `--brand-500: #0047AB` in a `:root {}` block. AlcheMix closes that gap in one click.
 
**Problem 2 — Accessibility is an afterthought.**  
WCAG 2.1 compliance is legally required in the US (ADA), EU (EAA, effective 2025), and UK (PSBAR). Despite this, color contrast is routinely checked late in the design process; or not at all. A tool that makes contrast ratios visible at the moment of palette creation changes when that conversation happens.
 
AlcheMix combines both into a single workflow: generate a palette, audit it for WCAG AA compliance, and export it as CSS custom properties — without leaving the browser.
 
---

## Architecture
 
Three files. One external API. Zero dependencies.
 
```
alchemix/
├── index.html    — structure, form inputs, swatch container
├── index.css     — layout, component styles, dark mode, responsive
└── index.js      — state, data fetching, contrast math, DOM rendering
```
 
All application state lives in a single array (`colorsArray`). The UI is always a deterministic function of that array — every state change calls `renderColors()`, which rebuilds the DOM from scratch. This mirrors the unidirectional data flow that React formalises, without the framework overhead.
 
```
User submits form
      ↓
fetch() fires with hex + mode as query params
      ↓
API returns colors array
      ↓
colorsArray = data.colors        ← single state update
      ↓
renderColors()                   ← one re-render from source of truth
      ↓
DOM reflects new state
```
 
---
 
## Data Layer
 
AlcheMix communicates with [The Color API](https://www.thecolorapi.com) a REST endpoint that accepts a hex seed and a harmony mode and returns a mathematically derived color scheme.
 
**Fetching a scheme:**
```js
fetch(`https://thecolorapi.com/scheme?hex=${hexColor}&mode=${schemeMode}&count=5`)
    .then(res => res.json())
    .then(data => {
        colorsArray = data.colors
        renderColors()
    })
```
 
**Query parameters in use:**
 
| Parameter | Purpose |
|-----------|---------|
| `hex` | Seed color without the `#` prefix |
| `mode` | Harmony algorithm — monochrome, analogic, complement, triad, quad, etc. |
| `count` | Number of colors to return |
 
The API response shape that AlcheMix consumes:
```json
{
  "colors": [
    { "hex": { "value": "#0047AB" } },
    { "hex": { "value": "#1E3A8A" } }
  ]
}
```
 
**Fallback state:** if the API is unreachable, a hardcoded fallback palette populates `colorsArray` and `renderColors()` is called identically. The UI never breaks silently.
 
---
 
## WCAG Contrast Engine
 
Contrast ratios are calculated entirely in JavaScript; no secondary API, no library. The implementation follows the [WCAG 2.1 relative luminance formula](https://www.w3.org/TR/WCAG21/#dfn-relative-luminance) precisely.
 
**Step 1 — Linearise sRGB channels:**
```js
function toLinear(c) {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}
```
 
**Step 2 — Compute relative luminance:**
```js
function getLuminance(hex) {
    const [r, g, b] = hexToRgb(hex).map(toLinear)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
```
 
**Step 3 — Compute contrast ratio:**
```js
function getContrastRatio(hex1, hex2) {
    const l1 = getLuminance(hex1)
    const l2 = getLuminance(hex2)
    const lighter = Math.max(l1, l2)
    const darker  = Math.min(l1, l2)
    return ((lighter + 0.05) / (darker + 0.05)).toFixed(2)
}
```
 
Each swatch is tested against both `#FFFFFF` and `#000000`. A ratio of **4.5:1 or above** satisfies WCAG AA for normal text. Results are rendered as pass/fail badges inline on the swatch — visible at the moment of palette creation, not as a separate audit step.
 
---
 
## Design Token Export
 
AlcheMix maps each color to a Tailwind-style token name at render time:
 
```js
const tokenScale = ["100", "300", "500", "700", "900"]
```
 
"Copy CSS Tokens" builds a complete `:root {}` block from the current palette and writes it to the clipboard:
 
```css
:root {
  --brand-100: #93C5FD;
  --brand-300: #60A5FA;
  --brand-500: #3B82F6;
  --brand-700: #1E3A8A;
  --brand-900: #0047AB;
}
```
 
Paste directly into a stylesheet. The data contract between the API response and the token export means zero transformation is needed — the same `colorsArray` that drives rendering drives the export.
 
---
 
## Rendering Strategy
 
The DOM is updated through a single `renderColors()` function using template literals and `innerHTML`:
 
```js
function renderColors() {
    let html = ""
    for (let i = 0; i < colorsArray.length; i++) {
        const color    = colorsArray[i]
        const cleanHex = color.hex.value
        
        html += `<div class="color-column" style="background-color: ${cleanHex}" ...>`
    }
    document.getElementById("palette-container").innerHTML = html
}
```
 
This trades granular DOM diffing for simplicity. For a fixed-count list like a color palette, a full re-render on every state change is imperceptibly fast and eliminates node-tracking complexity entirely.
 
---
 
## Persistence
 
Dark mode preference is stored in `localStorage` and rehydrated synchronously before the first render:
 
```js
function initializeDarkMode() {
    const darkModeSetting = localStorage.getItem("darkMode")
    if (darkModeSetting === "enabled") {
        document.body.classList.add("dark-mode")
        document.getElementById("dark-mode-toggle").checked = true
    }
}
```
 
This runs before `getColorScheme()` on startup, which means the correct theme is applied before any paint occurs — no flash of incorrect theme.
 
---
 
## Built With
 
- **HTML5** — semantic form elements, `type="color"` and `type="checkbox"` native inputs, accessible `for`/`id` label associations
- **CSS3** — `display: flex` for full-height palette columns, CSS transitions for toast and hover states, `@media` query for mobile reflow, `body.dark-mode` scoping for theme cascade
- **Vanilla JavaScript** — Fetch API, Promise chaining, WCAG luminance math, Clipboard API, `localStorage` for preference persistence
- **[The Color API](https://www.thecolorapi.com)** — color scheme generation
- **Zero dependencies** — no npm, no bundler, no transpiler. Deployable by dragging a folder.
---
 
## Roadmap
 
| Feature | What it technically requires |
|---------|------------------------------|
| **AAA mode toggle** | Change the pass threshold from `4.5` to `7.0` — one constant |
| **APCA contrast model** | Replace the WCAG luminance formula with the newer Accessible Perceptual Contrast Algorithm for more perceptually accurate results |
| **Export as Tailwind config** | Serialise `colorsArray` into a `tailwind.config.js` `extend.colors` block instead of a `:root` block |
| **Saved palettes** | Serialise `colorsArray` to `localStorage` with a timestamp key; deserialise into a history panel |
| **Large text threshold** | Add a second badge tier  `3:1` passes AA for text above 18pt, render separately |
 
---
 
## Run Locally
 
No install required.
 
```bash
git clone https://github.com/SheillaO/AlcheMix
cd AlcheMix
open index.html
```

---
 
## Known Bug Fixed
 
The original source had `<formW id="color-form">` — a typo that rendered as an unknown custom element. Browsers do not fire `submit` events on unknown elements, which silently prevented the form's `addEventListener("submit", ...)` handler from ever executing. Fixed to `<form id="color-form">`.


 