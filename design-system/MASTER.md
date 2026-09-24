# Research Thesis Portal — MASTER Frontend Design System

**Project:** Research Thesis Portal  
**Stack:** Angular + TypeScript + Tailwind CSS  
**Product type:** Academic thesis/research management portal  
**Primary roles:** Student, Lecturer, Admin  
**Scope:** Shared frontend design system for all Member A and Member B features.

This document defines the global UI direction, tokens, layout rules, component conventions, interaction states, accessibility standards, and role-based navigation patterns. It is the frontend source of truth unless a future page-specific design document explicitly overrides it.

---

## 1. Overall visual direction

The interface should feel:

- Professional
- Modern
- Academic
- Clean
- Trustworthy
- Easy to scan
- Suitable for dashboards, data tables, forms, approvals, status workflows, and administrative tasks

Use an **institutional dashboard style**:

- Light, neutral backgrounds
- White content surfaces
- Clear typography
- Structured spacing
- Subtle borders
- Minimal shadows
- Strong table and form readability
- Calm academic color palette

Avoid:

- Flashy gradients
- Heavy animation
- Glassmorphism as a default style
- Marketing/SaaS landing-page visual style
- Playful oversized rounded UI
- Excessive shadows, blur, glow, or decorative effects

The design should prioritize clarity and consistency over visual novelty.

---

## 2. Color palette

Use semantic color tokens instead of raw colors inside components.

### Core colors

| Token | Hex | Usage |
|---|---:|---|
| `primary` | `#1E3A5F` | Main brand color, sidebar active state, primary buttons |
| `primary-hover` | `#172F4D` | Primary hover state |
| `primary-soft` | `#E8EEF5` | Subtle primary background |
| `secondary` | `#2563EB` | Links, secondary highlights, informational actions |
| `accent` | `#A16207` | Academic/research accent, warnings with care |
| `background` | `#F8FAFC` | App background |
| `surface` | `#FFFFFF` | Cards, tables, dialogs, forms |
| `surface-muted` | `#F1F5F9` | Section blocks, table headers, subtle containers |
| `border` | `#CBD5E1` | Default border |
| `border-subtle` | `#E2E8F0` | Dividers and light borders |

### Text colors

| Token | Hex | Usage |
|---|---:|---|
| `text-primary` | `#0F172A` | Main text |
| `text-secondary` | `#334155` | Supporting text |
| `text-muted` | `#64748B` | Metadata, descriptions |
| `text-disabled` | `#94A3B8` | Disabled text |
| `text-inverse` | `#FFFFFF` | Text on dark backgrounds |

### Semantic colors

| Token | Hex | Usage |
|---|---:|---|
| `success` | `#15803D` | Approved, completed, successful |
| `success-soft` | `#DCFCE7` | Success badge background |
| `warning` | `#B45309` | Pending, attention required |
| `warning-soft` | `#FEF3C7` | Warning badge background |
| `danger` | `#DC2626` | Rejected, failed, destructive actions |
| `danger-soft` | `#FEE2E2` | Danger badge background |
| `info` | `#2563EB` | Informational states |
| `info-soft` | `#DBEAFE` | Info badge background |
| `neutral` | `#475569` | Draft, inactive, archived |
| `neutral-soft` | `#E2E8F0` | Neutral badge background |

### Color rules

- Use `primary` for the most important action on a screen.
- Use `danger` only for destructive or failed states.
- Do not communicate state by color alone; pair color with text and, when useful, an icon.
- Body text must meet WCAG AA contrast: minimum `4.5:1`.
- Borders should be visible but subtle.

---

## 3. Typography

Use a practical academic UI typography system.

### Font family

Recommended:

```text
Primary UI font: Inter
Fallback: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
Optional academic display font: Source Serif 4 or Merriweather for major landing/title moments only
```

For the application UI, use **Inter** everywhere by default because it is clear in tables, forms, dashboards, and dense admin screens.

### Type scale

| Token | Size | Line height | Weight | Usage |
|---|---:|---:|---:|---|
| `text-xs` | 12px | 16px | 400/500 | Captions, table metadata |
| `text-sm` | 14px | 20px | 400/500 | Form hints, table text, secondary labels |
| `text-base` | 16px | 24px | 400 | Body text, inputs |
| `text-lg` | 18px | 28px | 500/600 | Section titles |
| `text-xl` | 20px | 28px | 600 | Page subheadings |
| `text-2xl` | 24px | 32px | 600/700 | Page titles |
| `text-3xl` | 30px | 38px | 700 | Dashboard or major module headings |

