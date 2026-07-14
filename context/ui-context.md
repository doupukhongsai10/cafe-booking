# Aura Reserve — UI Design Token Reference

---

## Brand Color Palette (Raw Values)

These are the five foundational brand colors. All semantic tokens below are derived from these.

| Name | Token | Hex | Usage |
|---|---|---|---|
| Espresso | `--color-espresso` | `#3C2A21` | Primary actions, headings, high-contrast elements |
| Beige | `--color-beige` | `#D4A373` | Secondary accent, active states, subtle borders |
| Cream | `--color-cream` | `#FDFCF0` | Page background (light mode) |
| Ember | `--color-ember` | `#E76F51` | Micro-interactions, notifications, priority CTAs |
| White | `--color-white` | `#FFFFFF` | Card surfaces, raised elements |
| Charcoal | `--color-charcoal` | `#1A120B` | Page background (dark mode) |
| Latte | `--color-latte` | `#F0E6D3` | Dark mode surface layer |
| Mocha | `--color-mocha` | `#5D4037` | Mid-tone — borders, dividers, muted elements |

---

## Semantic Color Tokens — Light Mode

### Background & Surface

| Token | Hex | Role |
|---|---|---|
| `--bg-base` | `#FDFCF0` | Page canvas — the cream backdrop |
| `--bg-surface` | `#FFFFFF` | Card, modal, input backgrounds |
| `--bg-surface-raised` | `#FFFFFF` | Elevated cards on hover |
| `--bg-surface-sunken` | `#F5F4E8` | Inset areas, disabled inputs, code blocks |
| `--bg-overlay` | `rgba(255,255,255,0.80)` | Glassmorphism layer — nav, modals, dropdowns |
| `--bg-overlay-blur` | `12px` | Backdrop blur value for glassmorphism surfaces |

### Text

| Token | Hex | Role |
|---|---|---|
| `--text-primary` | `#1B1C15` | Body copy, standard labels |
| `--text-heading` | `#25160E` | Display, headline, and title text |
| `--text-secondary` | `#4F4540` | Supporting text, captions, placeholders |
| `--text-muted` | `#81756F` | Timestamps, metadata, helper text |
| `--text-inverse` | `#FFFFFF` | Text on dark/filled surfaces |
| `--text-on-primary` | `#FFFFFF` | Text inside primary (espresso) buttons |
| `--text-on-secondary` | `#FFFFFF` | Text inside secondary (beige-dark) buttons |
| `--text-link` | `#7D562D` | Inline hyperlinks |
| `--text-link-hover` | `#3C2A21` | Link hover state |

### Interactive — Primary (Espresso)

| Token | Hex | Role |
|---|---|---|
| `--primary` | `#3C2A21` | Primary button fill, key interactive elements |
| `--primary-hover` | `#25160E` | Primary button hover — darkens |
| `--primary-active` | `#1A0E08` | Primary button pressed state |
| `--primary-disabled` | `#A08070` | Primary button disabled state |
| `--primary-subtle` | `#FBDCCE` | Light tint for primary backgrounds (chips, highlights) |
| `--primary-subtle-text` | `#3C2A21` | Text on `--primary-subtle` backgrounds |

### Interactive — Secondary (Beige)

| Token | Hex | Role |
|---|---|---|
| `--secondary` | `#D4A373` | Secondary button outline, active borders |
| `--secondary-hover` | `#C08D5A` | Secondary hover |
| `--secondary-active` | `#A87342` | Secondary pressed |
| `--secondary-subtle` | `#FFDCBD` | Soft beige fills — selected states, tags |
| `--secondary-subtle-text` | `#623F18` | Text on `--secondary-subtle` backgrounds |

### Interactive — Ember Accent (Orange)

| Token | Hex | Role |
|---|---|---|
| `--accent` | `#E76F51` | Notifications, "Limited Spots", priority CTAs |
| `--accent-hover` | `#C9593C` | Accent hover |
| `--accent-active` | `#A8432A` | Accent pressed |
| `--accent-subtle` | `#FFE8E0` | Soft orange fill for badges and tags |
| `--accent-subtle-text` | `#83260E` | Text on `--accent-subtle` backgrounds |

### Border & Outline

