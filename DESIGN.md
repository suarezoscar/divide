# Divide — Visual System

## Colors

### Primary
- `#07819C` — Primary teal (buttons, links, active states)
- `#056475` — Dark teal (hover)
- `#034958` — Active teal (pressed)

### Surfaces
- `#F5F5F7` — Page background (light gray)
- `#FFFFFF` — Card surface
- `#ECFEFF` — Highlight surface (summary bar)

### Text
- `#1A1A2E` — Primary text
- `#4B5563` — Secondary text
- `#6B7280` — Muted text

### Semantic
- `#059669` — Success / positive balance
- `#DC2626` — Danger / negative balance
- `#07819C` — Information / links

### Border
- `#E5E7EB` — Default border
- `#F3F4F6` — Subtle divider

## Typography
- **Font:** Inter (Google Fonts)
- **Weights:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- **Scale:** 12px (xs), 14px (sm), 16px (base), 18px (lg), 22px (h2), 28px (h1)

## Spacing
- Base unit: 4px
- Scale: 4, 8, 12, 16, 20, 24, 32, 48

## Border Radius
- Buttons/inputs: 12px
- Cards: 16px
- Modals: 20px
- Pills/badges: 999px (full round)

## Shadows
- Card: `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)`
- Elevated: `0 4px 12px rgba(0,0,0,0.08)`
- Modal: `0 8px 32px rgba(0,0,0,0.12)`

## Components
- **Button:** 3 variants (primary/secondary/ghost), 3 sizes (sm/md/lg), min-height 44px
- **Input:** label linked via htmlFor, error state with aria-invalid
- **Card:** white surface, 16px radius, optional onClick with keyboard support
- **Modal:** fade + slide animation, focus trap, scroll lock, role=dialog
- **Avatar:** initials with deterministic color from name hash
- **Toast:** slide-in from top, 3s auto-dismiss

## Motion
- Page transitions: 200ms fadeIn
- Button press: 150ms scale(0.97)
- Modal entrance: 200ms slideUp
- Shimmer skeleton: 1.5s infinite animation

## Accessibility
- All interactive elements: min 44x44px touch target
- Icons: aria-hidden=true, meaningful ones have aria-label
- Forms: labels connected via htmlFor, errors with role=alert
- Modals: role=dialog, aria-modal, focus management
- Tabs: role=tablist/aria-selected
- Toggles: aria-pressed
