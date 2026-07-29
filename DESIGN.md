# Design — Project Identity

> This document is project-long-lived. Tokens are not changed without
> the Architect's approval. Developers MUST use these tokens
> instead of improvising their own colors/spacings.

## Style Direction

Glamouröses Cinema-Noir – tiefer, warmtoniger Dunkel-Hintergrund mit edlen Gold-Akzenten, großzügiger Serifen-Typografie und dezenten Spotlight-Glow-Effekten. Wie ein persönlicher Kleiderschrank auf dem Red Carpet: luxuriös, inszeniert, aber nie überladen.

## Colors

- `--color-bg`: **#0D0A07**
- `--color-fg`: **#F5F0E8**
- `--color-accent`: **#C9A84C**
- `--color-accent_light`: **#DDBF6E**
- `--color-accent_dark`: **#A8892E**
- `--color-border`: **#2A2520**
- `--color-muted`: **#8A8078**
- `--color-surface`: **#1A1510**
- `--color-surface_raised`: **#221C16**
- `--color-error`: **#C0392B**
- `--color-success`: **#3D8B40**
- `--color-glow`: **rgba(201,168,76,0.25)**

## Typography

- `font_family`: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- `heading_font_family`: 'Playfair Display', 'Times New Roman', Georgia, serif
- `heading_weight`: 700
- `body_weight`: 400
- `size_scale`: clamp: 12px(legal)/14px(base)/16px(h4)/20px(h3)/28px(h2)/40px(h1)/56px(hero)

## Spacing Scale

- `--space-0`: 4px
- `--space-1`: 8px
- `--space-2`: 12px
- `--space-3`: 16px
- `--space-4`: 24px
- `--space-5`: 32px
- `--space-6`: 48px
- `--space-7`: 64px

## Border-Radii

- `--radius-sm`: 4px
- `--radius-md`: 8px
- `--radius-lg`: 16px
- `--radius-pill`: 999px

## Components

### Button/Primary