### Typography rules

- Use one `h1` per page.
- Keep page titles clear and functional.
- Use medium weight for labels and table headers.
- Do not use tiny body text below 14px.
- Long descriptions should wrap naturally.
- Use tabular numbers for dates, counts, scores, and table numeric columns.

---

## 4. Spacing scale

Use a 4px-based spacing system.

| Token | Value | Usage |
|---|---:|---|
| `0` | 0px | No spacing |
| `1` | 4px | Tight internal gaps |
| `2` | 8px | Icon/text gap, compact spacing |
| `3` | 12px | Dense form/table spacing |
| `4` | 16px | Default component padding |
| `5` | 20px | Medium component padding |
| `6` | 24px | Card padding, section gap |
| `8` | 32px | Page sections |
| `10` | 40px | Major vertical rhythm |
| `12` | 48px | Large section separation |

### Spacing rules

- Desktop pages should use comfortable but not excessive spacing.
- Tables and forms may use denser spacing than marketing pages.
- Keep related controls close together.
- Separate unrelated sections with stronger spacing.
- Avoid arbitrary spacing values.

---

## 5. Border radius

Keep the UI professional and not playful.

| Token | Value | Usage |
|---|---:|---|
| `radius-sm` | 4px | Badges, small tags |
| `radius-md` | 6px | Inputs, buttons |
| `radius-lg` | 8px | Cards, table containers |
| `radius-xl` | 12px | Dialogs, larger panels |

### Radius rules

- Default button/input radius: `6px`.
- Default card radius: `8px`.
- Avoid very rounded pill shapes except for badges/chips.
- Keep radius consistent across Member A and Member B features.

---

## 6. Shadows

Use shadows sparingly. Prefer borders for structure.

| Token | Value | Usage |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(15, 23, 42, 0.06)` | Small cards, dropdowns |
| `shadow-md` | `0 4px 12px rgba(15, 23, 42, 0.08)` | Popovers, elevated cards |
| `shadow-lg` | `0 16px 32px rgba(15, 23, 42, 0.14)` | Dialogs, overlays |

### Shadow rules

- Default cards should usually use border + `shadow-sm` or no shadow.
- Dialogs and popovers may use stronger shadows.
- Do not use glow effects.
- Do not mix many custom shadow styles.

---

## 7. Page/container layout

### App shell

Desktop-first layout:

```text
┌─────────────────────────────────────────────┐
│ Header                                      │
├───────────────┬─────────────────────────────┤
│ Sidebar       │ Main content                │
│               │                             │
│               │ Page header                 │
│               │ Filters / actions           │
│               │ Table / cards / form        │
│               │                             │
└───────────────┴─────────────────────────────┘
```

### Main layout tokens

| Area | Rule |
|---|---|
| App background | `background` |
| Sidebar width | 256px desktop |
| Collapsed sidebar width | 72px if needed later |
| Header height | 64px |
| Main content max width | Usually full width, max readable areas where needed |
| Page padding desktop | 24px |
| Page padding tablet | 20px |
| Page padding mobile/tablet narrow | 16px |

### Page structure

Each page should follow:

```text
Page title row
Description / context text
Primary actions
Filters or tabs, if needed
Main content area
Pagination or footer actions
```

### Page header convention

- Left: title and short description
- Right: primary action and optional secondary actions
- Only one primary CTA per page

Example hierarchy:

```text
Academic Periods
Manage academic periods used for topics, registrations, progress and evaluation.

[Secondary action] [Primary action]
```

---

## 8. Sidebar

The sidebar is the primary desktop navigation.

### Visual style

- Background: `#0F172A` or `#1E293B`
- Text: muted slate for inactive items
- Active item: `primary-soft` text treatment or white text with subtle active background
- Use clear text labels with icons
- Avoid icon-only navigation by default

### Sidebar structure

```text
Product name / logo
Role context
Primary navigation groups
Secondary/help area
User/account area or logout separated at bottom
```

### Sidebar item rules

- Height: 40–44px
- Radius: 6px
- Icon size: 18–20px
- Gap between icon and label: 12px
- Active state must be obvious.
- Disabled/unavailable destinations should not silently disappear if the user needs to understand why they are unavailable.