| Token | Hex | Role |
|---|---|---|
| `--border-default` | `#E5E1D1` | Card borders, dividers, input default border |
| `--border-subtle` | `#EFEEE3` | Very light dividers, table row separators |
| `--border-strong` | `#D3C3BD` | Emphasized dividers, modal outlines |
| `--border-focus` | `#D4A373` | Input focus ring (beige, 2px) |
| `--border-focus-glow` | `rgba(212,163,115,0.25)` | Outer glow on focused inputs |
| `--border-error` | `#BA1A1A` | Input error state border |

### Status & Feedback

| Token | Hex | Role |
|---|---|---|
| `--status-success` | `#2E7D32` | Booking confirmed, availability confirmed |
| `--status-success-subtle` | `#E8F5E9` | Success chip/badge background |
| `--status-success-text` | `#1B5E20` | Text on success background |
| `--status-warning` | `#E76F51` | Hold expiring soon, limited availability (reuses Ember) |
| `--status-warning-subtle` | `#FFE8E0` | Warning chip background |
| `--status-warning-text` | `#83260E` | Text on warning background |
| `--status-error` | `#BA1A1A` | Cancellation error, validation failure |
| `--status-error-subtle` | `#FFDAD6` | Error chip/message background |
| `--status-error-text` | `#93000A` | Text on error background |
| `--status-info` | `#4F4540` | Neutral informational messages |
| `--status-info-subtle` | `#EDE0DB` | Info chip background |
| `--status-info-text` | `#1B1C15` | Text on info background |

### Booking-Specific Status Chips

| Status | Background | Text | Label |
|---|---|---|---|
| `held` | `#FFF3E0` | `#E65100` | `HOLDING` |
| `confirmed` | `#E8F5E9` | `#1B5E20` | `CONFIRMED` |
| `cancelled` | `#FFDAD6` | `#93000A` | `CANCELLED` |
| `no_show` | `#F5F4E8` | `#4F4540` | `NO SHOW` |
| `completed` | `#EDE7F6` | `#4527A0` | `COMPLETED` |
| `available` | `#E8F5E9` | `#1B5E20` | `AVAILABLE` |
| `unavailable` | `#FFDAD6` | `#93000A` | `UNAVAILABLE` |

### Café Approval Status Chips

| Status | Background | Text | Label |
|---|---|---|---|
| `pending` | `#FFF3E0` | `#E65100` | `PENDING REVIEW` |
| `approved` | `#E8F5E9` | `#1B5E20` | `LIVE` |
| `rejected` | `#FFDAD6` | `#93000A` | `REJECTED` |
| `suspended` | `#F5F4E8` | `#4F4540` | `SUSPENDED` |

---

## Semantic Color Tokens — Dark Mode

### Background & Surface

| Token | Hex | Role |
|---|---|---|
| `--bg-base` | `#1A120B` | Page canvas — deep charcoal-espresso |
| `--bg-surface` | `#2C1F16` | Card, modal, input backgrounds |
| `--bg-surface-raised` | `#3C2A21` | Elevated card on hover |
| `--bg-surface-sunken` | `#14100C` | Inset areas, disabled inputs |
| `--bg-overlay` | `rgba(44,31,22,0.85)` | Glassmorphism layer — nav, modals |

### Text (Dark Mode)

| Token | Hex | Role |
|---|---|---|
| `--text-primary` | `#F0E6D3` | Body copy — warm latte on charcoal |
| `--text-heading` | `#FBDCCE` | Display and headline text |
| `--text-secondary` | `#C7B09A` | Supporting text, captions |
| `--text-muted` | `#8A6F5E` | Timestamps, metadata |
| `--text-on-primary` | `#FFFFFF` | Text on filled primary buttons |
| `--text-link` | `#DEC1B3` | Inline hyperlinks |
| `--text-link-hover` | `#FBDCCE` | Link hover |

### Interactive (Dark Mode)

| Token | Hex | Role |
|---|---|---|
| `--primary` | `#DEC1B3` | Primary button fill (inverted) |
| `--primary-hover` | `#FBDCCE` | Primary hover |
| `--primary-text` | `#281810` | Text inside primary button (dark on light) |
| `--secondary` | `#F0BD8B` | Secondary accent |
| `--accent` | `#EA7253` | Ember — slightly warmer in dark mode |
| `--border-default` | `#3D2F27` | Card borders |
| `--border-focus` | `#F0BD8B` | Input focus ring |

