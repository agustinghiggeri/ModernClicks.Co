# ModernClicks — Branding Brief
**Domain:** modernclicks.co
**Version:** 1.0 | March 2026

---

## 1. Brand Identity

**Name:** ModernClicks
**Positioning:** Performance media buying agency for DTC and e-commerce brands scaling paid ads ($10k+/month spend).
**Voice:** Direct, expert, no-fluff. Speaks to growth-oriented founders who are tired of typical agency overhead and underperformance.

---

## 2. Color System

### Dark Theme (Primary)

| Token | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#050505` | Page background |
| `--bg-secondary` | `#0a0a0a` | Section backgrounds |
| `--bg-card` | `#0f0f0f` | Card surfaces |
| `--bg-card-hover` | `#141414` | Card hover state |
| `--bg-elevated` | `#1a1a1a` | Modals, dropdowns, elevated UI |
| `--text-primary` | `#f5f5f5` | Headings, primary body text |
| `--text-secondary` | `#a0a0a0` | Supporting text, labels |
| `--text-muted` | `#666666` | Placeholder, tertiary content |
| `--text-faint` | `#444444` | Decorative/disabled text |
| `--accent-primary` | `#6d5acd` | Primary CTA buttons, active states, highlights |
| `--accent-light` | `#8b7ae0` | Hover states, icon accents |
| `--accent-glow` | `rgba(109, 90, 205, 0.30)` | Glows, button shadows |
| `--accent-subtle` | `rgba(109, 90, 205, 0.08)` | Subtle tinted backgrounds |
| `--green` | `#22c55e` | Success states, positive metrics |
| `--green-glow` | `rgba(34, 197, 94, 0.15)` | Green accents on dark backgrounds |
| `--border` | `rgba(255, 255, 255, 0.06)` | Default borders |
| `--border-hover` | `rgba(255, 255, 255, 0.12)` | Hover borders |

### Light Theme (Secondary)

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#f8fafc` | Page background |
| `--card` | `#ffffff` | Card surfaces |
| `--border` | `#e2e8f0` | Borders, dividers |
| `--text` | `#0f172a` | Primary body text |
| `--muted` | `#64748b` | Supporting/label text |
| `--accent` | `#6366f1` | Primary CTA (indigo variant) |
| `--accent-hover` | `#4f46e5` | CTA hover |
| `--green` | `#10b981` | Positive metrics, success |
| `--red` | `#ef4444` | Errors, warnings |

### Color Notes
- The **purple/indigo accent** (`#6d5acd` dark / `#6366f1` light) is the brand's signature color — used consistently for primary CTAs and key highlights.
- The dark theme uses near-black backgrounds for a premium, high-contrast aesthetic.
- The light theme uses cool off-whites (`#f8fafc`) rather than pure white to reduce harshness.
- Green (`#22c55e` / `#10b981`) is used exclusively for positive performance metrics, never for CTAs.

---

## 3. Typography

### Font Families

| Font | Category | Weights Used | Role |
|---|---|---|---|
| **Inter** | Sans-serif | 300, 400, 500, 600, 700, 800, 900 | Primary — all headings, body, UI labels |
| **JetBrains Mono** | Monospace | 400, 500, 600 | Code snippets, technical callouts, error pages |

### Import (Google Fonts)
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

### Type Scale Guidelines

| Element | Weight | Notes |
|---|---|---|
| Hero headline | 800–900 | Largest text on the page |
| Section headings (H2) | 700 | Prominent but not competing with hero |
| Subheadings (H3) | 600 | Card titles, feature names |
| Body copy | 400 | Standard readable weight |
| Labels / UI text | 500–600 | Buttons, nav, tags |
| Muted/supporting copy | 300–400 | Captions, disclaimers |
| Code / mono blocks | JetBrains Mono 400–600 | Technical, system-style UI |

### Fallback Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
font-family: 'JetBrains Mono', monospace;
```

---

## 4. Logo

### Current Implementation
- **Mark:** SVG lightning bolt icon (24×24px nav / 20×20px footer)
- **SVG Path:** `M13 2L3 14H12L11 22L21 10H12L13 2Z`
- **Color:** `currentColor` — inherits from context (accent purple in interactive states, off-white on dark, near-black on light)
- **Wordmark:** "ModernClicks" — Inter 700, 16px (nav) / 20px (larger contexts)
- **Layout:** Icon + wordmark side-by-side, no tagline in logo lockup

### Logo Markup Pattern
```html
<a href="/" class="logo">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z"/>
  </svg>
  <span>ModernClicks</span>
</a>
```

---

## 5. Page Inventory

| File | Theme | Purpose |
|---|---|---|
| `index.html` | Dark | Main landing page |
| `index-light.html` | Light | Main landing page (light) |
| `index-v2.html` | Dark | Discovery call booking |
| `index-v2-light.html` | Light | Discovery call booking (light) |
| `audit.html` | Dark | Free audit landing page |
| `audit-light.html` | Light | Free audit landing page (light) |
| `audit-v2.html` | Dark | Audit discovery call booking |
| `audit-v2-light.html` | Light | Audit discovery call booking (light) |
| `audit-request.html` | Light | Audit intake form |
| `thank-you.html` | Dark | Post-booking confirmation |
| `thank-you-light.html` | Light | Post-booking confirmation (light) |
| `404.html` | Dark | 404 error page |
| `404-light.html` | Light | 404 error page (light) |

---

## 6. Deployment

| Environment | Domain |
|---|---|
| Production | `https://modernclicks.co` |
| Hosting | Vercel |
| Config | `vercel.json` (clean URLs, security headers, CSP) |

### CSP Allowed Origins (key)
- `https://www.googletagmanager.com` — Google Analytics
- `https://connect.facebook.net` — Meta Pixel
- `https://calendar.google.com` — Booking integration
- `https://n8n.srv1201694.hstgr.cloud` — Automation (email workflows)

---

## 7. Design Principles

1. **Dark-first** — The dark theme is the primary customer-facing experience. The light theme mirrors it for preference/accessibility.
2. **Purple as conversion signal** — The accent color is reserved for things the visitor should click. Don't use it decoratively.
3. **Monospace for credibility** — JetBrains Mono used sparingly to signal technical sophistication (metrics, error pages, code snippets).
4. **No white on pure black** — Backgrounds use `#050505` not `#000000` to avoid harsh contrast while maintaining premium feel.
5. **Green for wins only** — Green is strictly for positive performance data (ROAS, revenue, metrics). Never for CTAs or navigation.