---

## 9. Header

The header supports orientation, page-level context, and account actions.

### Header contents

Recommended desktop header:

```text
Breadcrumb / current module                 Notifications / User menu
```

Optional:

- Search field only if global search is actually implemented.
- Notification bell only if notification behavior exists.
- Do not add fake UI controls that are not supported.

### Header rules

- Height: 64px.
- Sticky header is allowed.
- Header border-bottom: `border-subtle`.
- User menu should contain profile/account actions and logout.
- Logout must be visually separated from normal actions.

---

## 10. Navigation

### Navigation principles

- Navigation placement must stay consistent across the app.
- Use URLs/deep links for key screens.
- Keep back behavior predictable.
- Preserve filters, scroll position, and table state when returning where practical.

### Navigation grouping by domain

Use the project domains as top-level or grouped navigation labels:

```text
Core
- Dashboard
- Academic Periods
- Topics
- Registrations

Thesis Work
- Progress
- Reports

Evaluation
- Councils
- Evaluation
- Final Results

Administration
- Users
```

Only show destinations appropriate to the current role and implemented features.

Do not create visual navigation for unavailable business pages unless the product intentionally needs disabled placeholders.

---

## 11. Buttons

### Button variants

| Variant | Usage |
|---|---|
| Primary | Main action on the page |
| Secondary | Alternative non-primary action |
| Outline | Neutral action, navigation-like action |
| Ghost | Low-emphasis toolbar action |
| Danger | Destructive action |
| Link | Inline navigation/action |

### Button sizes

| Size | Height | Padding | Text |
|---|---:|---:|---|
| Small | 32px | 12px horizontal | 14px |
| Medium | 40px | 16px horizontal | 14–16px |
| Large | 44px | 20px horizontal | 16px |

### Button rules

- One primary button per main page region.
- Destructive actions require visual separation.
- Async buttons must show loading state and prevent double submit.
- Disabled buttons must use real disabled semantics.
- Icon-only buttons must have accessible labels.
- Hover, focus, active, disabled, and loading states are required.

---

## 12. Inputs/forms

Forms are critical for this project and must be consistent.

### Input style

- Height: 40–44px
- Border: `border`
- Radius: `radius-md`
- Background: `surface`
- Text: `text-primary`
- Placeholder: `text-muted`
- Focus ring: visible `primary` ring

### Form field anatomy

```text
Label *
Input
Helper text or error text
```

### Form rules

- Labels must always be visible.
- Do not use placeholder-only labels.
- Required fields must be marked.
- Show validation errors near the related field.
- Validate on blur or submit, not aggressively on every keystroke.
- Use clear error messages with recovery guidance.
- Long forms should be split into logical sections.
- Failed form submission should focus the error summary or first invalid field.
- Read-only and disabled states must look different.

### Common form components

Use consistent styling for:

- Text input
- Textarea
- Select
- Date picker
- Checkbox
- Radio
- File upload
- Search/filter input
- Multi-select if required later

Do not introduce custom complex controls unless necessary.

---

## 13. Tables

Tables are a primary interface pattern.

### Table container

- Surface: `surface`
- Border: `border-subtle`
- Radius: `radius-lg`
- Overflow handling: horizontal scroll only inside the table container when unavoidable
- Header background: `surface-muted`

### Table anatomy

```text
Toolbar / filters
Table header
Rows
Empty/loading/error state
Pagination
```

### Table rules

- Header text: 12–14px, uppercase optional, medium weight.
- Row text: 14px.
- Row height: 48–56px.
- Use zebra striping only if readability needs it; otherwise use borders.
- Numeric/date columns should use tabular numbers.
- Actions should be right-aligned.
- Avoid cramming too many row actions; use an overflow menu when needed.
- Sortable columns must show sort direction and use accessible labels.
- Table filters should stay visually connected to the table.
- For narrow tablet widths, prioritize key columns and allow controlled horizontal scroll.

---

## 14. Cards

Cards are used for dashboards, summaries, forms, and grouped content.

### Card style

- Background: `surface`
- Border: `border-subtle`
- Radius: `radius-lg`
- Padding: 16–24px
- Shadow: none or `shadow-sm`

### Card rules

- Cards must have clear headings.
- Use cards to group related information, not to decorate.
- Do not nest cards deeply.
- Dashboard metric cards should include label, value, optional trend/status, and supporting text.
- Clickable cards must have visible hover/focus states.