---

## Elevation & Shadow Scale

| Level | Token | Value | Used On |
|---|---|---|---|
| 0 — Flat | `--shadow-none` | `none` | Inputs, chips, flat surfaces |
| 1 — Card | `--shadow-sm` | `0px 4px 20px rgba(60,42,33,0.04)` | Default card state |
| 2 — Card Hover | `--shadow-md` | `0px 8px 24px rgba(60,42,33,0.08)` | Hovered card, focused inputs |
| 3 — Dropdown | `--shadow-lg` | `0px 12px 32px rgba(60,42,33,0.12)` | Dropdowns, date pickers |
| 4 — Modal | `--shadow-xl` | `0px 20px 48px rgba(60,42,33,0.16)` | Modals, overlays |
| 5 — Toast | `--shadow-2xl` | `0px 24px 56px rgba(60,42,33,0.20)` | Floating toasts, sticky nav |

---

## Typography Scale

| Token | Font | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|---|
| `--type-display-lg` | Inter | 48px | 700 | 56px | -0.02em | Hero titles, discovery page header |
| `--type-display-lg-mobile` | Inter | 36px | 700 | 44px | -0.02em | Display-LG on mobile (< 768px) |
| `--type-headline-md` | Inter | 30px | 600 | 38px | -0.01em | Section headings, café name on profile page |
| `--type-title-lg` | Inter | 20px | 600 | 28px | 0 | Card titles, modal headers, nav items |
| `--type-title-md` | Inter | 18px | 600 | 26px | 0 | Sub-section titles, form labels |
| `--type-body-md` | Inter | 16px | 400 | 24px | 0 | All body copy, descriptions |
| `--type-body-sm` | Inter | 14px | 400 | 20px | 0 | Secondary text, helper copy, tooltips |
| `--type-label-caps` | Inter | 12px | 600 | 16px | 0.05em | Status chips, category eyebrows, "Available Now" tags |
| `--type-label-sm` | Inter | 11px | 500 | 16px | 0.04em | Timestamps, metadata, table header labels |

### Typography Pairing Rules

| Context | Heading Token | Body Token |
|---|---|---|
| Hero / Discovery header | `display-lg` | `body-md` |
| Café profile page | `headline-md` | `body-md` |
| Booking card | `title-lg` | `body-sm` |
| Modal | `title-lg` | `body-md` |
| Status badge | — | `label-caps` |
| Form field label | `label-caps` | `body-md` (input) |
| Navigation | `title-md` | — |

---

## Border Radius Scale

| Token | Value | Used On |
|---|---|---|
| `--radius-sm` | `4px` | Checkboxes, small indicators, inner elements |
| `--radius-md` | `8px` | Buttons, text inputs, select dropdowns, tooltips |
| `--radius-lg` | `16px` | Café/food photography, image thumbnails |
| `--radius-xl` | `20px` | Cards, modals, sheets, date picker container |
| `--radius-2xl` | `24px` | Large overlays, hero image containers |
| `--radius-full` | `9999px` | Status chips, tags, badge pills, avatar circles |

---

## Spacing Scale (8px Grid)

| Token | Value | Used On |
|---|---|---|
| `--space-1` | `4px` | Icon padding, tight internal gaps |
| `--space-2` | `8px` | Stack-SM — gap between label and input |
| `--space-3` | `12px` | Chip internal padding, compact elements |
| `--space-4` | `16px` | Stack-MD — standard component internal padding |
| `--space-5` | `20px` | Button horizontal padding, form group gaps |
| `--space-6` | `24px` | Gutter — column gap in grid |
| `--space-8` | `32px` | Stack-LG — section-level vertical rhythm |
| `--space-10` | `40px` | Desktop page margin |
| `--space-12` | `48px` | Hero padding, large section gaps |
| `--space-16` | `64px` | Section-to-section spacing on desktop |
| `--space-20` | `80px` | Top-of-page hero padding |

---

## Component Token Map

Quick reference for key components so CSS stays consistent.

### Button — Primary