bg=accent(#C9A84C), color=bg(#0D0A07), font-weight:600, padding:12px 28px, border-radius:md(8px), border:none, min-height:48px, cursor:pointer, transition:all 0.2s ease. Hover: bg=accent_light(#DDBF6E), box-shadow:0 0 20px glow. Active: bg=accent_dark(#A8892E), transform:scale(0.97). Disabled: opacity:0.4, cursor:not-allowed, no shadow. Touch target ≥48px.

### Button/Secondary

bg=transparent, color=accent(#C9A84C), border:1.5px solid accent, font-weight:600, padding:12px 28px, border-radius:md(8px), min-height:48px, cursor:pointer, transition:all 0.2s ease. Hover: bg=accent at 10% opacity, box-shadow:0 0 12px glow. Active: bg=accent at 18% opacity. Disabled: opacity:0.4, cursor:not-allowed.

### Button/Danger

bg=transparent, color=error(#C0392B), border:1.5px solid error, font-weight:600, padding:12px 28px, border-radius:md(8px), min-height:48px. Hover: bg=error at 10% opacity. Active: bg=error at 18% opacity. Disabled: opacity:0.4.

### Card/Garment

bg=surface(#1A1510), border:1px solid border(#2A2520), border-radius:lg(16px), padding:16px, transition:all 0.3s ease. Hover: border-color=accent at 40% opacity, box-shadow:0 8px 32px glow, transform:translateY(-2px). Image area: aspect-ratio 3/4, object-fit:cover, border-radius:md(8px). Label below image: font-weight:500, color=fg, margin-top:8px.

### Card/Outfit

bg=surface_raised(#221C16), border:1.5px dashed border(#2A2520), border-radius:lg(16px), padding:20px, min-height:200px, transition:all 0.3s ease. Hover: border-color=accent at 60% opacity, box-shadow:0 4px 24px glow. Title: heading_font, color=accent, font-size:20px, margin-bottom:12px.

### Input/Text

bg=surface(#1A1510), color=fg(#F5F0E8), border:1.5px solid border(#2A2520), border-radius:md(8px), padding:12px 16px, font-size:14px, min-height:48px, transition:border-color 0.2s ease. Placeholder: color=muted(#8A8078). Focus: border-color=accent(#C9A84C), box-shadow:0 0 0 3px glow, outline:none. Error: border-color=error.

### Input/Select

Same as Input/Text plus custom chevron icon in accent color, appearance:none, padding-right:40px.

### Modal

Backdrop: bg=#0D0A07 at 85% opacity, backdrop-filter:blur(4px). Panel: bg=surface(#1A1510), border:1px solid border, border-radius:lg(16px), padding:32px, max-width:480px, width:90vw, box-shadow:0 24px 80px rgba(0,0,0,0.6). Title: heading_font, color=accent, font-size:28px, margin-bottom:24px. Close button: color=muted, hover=accent, positioned top-right 16px.

### NavBar

bg=bg at 92% opacity, backdrop-filter:blur(12px), border-bottom:1px solid border, padding:0 32px, height:64px, display:flex, align-items:center, justify-content:space-between, position:sticky, top:0, z-index:100. Logo: heading_font, color=accent, font-size:24px, letter-spacing:1px, text-transform:uppercase. Nav links: color=muted, font-weight:500, gap:24px. Active link: color=accent. User area: avatar 36px circle, border:2px solid accent.

### DragZone/OutfitCreator

Drop area: bg=surface(#1A1510) with subtle repeating pattern of accent-colored dots at 8% opacity, border:2px dashed accent at 50% opacity, border-radius:lg(16px), min-height:400px, padding:24px, transition:all 0.25s ease. Drag-over state: border-color=accent, bg=surface_raised, box-shadow:inset 0 0 60px glow. Placed item: 120x160px thumbnail with border-radius:md, shadow:0 4px 12px rgba(0,0,0,0.4), cursor:grab. Dragging: opacity:0.6, transform:scale(1.05), box-shadow:0 12px 32px glow.

### CategoryFilter/Chips

Container: display:flex, gap:8px, flex-wrap:wrap. Chip: bg=surface, color=muted, border:1px solid border, border-radius:pill(999px), padding:8px 20px, font-size:13px, font-weight:500, cursor:pointer, transition:all 0.2s ease. Hover: border-color=accent at 50% opacity, color=fg. Active: bg=accent, color=bg, border-color=accent, font-weight:600.

### Toast/Notification

bg=surface_raised(#221C16), border-left:4px solid accent, color=fg, border-radius:md(8px), padding:16px 20px, box-shadow:0 8px 32px rgba(0,0,0,0.5), font-size:14px, max-width:380px, animation:slideInRight 0.3s ease. Success variant: border-left-color=success. Error variant: border-left-color=error.

## Layout Principles

- Container max-width: 1200px, centered with padding: 0 24px (mobile) / 0 32px (desktop)
- Breakpoints: mobile < 640px, tablet 640–1024px, desktop ≥ 1025px
- Page grid: single-column stack on mobile, 2-column grid (sidebar 280px + main) on tablet+, 3-column card grid for gallery on desktop
- Section spacing: 64px vertical gap between major sections (mobile: 48px)
- Garderobe gallery: CSS Grid, auto-fill, minmax(220px, 1fr), gap: 20px
- Outfit-Creator layout: 2-column (source panel left 35% + drop zone right 65%) on desktop, stacked on mobile
- Typography rhythm: headings use heading_font_family, body uses font_family; line-height 1.5 for body, 1.2 for headings
- All interactive elements min touch target 44px (mobile), 48px preferred
- Z-Index scale: base(0), cards(1), sticky-nav(100), modal-backdrop(200), modal-panel(210), toast(300)
- Scroll behavior: smooth scrolling, custom scrollbar (bg=bg, thumb=border, width:6px)