---

## 15. Dialogs

Dialogs are for confirmation, focused forms, and critical decisions.

### Dialog sizes

| Size | Width |
|---|---:|
| Small | 400px |
| Medium | 560px |
| Large | 720px |

### Dialog anatomy

```text
Title
Description
Content/body
Footer actions
```

### Dialog rules

- Use a scrim overlay.
- Focus must move into the dialog when opened.
- Escape key should close non-critical dialogs.
- Destructive confirmations must clearly describe the consequence.
- Primary action goes on the right.
- Cancel/secondary action goes on the left of the primary action.
- Do not use dialogs for primary navigation flows.
- Unsaved changes require confirmation before dismissal.

---

## 16. Status badges

Badges should be compact, readable, and semantic.

### Badge style

- Height: 24px
- Radius: pill or `radius-sm`
- Font size: 12px
- Font weight: 500
- Include text; icon optional
- Do not rely on color alone

### Semantic badge mapping

Map actual project statuses to these visual categories. Do not treat these as database enum values.

| Visual category | Text color | Background | Usage |
|---|---|---|---|
| Neutral | `neutral` | `neutral-soft` | Draft, inactive, archived-like states |
| Info | `info` | `info-soft` | New, submitted, informational |
| Warning | `warning` | `warning-soft` | Pending, needs review, attention required |
| Success | `success` | `success-soft` | Approved, completed, passed |
| Danger | `danger` | `danger-soft` | Rejected, failed, invalid |
| Muted | `text-muted` | `surface-muted` | Disabled or unavailable |

### Badge rules

- Badge labels must be human-readable.
- Avoid long badge text.
- Use tooltips or expanded text if the status needs explanation.
- Keep badge colors consistent across all modules.

---

## 17. Pagination

Use pagination for long tables.

### Pagination anatomy

```text
Rows per page
Range summary
Previous / Next
Page numbers when useful
```

Example:

```text
Showing 1–10 of 48     Rows per page: 10     Previous  1  2  3  Next
```

### Pagination rules

- Place pagination below the table.
- Keep controls keyboard accessible.
- Disable unavailable previous/next buttons.
- Preserve current page, filters, and sorting where practical.
- On tablet, simplify page numbers if space is limited.

---

## 18. Loading states

Use loading states that preserve layout and prevent confusion.

### Loading patterns

| Situation | Pattern |
|---|---|
| Page loading | Skeleton blocks |
| Table loading | Skeleton rows |
| Button submitting | Spinner inside button + disabled state |
| Small inline fetch | Small spinner or subtle loading text |
| Long operation | Progress/clear message if supported |

### Loading rules

- Avoid full-page spinners when skeletons are possible.
- Prevent double submission.
- Do not show empty state while data is still loading.
- Loading indicators should appear quickly but avoid flicker for near-instant actions.
- Respect reduced-motion preferences.

---

## 19. Empty states

Empty states should be helpful and calm.

### Empty state anatomy

```text
Simple icon or illustration
Clear title
Short explanation
Optional primary action
Optional secondary guidance
```

### Empty state rules

- Explain what is empty.
- Explain what the user can do next.
- Do not blame the user.
- Do not use playful illustrations that conflict with the academic tone.
- Do not show actions the role is not allowed to perform.

Example tone:

```text
No topics found
There are no thesis topics matching the current filters.
```

---

## 20. Error states

Error states must be clear and recoverable.

### Error state anatomy

```text
Title
Specific message
Recovery action
Support/context if needed
```

### Error rules

- State what went wrong in plain language.
- Provide a recovery path such as retry, edit filters, or return.
- Do not expose stack traces or internal error details.
- Field errors belong near the field.
- Page-level errors belong near the affected content.
- Toast-only errors are not enough for form validation.

Example:

```text
Unable to load registrations
Please check your connection and try again.
[Retry]
```

---

## 21. Toast/notifications

Toasts are for short feedback after user actions.

### Toast variants

- Success
- Error
- Warning
- Info

### Toast rules

- Position: top-right on desktop.
- Auto-dismiss after 3–5 seconds unless action is required.
- Do not steal focus.
- Use `aria-live="polite"` for screen readers.
- Error toasts should include enough context.
- Important errors should also appear in the relevant page area.
- Avoid stacking too many toasts.

