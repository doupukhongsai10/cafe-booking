---
name: Aura Reserve
colors:
  surface: '#fbfaee'
  surface-dim: '#dbdbcf'
  surface-bright: '#fbfaee'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f4e8'
  surface-container: '#efeee3'
  surface-container-high: '#e9e9dd'
  surface-container-highest: '#e4e3d7'
  on-surface: '#1b1c15'
  on-surface-variant: '#4f4540'
  inverse-surface: '#303129'
  inverse-on-surface: '#f2f1e5'
  outline: '#81756f'
  outline-variant: '#d3c3bd'
  surface-tint: '#705a4f'
  primary: '#25160e'
  on-primary: '#ffffff'
  primary-container: '#3c2a21'
  on-primary-container: '#aa9084'
  inverse-primary: '#dec1b3'
  secondary: '#7d562d'
  on-secondary: '#ffffff'
  secondary-container: '#ffca98'
  on-secondary-container: '#7a532a'
  tertiary: '#380600'
  on-tertiary: '#ffffff'
  tertiary-container: '#5d1000'
  on-tertiary-container: '#ea7253'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#fbdcce'
  primary-fixed-dim: '#dec1b3'
  on-primary-fixed: '#281810'
  on-primary-fixed-variant: '#574238'
  secondary-fixed: '#ffdcbd'
  secondary-fixed-dim: '#f0bd8b'
  on-secondary-fixed: '#2c1600'
  on-secondary-fixed-variant: '#623f18'
  tertiary-fixed: '#ffdad2'
  tertiary-fixed-dim: '#ffb4a2'
  on-tertiary-fixed: '#3c0700'
  on-tertiary-fixed-variant: '#83260e'
  background: '#fbfaee'
  on-background: '#1b1c15'
  surface-variant: '#e4e3d7'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system embodies a premium, high-end marketplace aesthetic that blends the hospitality of a boutique café with the precision of a modern SaaS tool. The personality is welcoming yet efficient, aimed at urban professionals and café enthusiasts who value both atmosphere and productivity.

The style is **Sophisticated Minimalism** with a **Tactile Edge**. It draws inspiration from the airy layouts of Airbnb, the typographic clarity of Stripe, and the functional density of Linear. Key characteristics include:
- **Spaciousness:** Generous negative space to evoke a sense of calm and luxury.
- **Warmth:** A shift away from "tech-blue" toward organic, coffee-inspired tones.
- **Glassmorphism:** Strategic use of frosted surfaces for overlays to maintain spatial context.
- **Precision:** A strict 8px grid system ensures the minimalist aesthetic feels intentional and rigorous.

## Colors
The palette is rooted in a warm, organic spectrum that mimics the experience of a high-end coffee house. 

- **Espresso Brown (#3C2A21):** Used for primary actions, high-level headings, and deep-contrast elements.
- **Beige (#D4A373):** Acts as a soft secondary accent for subtle highlights, active states, and borders.
- **Cream (#FDFCF0):** The primary background color for the light mode, providing a softer, more premium feel than pure white.
- **Orange (#E76F51):** Reserved for micro-interactions, notifications, and high-priority call-to-actions.
- **White (#FFFFFF):** Used for card surfaces and raised elements to create a clear visual hierarchy against the Cream background.

**Dark Mode Strategy:** Invert the hierarchy using a deep Charcoal-Espresso (#1A120B) as the base, with subtle Lattes and Creams for typography to maintain legibility and warmth.

## Typography
This design system utilizes **Inter** exclusively to achieve a clean, systematic feel. The hierarchy is driven by tight tracking on large display text to create a high-fashion editorial look, while body text maintains standard spacing for maximum readability.

- Use **Display-LG** for hero sections and marketplace discovery titles.
- Use **Label-Caps** for category eyebrows and small metadata like "Available Now."
- Ensure a 1.5x line-height ratio for body text to maintain the "spacious" brand promise.
- Contrast Espresso text against Cream backgrounds for a sophisticated, low-strain reading experience.

## Layout & Spacing
The layout follows a **Fluid-Fixed Hybrid** model. Content is contained within a 1280px max-width container for desktop viewing, centered with generous side margins.

- **Grid:** A 12-column grid is used for desktop, 8-column for tablet, and 4-column for mobile.
- **Rhythm:** All margins, paddings, and component heights must be multiples of 8px.
- **Vertical Spacing:** Use the "Stack" tokens to maintain consistent vertical rhythm between sections. 
- **Mobile Reflow:** Cards should transition from multi-column grids to a single-column stack on devices smaller than 768px, with margins reducing to 16px to maximize screen real estate.

## Elevation & Depth
Hierarchy is established through **Soft Ambient Shadows** and **Tonal Layering**. 

1. **Base Layer:** Cream (#FDFCF0) background.
2. **Surface Layer:** White (#FFFFFF) cards with a subtle 1px border (#E5E1D1) and a soft, wide-dispersion shadow (0px 4px 20px rgba(60, 42, 33, 0.04)).
3. **Overlay Layer:** Uses **Glassmorphism**. Modals, dropdowns, and sticky navigation bars should use a white translucent fill (opacity 80%) with a 12px backdrop blur. This keeps the user grounded in the café discovery process while focusing on the task at hand.
4. **Interaction:** Elevate cards slightly on hover by increasing shadow spread and decreasing blur (0px 8px 24px rgba(60, 42, 33, 0.08)).

## Shapes
The shape language is "Extra Soft." We use large corner radii to evoke a friendly, approachable, and modern atmosphere.

- **Standard Elements:** (Buttons, Inputs) Use `rounded-md` (8px).
- **Surface Elements:** (Cards, Modals) Use `rounded-xl` (20px) to create a distinctive, premium look.
- **Media:** Photography of cafés and food should always use `rounded-lg` (16px) to match the UI's softness.
- **Interactive Indicators:** Small badges or tags use a full pill-shape.

## Components
- **Buttons:** Primary buttons are Espresso Brown with White text, using 16px horizontal padding. Secondary buttons use a Beige outline or a ghost style with Espresso text.
- **Inputs:** Fields use a White background with a subtle Cream border. On focus, the border transitions to Beige with a 2px soft outer glow.
- **Cards:** The core of the marketplace. Use `rounded-xl`, high-quality imagery, and clear Title-LG typography for café names. Price/Availability should be clearly marked with Espresso text.
- **Chips/Status:** Use the Orange accent for "Limited Spots" or "New" tags. These should be small, capitalized, and use the Label-Caps type scale.
- **Date/Time Picker:** Should feel like a high-end calendar app—clean lines, plenty of whitespace, and clear espresso-colored selection states.
- **Navigation:** Top-bar should be sticky with a 12px backdrop blur, ensuring the brand and primary navigation are always accessible without obstructing the visual content.