| Property | Token | Value |
|---|---|---|
| Background | `--primary` | `#3C2A21` |
| Background Hover | `--primary-hover` | `#25160E` |
| Text | `--text-on-primary` | `#FFFFFF` |
| Border Radius | `--radius-md` | `8px` |
| Padding | `--space-4` / `--space-6` | `16px 24px` |
| Font | `--type-title-md` | Inter 18px / 600 |

### Button — Secondary (Outline)

| Property | Token | Value |
|---|---|---|
| Background | transparent | — |
| Border | `--secondary` | `1px solid #D4A373` |
| Text | `--primary` | `#3C2A21` |
| Border Hover | `--secondary-hover` | `#C08D5A` |
| Border Radius | `--radius-md` | `8px` |

### Button — Ghost

| Property | Token | Value |
|---|---|---|
| Background | transparent | — |
| Text | `--text-heading` | `#25160E` |
| Text Hover | `--primary` | `#3C2A21` |
| Background Hover | `--primary-subtle` | `#FBDCCE` |
| Border Radius | `--radius-md` | `8px` |

### Input Field

| Property | Token | Value |
|---|---|---|
| Background | `--bg-surface` | `#FFFFFF` |
| Border (default) | `--border-default` | `1px solid #E5E1D1` |
| Border (focus) | `--border-focus` | `2px solid #D4A373` |
| Glow (focus) | `--border-focus-glow` | `0 0 0 4px rgba(212,163,115,0.25)` |
| Border (error) | `--border-error` | `1px solid #BA1A1A` |
| Text | `--text-primary` | `#1B1C15` |
| Placeholder | `--text-muted` | `#81756F` |
| Border Radius | `--radius-md` | `8px` |

### Café Discovery Card

| Property | Token | Value |
|---|---|---|
| Background | `--bg-surface` | `#FFFFFF` |
| Border | `--border-default` | `1px solid #E5E1D1` |
| Shadow (default) | `--shadow-sm` | `0px 4px 20px rgba(60,42,33,0.04)` |
| Shadow (hover) | `--shadow-md` | `0px 8px 24px rgba(60,42,33,0.08)` |
| Border Radius | `--radius-xl` | `20px` |
| Image Radius | `--radius-lg` | `16px` |
| Café Name Font | `--type-title-lg` | Inter 20px / 600 |
| Metadata Font | `--type-body-sm` | Inter 14px / 400 |
| Tag Font | `--type-label-caps` | Inter 12px / 600 / 0.05em |

### Navigation Bar

| Property | Token | Value |
|---|---|---|
| Background | `--bg-overlay` | `rgba(255,255,255,0.80)` |
| Backdrop Filter | `--bg-overlay-blur` | `blur(12px)` |
| Border Bottom | `--border-subtle` | `1px solid #EFEEE3` |
| Shadow | `--shadow-2xl` | `0px 24px 56px rgba(60,42,33,0.20)` |
| Position | sticky | `top: 0` |
| Nav Item Font | `--type-title-md` | Inter 18px / 600 |

### Status Chip / Badge

| Property | Token | Value |
|---|---|---|
| Border Radius | `--radius-full` | `9999px` |
| Font | `--type-label-caps` | Inter 12px / 600 / 0.05em |
| Padding | `--space-1` / `--space-3` | `4px 12px` |
| Text Transform | uppercase | — |

---

## Accent & Variant Color Reference

| Variant | Token | Hex | Notes |
|---|---|---|---|
| Primary Tint 10% | `--primary-tint-10` | `#FBDCCE` | Hover backgrounds, subtle fills |
| Primary Tint 20% | `--primary-tint-20` | `#F0C4B0` | Selected state highlights |
| Beige Tint 10% | `--secondary-tint-10` | `#FFDCBD` | Tag/chip fills |
| Ember Tint 10% | `--accent-tint-10` | `#FFE8E0` | Notification backgrounds |
| Scrim | `--scrim` | `rgba(26,18,11,0.40)` | Modal backdrop overlay |
| Skeleton Base | `--skeleton-base` | `#E9E9DD` | Loading skeleton base color |
| Skeleton Shimmer | `--skeleton-shimmer` | `#F5F4E8` | Skeleton shimmer highlight |
| Focus Visible Ring | `--ring-focus` | `rgba(212,163,115,0.50)` | `outline` on keyboard-focused elements |
