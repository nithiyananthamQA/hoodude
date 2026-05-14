# HOODUDE DESIGN SYSTEM

## 🎨 Color Palette

### Text Colors (Three-Tier Scale)
```
text-fg        → #0a0a0a         (high contrast, titles, prices)
text-fg-mute   → rgba(..., 0.55)  (mid-tone, body text)
text-fg-faint  → rgba(..., 0.35)  (low contrast, disabled, meta)
```

### Brand Colors
```
brand    → #fa5d42 (orange accent)
ink      → #0e0e0e (near-black for text/backgrounds)
```

## 📐 Type Scale

All sizes use `clamp()` for fluid scaling across viewport widths.

```
Display  → clamp(56px, 8vw, 96px)    (hero titles)
H1       → clamp(40px, 5.5vw, 72px)  (page titles)
H2       → clamp(32px, 4vw, 48px)    (section heads)
H3       → clamp(22px, 2.4vw, 28px)  (subsection)
Body-lg  → 17px                        (emphasized body)
Body     → 15px                        (primary body)
Meta     → 13px                        (secondary, labels)
Caption  → 11px                        (eyebrow, meta)
```

### Fonts
```
Sans  → Poppins (default for everything)
Serif → Instrument Serif (editorial, pull quotes, display moments)
Mono  → Poppins (code, monospace fallback)
```

### Font Weights (Cap at Semibold)
```
Regular      → 400 (input placeholders, body defaults)
Medium       → 500 (some labels)
Semibold     → 600 (headings, emphasis, strong, b tags)
Bold/Black   → ❌ NEVER USE
```

## 🎯 Spacing Scale

Consistent rhythm based on 6px base unit (Tailwind 0.5rem).

```
gap-xs   → 0.375rem (6px)   (tight grouping)
gap-sm   → 0.5rem   (8px)   (compact)
gap-md   → 0.75rem  (12px)  (standard)
gap-lg   → 1rem     (16px)  (generous)
gap-xl   → 1.5rem   (24px)  (section separation)
gap-2xl  → 2rem     (32px)  (major section)
```

## 🖱️ Icon Sizing Scale

All icons should match one of these sizes:

```
icon-xs  → 12px  (toggles, metadata icons, footnotes)
icon-sm  → 14px  (button icons, labels)
icon-md  → 16px  (primary CTAs, navigation, standard)
icon-lg  → 20px  (hero secondary, large UI)
icon-xl  → 24px  (hero primary, major focal points)
```

**Example Usage:**
```tsx
<ChevronLeft size={16} />     // icon-md (standard)
<Heart size={14} />            // icon-sm (in button)
<Play size={20} />             // icon-lg (video overlay)
```

## 🔘 Button States

### Press States (Unified)
All buttons use one of two scales:

```
.btn-press      → active:scale-[0.97]  (primary, CTAs)
.btn-press-sm   → active:scale-[0.95]  (secondary, small)
```

**Example:**
```tsx
// Primary button
<button className="btn-press bg-black text-white">
  Add to cart
</button>

// Secondary icon button
<button className="btn-press-sm size-8 rounded-full">
  <ChevronLeft size={16} />
</button>
```

### Hover States
```
Black buttons  → hover:bg-brand (orange)
Text buttons   → hover:text-black (deepen)
Bordered       → hover:border-black (darken)
```

## 🔲 Border Radius

```
rounded-none   → 0px   (sharp, dialogs)
rounded-sm     → 4px   (subtle)
rounded-md     → 6px   (standard, buttons)
rounded-lg     → 8px   (cards, modals)
rounded-full   → 999px (pills, avatars)
```

## 🎬 Animation Timing

### Motion Curves
```
Primary Ease    → [0.16, 1, 0.3, 1]    (smooth, premium feel)
Reveal Ease     → [0.5, 0, 0.75, 0]    (gentle entrance)
Quick Ease      → cubic-bezier(0.4, 0, 0.2, 1)
```

### Durations
```
Toast/Micro     → 150–200ms  (feedback, tooltips)
Transition      → 300–500ms  (hover, focus)
Page Transition → 600–900ms  (route changes)
Loop            → 2–8s       (continuous, background)
```

## 🌐 Responsive Breakpoints

```
xs  → 0px        (mobile, default)
sm  → 640px      (large phone)
md  → 768px      (tablet)
lg  → 1024px     (desktop)
xl  → 1280px     (wide desktop)
2xl → 1536px     (ultra-wide)
```

## ✨ Special Effects

### Gloss Highlight (Tilt3D Component)
```
Radial gradient that follows cursor
Blend mode: multiply
Opacity: 0–100% (hidden → hover)
```

### Parallax
```
Scroll-driven offset (useScroll + useTransform)
Hero: image zoom + text fade
Most Ordered: heading + grid offset
Watch & Buy: section-bound movement
```

### Magnetic Cursor Pull
```
Max drift: 20–30% of element bounds
Spring: stiffness 220, damping 18, mass 0.4
Respects: prefers-reduced-motion
```

## 🎯 Touch & Keyboard

### Minimum Touch Targets
```
Buttons     → 44×44px minimum
Icons       → 40×40px container minimum
Links       → 40×40px touch area
Tap Feedback → active:scale-[0.97–0.95]
```

### Keyboard Navigation
- **Tab** → Next focusable element
- **Shift + Tab** → Previous focusable element
- **Enter/Space** → Activate button/link
- **Escape** → Close modal/drawer
- **Arrow Keys** → Navigate lists/tabs

## 🌍 Dark Mode (Future)

Currently light-only. Dark mode tokens are defined in `theme.css` but not activated.

To enable:
```css
html.dark { --background: dark; ... }
```

## 📐 Layout Patterns

### Page Structure
```html
<main id="main-content">
  <section class="px-8 md:px-16 py-16 md:py-32">
    <!-- content -->
  </section>
</main>
```

### Card Pattern
```html
<div class="aspect-[3/4] overflow-hidden rounded-lg bg-[#f5f5f5]">
  <!-- image or content -->
</div>
```

### Grid Pattern
```
2 cols   → grid-cols-2 (mobile)
3 cols   → md:grid-cols-3
5 cols   → lg:grid-cols-5 (desktop)
Gap      → gap-3 (compact) or gap-4 (spacious)
```

## 📋 Component Checklist

When creating new components:

- [ ] Use design tokens (no magic color/size values)
- [ ] Proper spacing scale (gap-xs, gap-sm, etc.)
- [ ] Icon sizes from scale (icon-sm, icon-md, etc.)
- [ ] Button states (btn-press or btn-press-sm)
- [ ] Mobile-first responsive (base → sm → md → lg)
- [ ] Keyboard navigable (tab order, focus visible)
- [ ] Screen reader friendly (aria labels, alt text)
- [ ] Respects prefers-reduced-motion
- [ ] Touch-friendly targets (min 44px)
- [ ] TypeScript types (no `any`)

---

**Last Updated:** May 10, 2026  
**Version:** 2.0 (Post-Audit)
