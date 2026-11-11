---
name: Virtual Campus 360
colors:
  surface: '#f9f9ff'
  surface-dim: '#cadaff'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e8edff'
  surface-container-high: '#e0e8ff'
  surface-container-highest: '#d7e2ff'
  on-surface: '#041b3c'
  on-surface-variant: '#584238'
  inverse-surface: '#1d3052'
  inverse-on-surface: '#edf0ff'
  outline: '#8c7166'
  outline-variant: '#e0c0b2'
  surface-tint: '#a04100'
  primary: '#a04100'
  on-primary: '#ffffff'
  primary-container: '#f36f21'
  on-primary-container: '#531e00'
  inverse-primary: '#ffb693'
  secondary: '#49607c'
  on-secondary: '#ffffff'
  secondary-container: '#c7dfff'
  on-secondary-container: '#4b637e'
  tertiary: '#005db7'
  on-tertiary: '#ffffff'
  tertiary-container: '#4c96ff'
  on-tertiary-container: '#002e60'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbcc'
  primary-fixed-dim: '#ffb693'
  on-primary-fixed: '#351000'
  on-primary-fixed-variant: '#7a3000'
  secondary-fixed: '#d1e4ff'
  secondary-fixed-dim: '#b0c9e8'
  on-secondary-fixed: '#011d35'
  on-secondary-fixed-variant: '#314863'
  tertiary-fixed: '#d6e3ff'
  tertiary-fixed-dim: '#a9c7ff'
  on-tertiary-fixed: '#001b3d'
  on-tertiary-fixed-variant: '#00468c'
  background: '#f9f9ff'
  on-background: '#041b3c'
  surface-variant: '#d7e2ff'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an immersive, forward-thinking educational environment tailored for prospective students, parents, and academic communities. The identity reflects a dynamic synthesis of technological innovation, national educational prestige, and welcoming hospitality.

### Visual Style
- **Modern Educational Glass-Minimalism:** Clean, spacious planes structured by hairline architectural borders (`#E2E8F0`), high-clarity typography, and controlled depth cues.
- **Spacious & Immersive:** Broad aspect viewports and fluid 360° interactive zones balanced by structured control panels, HUD-style navigation chips, and refined administrative modules.
- **Tone:** Energetic yet authoritative, welcoming, highly legible, and digitally native.

## Colors

The color palette centers on the signature energetic orange balanced by stabilizing academic deep navies and crisp atmospheric backgrounds.

### Palette Architecture
- **Primary (`#F36F21`):** Action-driving core. Applied to primary calls-to-action, active hot spots, key navigation states, and progress markers.
- **Secondary (`#102A43`):** Anchor tone. Used for persistent chrome, panoramic controller surfaces, global navigational headers, and authoritative graphic structures.
- **Tertiary (`#0084FF`):** Informational accent. Dedicated to informative interactive anchors, tour guides, audio cues, and active telemetry indicators. Accompanied by `#E1F0FF` for informational fills.
- **Neutral (`#172B4D`):** Primary text and high-contrast headlines. Supported by slate navy (`#334E68`) for secondary descriptive copy.
- **Supporting Accent (`#10B981`):** Applied to real-time status indicators (e.g., "Live Admissions Open", "Campus Open Now") with a soft tint (`#E6F8F3`) for chip backgrounds.
- **Canvas & Surface:** Light mode by default. `#FFFFFF` serves as base card background, complemented by `#F5F7FA` for canvas backgrounds and layout section framing. Low-contrast architectural borders utilize `#E2E8F0`.

## Typography

The type system blends the geometric optimism of **Plus Jakarta Sans** for headlines, telemetry displays, and wayfinding labels with the robust utility of **Inter** for descriptions, contextual floor notes, and admission curricula.

### Hierarchy & Treatment
- **Headlines:** Use heavy weights (`700` and `800`) in `#172B4D` to establish clear structural landmarks across viewport overlays and marketing panels.
- **Body Copy:** Set in `Inter` with generous line-height ratios (1.5–1.6) to guarantee legibility over both solid surfaces and frosted panoramic HUD layers.
- **Labels & Overlays:** Set in uppercase or semibold `Plus Jakarta Sans` with slight positive tracking (`+0.02em`) for map nodes, coordinates, floor selectors, and facility status badges.

## Layout & Spacing

The layout model optimizes for full-bleed interactive 360° viewports while providing structured, responsive side sheets and content grids.

### Canvas & Grid Model
- **Desktop (1920x1080 baseline):** Utilizes a 12-column fluid grid system with `1.5rem` gutters and `2.5rem` canvas margins. Floating overlays and heads-up-display panels dock to a 16px structural rhythm.
- **Tablet / Mobile Adaptation:**
  - Breakpoints: Desktop (`>= 1024px`), Tablet (`768px - 1023px`), Mobile (`< 768px`).
  - Mobile layouts convert floating control sidebars into collapsible bottom sheets, shrink margins to `1rem`, and dock 360° rotation controls to the bottom thumb-zone.