---

## 22. Responsive behavior

The product is desktop-first but must work well on tablets.

### Breakpoints

| Breakpoint | Width | Behavior |
|---|---:|---|
| Small | `< 640px` | Basic responsive fallback only |
| Tablet | `640px–1023px` | Collapsible sidebar/drawer, simplified tables |
| Desktop | `1024px–1439px` | Full sidebar, standard content layout |
| Large desktop | `1440px+` | Wider content, more comfortable spacing |

### Responsive rules

- Desktop is the primary design target.
- Tablet must remain usable for review, forms, and table scanning.
- Sidebar may collapse into a drawer below desktop.
- Main content padding reduces from 24px to 16–20px on smaller widths.
- Tables may use horizontal scroll within the table container.
- Do not allow full-page horizontal scrolling.
- Prioritize important columns on narrower screens.
- Keep touch targets at least 44px high on tablet/mobile.

---

## 23. Accessibility rules

Accessibility is mandatory for the design system.

### Core rules

- Text contrast must meet WCAG AA.
- Keyboard navigation must work for all interactive controls.
- Focus indicators must be visible.
- Focus order must match visual order.
- Forms must use visible labels.
- Errors must be associated with fields.
- Icon-only buttons require accessible names.
- Decorative icons should be hidden from assistive technology.
- Do not communicate meaning by color alone.
- Modals must trap focus while open and restore focus when closed.
- Route changes should move focus to the main content heading.
- Reduced motion must be respected.
- Do not disable browser zoom.
- Use semantic HTML wherever possible.

### Interaction accessibility

- Minimum interactive target size: 44px.
- Hover-only interactions are not allowed for critical actions.
- Clickable elements must show hover, active, and focus states.
- Disabled controls must be semantically disabled.
- Destructive actions need clear confirmation or undo where appropriate.

---

## 24. Role-based navigation conventions

Navigation must reflect the current user role without changing the visual system.

### General conventions

- Same layout for all roles.
- Same component styles for all roles.
- Role changes affect available destinations and actions, not the design language.
- Do not show actions a role cannot perform unless there is a clear disabled explanation.
- Keep dangerous actions, such as logout or destructive operations, visually separated.

### Student navigation convention

Typical student-facing areas may include:

```text
Dashboard
Topics
Registrations
Progress
Reports
Final Results
```

Student UI should emphasize:

- Current thesis status
- Required next action
- Submission/review state
- Deadlines or academic period context when available

### Lecturer navigation convention

Typical lecturer-facing areas may include:

```text
Dashboard
Topics
Registrations
Progress
Reports
Councils
Evaluation
Final Results
```

Lecturer UI should emphasize:

- Review queues
- Assigned topics/students
- Approval workflows
- Evaluation tasks

### Admin navigation convention

Typical admin-facing areas may include:

```text
Dashboard
Users
Academic Periods
Topics
Registrations
Progress
Reports
Councils
Evaluation
Final Results
```

Admin UI should emphasize:

- System management
- Academic period setup
- User and role management
- Oversight across modules

### Navigation consistency rule

Member A and Member B features must use the same:

- Sidebar structure
- Header structure
- Page header pattern
- Button variants
- Table layout
- Form layout
- Status badge mapping
- Empty/error/loading state patterns

---

## Recommended default component style summary

| Component | Default style |
|---|---|
| Page background | `#F8FAFC` |
| Surface | White card with subtle border |
| Primary action | Navy button |
| Secondary action | White/outline button |
| Form fields | 40–44px height, visible label, clear focus ring |
| Tables | White container, muted header, 48–56px rows |
| Cards | 8px radius, 16–24px padding, border-first |
| Dialogs | White surface, strong focus management, clear footer actions |
| Badges | Small semantic label with soft background |
| Motion | Subtle 150–250ms transitions only |

---

## Implementation guidance for future frontend work

When implementing Angular components later:

- Use reusable design tokens through Tailwind configuration or CSS variables.
- Do not hardcode raw hex values repeatedly inside components.
- Create shared UI components only when they are immediately needed by current tasks.
- Keep component APIs simple.
- Prefer native semantic elements before custom widgets.
- Match this system before adding page-specific variation.
- Do not introduce visual patterns that only work for one module.

This MASTER design system should remain simple, consistent, and maintainable for a 2-person graduation project.