- **Spatial Consistency:** Use `space-xs` and `space-sm` for compact HUD controls and badge padding; `space-md` for standard card padding and form inputs; `space-lg` and `space-xl` for sectional spacing and panel separation.

## Elevation & Depth

Visual depth is achieved through high-clarity translucent layers, precise hairline boundaries, and diffused ambient lighting that feels airy and modern.

### Layering Principles
- **Base Canvas (Level 0):** Pure background surfaces (`#F5F7FA`) and primary WebGL/360° viewport containers.
- **Grounded Cards & Panels (Level 1):** Solid `#FFFFFF` fill with a `1px` border (`#E2E8F0`) and subtle ambient diffusion: `box-shadow: 0 2px 8px -2px rgba(16, 42, 69, 0.04), 0 1px 3px 0 rgba(16, 42, 69, 0.02)`.
- **Floating Overlays & Campus HUD (Level 2):** Frosted glass panels sitting atop panoramic imagery: `background: rgba(255, 255, 255, 0.88)`, `backdrop-filter: blur(12px)`, `border: 1px solid rgba(255, 255, 255, 0.6)`, and `box-shadow: 0 12px 32px -4px rgba(16, 42, 69, 0.08)`.
- **Modals, 360° Hotspot Tooltips & Drawer Menus (Level 3):** High-priority overlays with elevated elevation: `box-shadow: 0 20px 48px -6px rgba(16, 42, 69, 0.16)`.

## Shapes

The geometric personality features balanced, friendly rounded rectangles with deliberate pill-shaped elements for directional and interactive indicators.

### Geometry Rules
- **Standard UI Elements (`0.5rem` / `8px`):** Inputs, content cards, hotspot tooltips, dropdown menus, and video popups.
- **Structural Panels & Modal Dialogs (`rounded-lg`, `1rem` / `16px`):** Campus selector sheets, floor plan minimaps, and detail cards.
- **Pill Elements (`9999px`):** Hotspot target rings, panoramic rotation controllers, category chips, and floating quick-action pills.

## Components

### Buttons
- **Primary CTA (Admissions & Open Day):** Solid `#F36F21` fill, text `#FFFFFF`, font `Plus Jakarta Sans` semibold. Hover: `#E05E13` with a soft orange glow (`box-shadow: 0 4px 14px rgba(243, 111, 33, 0.35)`). Active: scale down to 0.98.
- **Secondary Button:** Outlined `1.5px` solid `#102A43` or filled with soft gray `#F0F4F8`, text `#102A43`. Hover transitions to `#102A43` background with white text.
- **HUD Glass Button:** Translucent `#FFFFFF` (80% opacity), `1px` border `#E2E8F0`, backdrop-filter blur. Text `#102A43`.

### 360° Hotspots & Interactive Tour Nodes
- **Anchor Point:** Pill/Circular ring in `#F36F21` with a pulsing ambient outer wave (`rgba(243, 111, 33, 0.2)`).
- **Expanded Card:** Floats adjacent to the node with white glass surface, displaying location title (`Plus Jakarta Sans`), quick description (`Inter`), preview thumbnail, and "Enter Room" action.

### Floor Plan Minimap & Campus Selector
- **Minimap Container:** Anchored bottom-left or bottom-right, semi-translucent backdrop, high-contrast floor polygons with active room highlights in `#0084FF`.
- **Campus Selector Dropdown:** Segmented card allowing seamless switching between national campuses (Hanoi, Da Nang, Ho Chi Minh City, etc.) with active location indicated by an orange checkmark.

### Chips & Filters
- **Category Chips (Facilities, Labs, Student Life):** Radius `9999px`, height `32px`. Unselected: `#F5F7FA` surface, text `#334E68`, border `#E2E8F0`. Selected: `#102A43` surface, text `#FFFFFF`.
- **Status Badges:** Emerald green (`#10B981`) text inside `#E6F8F3` badge to communicate live events or facility open hours.

### Form Inputs & Text Fields
- **Container:** Height `44px`, background `#FFFFFF`, border `1px solid #E2E8F0`, corner radius `8px`.
- **Focus State:** Border color transitions to `#F36F21` with a 3px outer ring tinted at `rgba(243, 111, 33, 0.15)`.
- **Typography:** Placeholder in `#334E68` at 60% opacity; active entry in `#172B4D`.

### Cards & Media Panels
- **Layout:** Solid white card with hairline border (`#E2E8F0`), padding `space-md` or `space-lg`.
- **Media Overlays:** Subtle gradient scrim (linear from transparent to `rgba(16, 42, 69, 0.7)`) to ensure legibility of overlaid titles and 360° launch icons.