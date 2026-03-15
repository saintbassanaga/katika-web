# Katika — Mobile App Design Specification

> Cross-platform reference for Android & iOS (Flutter / React Native / Kotlin Multiplatform)
> Derived from the existing Angular mobile-first web frontend.

---

## Table of Contents

1. [Brand Identity](#1-brand-identity)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Sizing](#4-spacing--sizing)
5. [Elevation & Shadows](#5-elevation--shadows)
6. [Border Radius](#6-border-radius)
7. [Component Library](#7-component-library)
8. [Navigation Architecture](#8-navigation-architecture)
9. [Screen Inventory](#9-screen-inventory)
10. [Interaction & Motion](#10-interaction--motion)
11. [Form Patterns](#11-form-patterns)
12. [Iconography](#12-iconography)
13. [Localization](#13-localization)
14. [API & Auth](#14-api--auth)

---

## 1. Brand Identity

| Property | Value |
|----------|-------|
| **App name** | Katika |
| **Tagline** | Paiements sécurisés au Cameroun |
| **Primary audience** | Buyers & sellers in Cameroon using Mobile Money |
| **Tone** | Trustworthy, clean, professional fintech |
| **Currency** | XAF (West African CFA franc) |
| **Supported languages** | French (default), English |

---

## 2. Color System

### 2.1 Core Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#1B4F8A` | Buttons, links, active states, brand color |
| `primary-dark` | `#0D3D6E` | Gradient end, pressed states |
| `primary-light` | `#E5EEF8` | Selected card backgrounds, tinted surfaces |
| `dark` | `#0F2240` | Hero headers, dark surfaces |
| `gold` | `#C9920D` | Accent, escrow amount highlights |
| `gold-dark` | `#A37510` | Gradient end for gold elements |
| `gold-light` | `#FDF4DC` | Gold tinted surfaces |
| `page` | `#EDF1F7` | App background (screens) |
| `surface` | `#FFFFFF` | Card backgrounds, input surfaces |
| `border` | `#E2E8F0` | Dividers, input borders |
| `text` | `#0F172A` | Primary body text |
| `muted` | `#64748B` | Secondary text, labels, placeholders |
| `success` | `#10B981` | Success states, positive amounts |
| `success-light` | `#ECFDF5` | Success surface background |
| `error` | `#DC2626` | Errors, danger actions, dispute amounts |
| `error-light` | `#FEF2F2` | Error surface background |

### 2.2 Status Colors

Used in badges on transactions and disputes:

| Status | Background | Text | Dot/Accent |
|--------|-----------|------|-----------|
| `INITIATED` | `#EDF1F7` | `#475569` | `#94A3B8` |
| `LOCKED` | `#E5EEF8` | `#154B85` | `#3A7BC8` |
| `SHIPPED` | `#FFFBEB` | `#B45309` | `#F59E0B` |
| `DELIVERED` | `#ECFDF5` | `#065F46` | `#10B981` |
| `RELEASED` | `#F0FDFA` | `#0F766E` | `#14B8A6` |
| `DISPUTED` | `#FEF2F2` | `#991B1B` | `#EF4444` |
| `REFUNDED` | `#FDF4FF` | `#6B21A8` | `#A855F7` |
| `CANCELLED` | `#F8FAFC` | `#64748B` | `#CBD5E1` |
| `UNDER_REVIEW` | `#EEF2FF` | `#3730A3` | `#6366F1` |
| `AWAITING_ARBITRATION_PAYMENT` | `#FFF7ED` | `#C2410C` | `#FB923C` |
| `REFERRED_TO_ARBITRATION` | `#FDF4FF` | `#6B21A8` | `#A855F7` |
| `RESOLVED_BUYER` | `#ECFDF5` | `#065F46` | `#10B981` |
| `RESOLVED_SELLER` | `#EEF2FF` | `#3730A3` | `#6366F1` |
| `RESOLVED_SPLIT` | `#F0FDFA` | `#0F766E` | `#14B8A6` |
| `CLOSED_NO_ACTION` | `#F8FAFC` | `#64748B` | `#CBD5E1` |

### 2.3 Gradients

| Name | Value | Used on |
|------|-------|---------|
| Primary gradient | `135deg, #1B4F8A → #0D3D6E` | FAB button, hero headers |
| Gold gradient | `135deg, #C9920D → #A37510` | User avatar background |
| Hero header | `145deg, #0F2240 0% → #1B4F8A 100%` | Wallet hero, onboarding |
| Radial gold orb | `radial, rgba(201,146,13,.22) → transparent` | Decorative background blur |
| Radial blue orb | `radial, rgba(27,79,138,.25) → transparent` | Decorative background blur |

---

## 3. Typography

### 3.1 Font Family

**Primary**: `Outfit` (variable font, weights 100–900)
**Fallback**: `-apple-system` → `BlinkMacSystemFont` → `Segoe UI` → `sans-serif`

On mobile, use:
- **iOS**: SF Pro Display / SF Pro Text (system font)
- **Android**: Google Sans / Roboto (system font)
- Both with `Outfit` loaded as a custom font via Google Fonts or bundled assets.

### 3.2 Type Scale

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Display | 3rem (clamp 2–3rem) | 800 | 1 | Wallet balance, hero amounts |
| H1 | 1.375rem | 700 | 1.2 | Page titles |
| H2 | 1rem | 700 | 1.3 | Section headings |
| H3 | 0.9375rem | 700 | 1.3 | Card titles |
| Body Large | 1rem | 400 | 1.6 | Main content |
| Body | 0.875rem | 400–500 | 1.6 | Standard text, list items |
| Body Small | 0.8125rem | 400–600 | 1.5 | Secondary info, meta |
| Caption | 0.75rem | 500 | 1.4 | Labels, timestamps |
| Micro | 0.6875rem | 500–700 | 1.3 | Badge text, tiny labels |
| Nano | 0.625rem | 700 | 1.2 | Status dots, ultra-small caps |

### 3.3 Letter Spacing

| Context | Value |
|---------|-------|
| Uppercase labels | `0.08–0.14em` |
| Tracking tight (amounts) | `-0.03 to -0.04em` |
| Normal body | `normal` |
| Monospace refs | font-mono, normal |

---

## 4. Spacing & Sizing

### 4.1 Base Grid

- Base unit: **4px**
- All spacing is multiples of 4px

| Token | px | rem |
|-------|-----|-----|
| `space-1` | 4px | 0.25rem |
| `space-2` | 8px | 0.5rem |
| `space-3` | 12px | 0.75rem |
| `space-4` | 16px | 1rem |
| `space-5` | 20px | 1.25rem |
| `space-6` | 24px | 1.5rem |
| `space-7` | 28px | 1.75rem |
| `space-8` | 32px | 2rem |
| `space-10` | 40px | 2.5rem |
| `space-12` | 48px | 3rem |

### 4.2 Screen Layout

```
┌─────────────────────────────┐  ← Safe area top
│  Status bar area (44px iOS) │
├─────────────────────────────┤
│  Top bar (optional, 56px)   │
├─────────────────────────────┤
│                             │
│   Scrollable content area   │
│   px: 16px  py: 20px        │
│   pb: 96px (bottom nav gap) │
│                             │
├─────────────────────────────┤
│  Bottom nav (60px)          │
│  + safe-area-inset-bottom   │
└─────────────────────────────┘  ← Safe area bottom
```

### 4.3 Touch Targets

Minimum touch target: **44×44px** (Apple HIG / Material Design M3)

| Element | Min height |
|---------|-----------|
| Button (primary) | 48px |
| Button (secondary) | 44px |
| Nav item | 60px total (icon + label) |
| List row | 60–72px |
| Input field | 48–52px |
| Icon button | 40px (with 8px invisible padding) |

---

## 5. Elevation & Shadows

| Level | Value | Used on |
|-------|-------|---------|
| 0 | none | Flat surfaces, page background |
| 1 | `0 1px 3px rgba(15,23,42,.05), 0 4px 10px rgba(15,23,42,.04)` | Cards (default) |
| 2 | `0 4px 20px rgba(15,23,42,.09)` | Cards on hover / focused |
| 3 | `0 8px 32px rgba(15,23,42,.18)` | Popover, dropdown |
| 4 | `0 -8px 40px rgba(0,0,0,.18)` | Bottom sheet (upward shadow) |
| 5 | `0 6px 24px rgba(27,79,138,.45), 0 2px 8px rgba(0,0,0,.15)` | FAB button |
| 6 | `0 10px 30px rgba(27,79,138,.5)` | FAB button pressed/hover |

On mobile, map to platform elevation:
- **iOS**: `UIView.layer.shadowRadius / shadowOpacity`
- **Android**: Material `elevation` dp values (2dp → 4dp → 8dp → 16dp → 24dp)

---

## 6. Border Radius

| Token | Value | Used on |
|-------|-------|---------|
| `radius-sm` | 8px | Small buttons, icon wrappers |
| `radius-md` | 10–12px | Input fields, chips |
| `radius-lg` | 14px | Transaction rows, movement rows |
| `radius-xl` | 16px | Cards, info panels |
| `radius-2xl` | 20px | Bottom sheet card containers |
| `radius-3xl` | 24px | Bottom sheet top corners |
| `radius-full` | 9999px | Pills, badges, avatars, tabs |

---

## 7. Component Library

### 7.1 Bottom Navigation Bar

- **Height**: 60px + `safe-area-inset-bottom`
- **Background**: white with `backdrop-filter: blur(16px)`
- **Border**: 1px solid border-color at top
- **Items**: 5 tabs (Home, Escrow, Disputes, Payouts, Profile)
- **Active state**: icon scales up (1.12×) + translates up (−2px) with spring bounce, label fades in
- **Inactive**: icon default size, label hidden or muted
- **Tab badge**: small red dot (8px) for unread count (disputes, etc.)

```
[Home]  [Escrow]  [+FAB]  [Disputes]  [Profile]
  ●
```

### 7.2 Status Badge

Pill-shaped badge with colored background, dot indicator, and text.

```
● LOCKED        (blue)
● SHIPPED       (amber)
● DISPUTED      (red)
● RELEASED      (teal)
```

- Padding: `4px 10px`
- Border-radius: `9999px`
- Font: 0.6875rem, weight 600
- Dot: 6px circle, 4px right margin

### 7.3 Card

Standard white card container:

- Background: `#FFFFFF`
- Border: `1px solid #E2E8F0`
- Border-radius: `16px`
- Shadow: level 1
- Padding: `16px`
- On press: shadow level 2 + slight scale down (`0.98`)

### 7.4 Avatar

Circular user avatar:

| Size | Diameter | Font size |
|------|----------|-----------|
| sm | 28px | 10px |
| md | 36px | 14px |
| lg | 44px | 16px |
| xl | 64px | 24px |

- If image: rounded circle crop
- If initials: `gold gradient` background, white bold text
- Up to 2 initials (first + last name)

### 7.5 Button

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| Primary | `#1B4F8A` | white | none |
| Secondary | transparent | `#1B4F8A` | `#1B4F8A` 1.5px |
| Ghost | `#F1F5F9` | `#475569` | none |
| Danger | `#DC2626` | white | none |
| Gold | `#C9920D` | white | none |

- Height: 48px (default), 40px (sm), 52px (lg)
- Border-radius: `12px`
- Font: 0.875rem, weight 700
- Loading state: spinner (16×16, white, 2px border) replaces icon
- Disabled: opacity 40%
- Pressed: opacity 88% + scale 0.97

### 7.6 Input Field

```
┌──────────────────────────────────┐
│  Label (12px, 600, muted)        │
│                                  │
│ ┌──────────────────────────────┐ │
│ │  Value or placeholder...     │ │
│ └──────────────────────────────┘ │
│  Error message (11px, error red) │
└──────────────────────────────────┘
```

- Height: 48–52px
- Background: `#F8FAFC`
- Border: 2px solid `#E2E8F0`
- Border-radius: `12px`
- Focus border: `#1B4F8A` + glow `rgba(27,79,138,.12)` 3px
- Error border: `#DC2626`
- Padding: `12px 14px`
- Font: 0.875rem, regular

### 7.7 OTP Input

6-cell numeric input for verification codes.

- Cell size: `48×56px`
- Border: 2px solid `#E2E8F0`, active: `#1B4F8A`
- Border-radius: `12px`
- Font: 1.25rem, bold, centered
- Auto-advance on digit entry
- Paste fills all cells
- Backspace navigates to previous cell

### 7.8 Phone Input

Country code selector + phone number field:

```
┌──────────────────────────────────────┐
│ 🇨🇲 +237 │  6XX XXX XXX              │
└──────────────────────────────────────┘
```

- Country dropdown with flag + dial code
- Supported countries: CM, NG, GH, SN, CI, CD, CG, GA, TD, CF, GQ, FR, BE, GB, US
- Format as-you-type (libphonenumber)
- Default: Cameroon (+237)

### 7.9 Bottom Sheet

Slides up from the bottom of the screen:

- Backdrop: `rgba(0,0,0,0.4)` with fade-in
- Sheet: white, `border-top-left-radius: 24px`, `border-top-right-radius: 24px`
- Handle: white pill `40×4px` at top center, `border-radius: 2px`
- Max height: 90% of screen height
- Scroll: internal scroll if content overflows
- Close: tap backdrop, drag down, or × button
- Animation: `translateY(100%)` → `translateY(0)` in 300ms ease-out

### 7.10 Toast Notification

Non-blocking notification banner:

| Type | Left border color | Icon |
|------|-----------------|------|
| Success | `#10B981` | ✓ checkmark |
| Error | `#DC2626` | ✗ cross |
| Warning | `#F59E0B` | ⚠ triangle |
| Info | `#3B82F6` | ℹ circle |

- Position: top of screen (below status bar / safe area)
- Width: full width – 32px margins
- Border-radius: `12px`
- Background: white, shadow level 3
- Auto-dismiss: 4 seconds
- Slide-down entrance, slide-up exit

### 7.11 Loading Skeleton

Shimmer placeholder for loading states:

- Background: gradient sweep `#E2E8F0 → #EDF1F7 → #E2E8F0`
- Animation: horizontal sweep, 1.6s infinite
- Border-radius: matches the element being loaded
- Common shapes: rows (60px), cards (120px), circles (44px)
- Reduced motion: static gray `#E2E8F0`

### 7.12 Empty State

Full-screen centered empty state:

```
        📊

   Aucun mouvement
   Vos mouvements
   apparaîtront ici.

  [ Action button ]
```

- Icon: 2.5–3rem emoji or illustration, opacity 35%
- Title: 0.9375rem, semibold, muted
- Message: 0.8125rem, light muted
- CTA: optional primary button below

### 7.13 FAB (Floating Action Button)

Circular action button, fixed bottom-right:

- Size: 56px diameter
- Background: primary gradient
- Icon: white, 24×24
- Shadow: level 5
- Position: `right: 20px`, `bottom: 80px` (above bottom nav)
- On tap: opens a bottom sheet with "New transaction" form
- Long press (optional): shows quick actions (New transaction, New dispute)

---

## 8. Navigation Architecture

### 8.1 App Structure

```
App
├── Auth (unauthenticated)
│   ├── Login
│   ├── Register
│   ├── Forgot Password
│   └── Reset Password
│
└── Main (authenticated, with bottom nav)
    ├── Dashboard (Home tab)
    ├── Escrow (Transactions tab)
    │   ├── Escrow List
    │   └── Escrow Detail
    │       └── QR Scan
    ├── Disputes tab
    │   ├── Disputes List
    │   ├── Dispute Create
    │   └── Dispute Chat
    ├── Payouts tab
    │   ├── Payout New
    │   └── Payout OTP
    ├── Wallet (accessible from profile or bottom nav)
    └── Profile tab
        ├── Profile View
        ├── Profile Edit
        └── Security Settings
```

### 8.2 Bottom Navigation Tabs

| Index | Label | Icon | Route |
|-------|-------|------|-------|
| 0 | Home | House | /dashboard |
| 1 | Transactions | Arrows | /escrow |
| 2 | Disputes | Warning | /disputes |
| 3 | Retraits | Arrow-down-circle | /payouts |
| 4 | Profil | Person | /profile |

### 8.3 Top Bar (contextual)

Screens with a back navigation (non-root tabs) show a top bar:

- Height: 56px
- Background: white (or transparent on hero screens)
- Back arrow: left-aligned, 44×44 tap target
- Title: centered, 0.9375rem, bold
- Right action: optional icon button (e.g., refresh, share)

---

## 9. Screen Inventory

### 9.1 Auth Screens

#### Login
- Logo + tagline hero (dark navy)
- Phone input (country code selector)
- Password input (with eye toggle)
- "Forgot password" link
- Sign In button (full width)
- "No account? Register" link

#### Register
- Phone, First name, Last name
- Email (optional)
- Role selector (Buyer / Seller — pill toggle)
- Password + confirm with strength meter (4 levels)
- Terms acceptance checkbox
- Create account button

#### OTP / 2FA
- 6-cell OTP input
- Countdown to resend (60s)
- "Use backup code" secondary option

#### Forgot / Reset Password
- Email input → confirmation screen → new password form
- Progress indicator (step 1 of 3)

---

### 9.2 Dashboard

**Top section** (dark navy hero background):
- Greeting: "Bonjour, {{firstName}}"
- Date subtitle

**KPI Cards** (2×2 grid on mobile, 4×1 on tablet):
1. Available balance (XAF) — with frozen sub-amount
2. Active transactions count
3. Active disputes count
4. Amount to receive (XAF)

**Dispute alert banner** (if active disputes > 0):
- Amber-colored card with count and "View disputes" CTA

**Recent Transactions** list:
- Up to 5 rows
- Each row: avatar initial + counterpart name + status badge + amount
- "View all" link

---

### 9.3 Escrow (Transactions)

#### List screen
- Filter tabs (All / Pending / Shipped / Disputed) — horizontally scrollable pills
- Transaction rows:
  - Left: avatar initial (buyer/seller initial)
  - Center: counterpart name + reference
  - Right: amount (bold) + status badge
- Load more button (pagination)
- Empty state

#### Detail screen
- Transaction reference + status badge
- **Progress stepper**: INITIATED → LOCKED → SHIPPED → DELIVERED → RELEASED (5 steps, horizontal)
- Context card: "Buying from X" or "Selling to Y"
- Amount breakdown: gross amount, platform fee (3%), net amount
- Parties section: buyer avatar + name, seller avatar + name
- Description section
- **Action buttons** (role + status dependent):
  - Seller: "Mark as shipped", "Generate QR code"
  - Buyer: "Confirm receipt / Scan QR", "Release payment", "Open dispute"
- "View dispute" link if disputed

#### QR Display screen
- Full-screen QR code (white card on dark bg)
- Expiry countdown
- Refresh button
- Instruction text

#### QR Scan screen
- Full-screen camera view
- Targeting frame overlay
- "Scanning…" / "Processing…" state
- Permission denied state with settings deep link

---

### 9.4 Disputes

#### List screen
- Filter tabs (All / Open / In progress / Arbitration / Resolved)
- Dispute rows:
  - Left: colored status icon
  - Center: reference + reason label
  - Right: claimed amount + status badge + date
- Empty state

#### Create screen (3-step stepper)

**Step 1 — Reason**
- Grouped reason selector:
  - Category header (bold, muted)
  - Reason radio items (icon + label, highlighted when selected)
- Groups: Delivery, Quality, Service, Communication, Financial, Fraud, Other

**Step 2 — Description + Evidence**
- Multiline text area (min 20 chars)
- File upload zone (dashed border):
  - Max 5 files, 10 MB each
  - Accepted: images, videos, PDF, TXT
  - File rows with icon + name + size + remove button
- Back / Continue buttons

**Step 3 — Summary**
- Transaction reference + amount
- Selected reason label
- Description preview
- Attached files list
- Submit button (red — signifies serious action)

#### Dispute Chat screen
- **Top bar**: back + dispute reference + status badge
- **Chat area** (scrollable):
  - Own messages: right-aligned, primary blue bubble
  - Other party: left-aligned, white bubble with sender name
  - System / Support messages: centered, amber or indigo card
  - File attachment messages: card with icon + filename + size + download tap
- **Typing indicator**: "X est en train d'écrire…" animated
- **Arbitration banner** (when status = `AWAITING_ARBITRATION_PAYMENT`):
  - Countdown timer
  - Both parties paid indicators
  - "Pay fee" button
- **Resolution banner** (when resolved): result + amounts
- **Input bar** (bottom, above keyboard):
  - Attach button → evidence popover
  - Text field (multi-line, max 5 rows)
  - Send button
- **Evidence popover** (above attach button):
  - Title + close ×
  - Type selector chips: IMAGE / VIDEO / DOCUMENT / SCREENSHOT
  - Description field (optional)
  - "Choose file" dashed button → file picker
  - File preview (icon + name + size + "Change")
  - "Send" button (disabled until file selected)
- **Right panel** (tablet/desktop): dispute details + timeline

---

### 9.5 Payouts (Withdrawals)

#### New payout
- Available balance display
- Quick amount chips (e.g., 5 000, 10 000, 25 000, "All")
- Amount input with XAF suffix
- Destination phone (phone input component)
- Fee preview: gross → fee (%) → net amount you receive
- Continue button

#### OTP verification
- "Code sent to {{phone}}"
- 6-cell OTP input
- Confirm button
- Resend countdown (60s)

---

### 9.6 Wallet

**Hero section** (dark navy gradient with glowing orbs):
- "Solde disponible" label
- Large balance amount (with eye toggle to hide)
- Frozen amount badge (gold, if > 0)
- Withdraw button + Refresh button

**Movements list**:
- Filter chips (All / Escrow / Disputes / Payouts) — horizontally scrollable
- Movement rows:
  - Left icon bubble: emoji icon (credit green / debit red)
  - Center: description + reference + timestamp
  - Right: amount (+/− colored)
- Load more (pagination)
- Empty state

**Movement detail** (bottom sheet on tap):
- Amount (large, colored)
- Description
- Reference (monospace)
- Balance before / after
- Frozen before / after (if changed)

---

### 9.7 Profile

- User avatar (initial circle, large)
- Full name + phone (read-only)
- Role badge (Buyer / Seller)

**Menu items**:
- Edit profile →
- Wallet →
- My transactions →
- Security →
- Language toggle (FR / EN)
- Sign out (danger text)

#### Edit profile screen
- Full name input
- Email input
- CNI number input (National ID)
- Address fields
- Save button

#### Security screen
- Verification status (verified / not verified, with verify CTA)
- Password section (masked, Edit button → form)
- 2FA section (enabled/disabled toggle → TOTP code confirm)

---

### 9.8 Onboarding (first launch)

3-slide full-screen carousel shown once after registration:

| Slide | Content |
|-------|---------|
| 1 | Welcome illustration + headline "Bienvenue sur Katika" + tagline |
| 2 | How it works: 3 steps (Lock funds → Deliver → Release) |
| 3 | CGU + Privacy Policy (scrollable) + checkbox to accept → "Start" button |

- Skip button top-right
- Dot indicators bottom
- Previous / Next navigation
- Final slide: "Start" enabled only when CGU checked

---

## 10. Interaction & Motion

### 10.1 Animation Principles

- **Spring-based**: bounce feel on navigation icons (`cubic-bezier(0.34, 1.56, 0.64, 1)`)
- **Smooth easing**: content transitions use `cubic-bezier(0.22, 1, 0.36, 1)`
- **Respect reduced motion**: all animations disabled when `prefers-reduced-motion: reduce`
- **Duration guide**:
  - Micro (state changes): 150–200ms
  - Standard (screen transitions): 250–320ms
  - Complex (bottom sheets, modals): 300–450ms

### 10.2 Screen Transitions

| Transition | Duration | Easing |
|-----------|---------|--------|
| Push (forward) | 320ms | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Pop (back) | 280ms | `ease-out` |
| Modal / bottom sheet in | 300ms | `ease-out` slide from bottom |
| Modal / bottom sheet out | 250ms | `ease-in` slide to bottom |
| Fade (tab switch) | 180ms out + 320ms in | `ease-out` |

### 10.3 Stagger Animations

List items animate in sequentially with a 50ms delay per item (max 350ms):

```
Item 1: delay 0ms
Item 2: delay 50ms
Item 3: delay 100ms
Item 4: delay 150ms
...
Item 8+: delay 350ms (capped)
```

### 10.4 Loading States

- **Initial page load**: skeleton shimmer for entire content area
- **Pull to refresh**: native platform spinner
- **Pagination (load more)**: spinner at bottom of list
- **Button action**: inline spinner replaces icon, text changes to "…"
- **Global loading**: none (prefer per-component skeletons)

### 10.5 Micro-interactions

| Interaction | Effect |
|------------|--------|
| Button press | Scale 0.97 + opacity 88%, spring back |
| Card tap | Scale 0.98, shadow increase |
| Nav icon active | Scale 1.12 + translateY(−2px), spring bounce |
| Input focus | Border color + glow, label color change |
| Toggle switch | Slide with 200ms ease |
| Checkbox | Checkmark draw animation |
| Bottom sheet drag | Follow finger, snap back if < 30% down |

---

## 11. Form Patterns

### 11.1 Validation Rules

| Field | Rules |
|-------|-------|
| Phone | Valid format by country, required |
| Password | Min 8 chars, 1 uppercase, 1 number, 1 special char |
| Amount | Min 100 XAF, Max 10,000,000 XAF |
| Description (dispute) | Min 20 chars, Max 1000 chars |
| OTP | 6 digits, numeric only |
| CNI | Required for certain operations |

### 11.2 Error Display

- Errors shown **below the field** on blur (not on keystroke)
- Error text: 11px, `#DC2626`, icon optional
- Field border turns `#DC2626`
- On submit: scroll to first error + shake animation

### 11.3 Password Strength Meter

4-level bar below password field:

| Level | Color | Label |
|-------|-------|-------|
| Very weak | `#DC2626` | Très faible |
| Weak | `#F59E0B` | Faible |
| Good | `#10B981` | Bon |
| Excellent | `#10B981` (brighter) | Excellent |

---

## 12. Iconography

### 12.1 Style

- **Style**: Outline stroke (Heroicons-inspired)
- **Stroke width**: 2px (standard), 2.5px (emphasis), 1.75px (fine)
- **Line caps/joins**: round
- **Color**: `currentColor` (inherits from text color)
- **Canvas**: 24×24 viewBox

### 12.2 Icon Set

| Icon | Usage |
|------|-------|
| House | Home / Dashboard |
| Arrows (bidirectional) | Transactions / Escrow |
| Warning triangle | Disputes |
| Arrow-circle-down | Payouts / Withdrawals |
| Credit card / Wallet | Wallet |
| Person silhouette | Profile |
| Settings cog | Admin |
| Checkmark | Success, completed step |
| X / Cross | Close, error, remove |
| Eye / Eye-slash | Show/hide password or balance |
| Paperclip | Attach file |
| Upload arrow | Upload/send file |
| Download arrow | Download file |
| QR code | QR display |
| Camera | QR scan |
| Lock / Unlock | Escrow freeze states |
| Send arrow | Send message |
| Info circle | Info banner |
| Shield | Security |
| Bell | Notifications |
| Chevron right | List row indicator |
| Chevron left | Back navigation |
| Plus | Add, create new |
| Refresh | Reload data |

### 12.3 Emoji Icons (contextual)

Used for movement types and evidence types (rendering Unicode):

| Context | Emoji |
|---------|-------|
| Escrow freeze | 🔒 |
| Escrow unfreeze | 🔓 |
| Escrow credit | ✦ |
| Dispute | ⚖ |
| Payout / withdrawal | ↗ |
| Refund / reversal | ↩ |
| Deposit | ↙ |
| Image evidence | 🖼️ |
| Video evidence | 🎬 |
| Document evidence | 📄 |
| Screenshot evidence | 📸 |
| No results | 📊 |

---

## 13. Localization

### 13.1 Supported Languages

| Code | Language | Default |
|------|----------|---------|
| `fr` | French | ✅ |
| `en` | English | |

### 13.2 Currency Formatting

Format: `Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 })`

Result: `45 000 FCFA` (no decimals, space thousands separator)

Null/empty amounts: display as `— XAF`

### 13.3 Date / Time

- Relative dates: "il y a 3 minutes", "2h ago" (via a time-ago pipe)
- Countdowns: `00j 00h 00m 00s` format for arbitration deadlines
- Absolute dates: locale-formatted (fr-CM)

### 13.4 Language Switch

- Stored in `localStorage` key: `katika_lang`
- Toggle available in: Profile screen, top bar (FR / EN pill)
- Applied at app startup

---

## 14. API & Auth

### 14.1 Authentication

- **Method**: Cookie-based JWT (BFF pattern)
- **Cookie name**: `ACCESS_TOKEN` (HttpOnly, Secure)
- **Base URL**: `https://api.katika.cm`
- **All requests**: include credentials (cookie)
- **401 response**: redirect to login
- **MFA**: TOTP (6-digit code) on sensitive operations

On mobile, use a **secure in-memory token store** since HttpOnly cookies are not available in native HTTP clients. Implement token refresh using a secure refresh token stored in the device Keychain (iOS) / EncryptedSharedPreferences (Android).

### 14.2 Real-time (WebSocket)

- **Protocol**: STOMP over SockJS
- **URL**: `wss://api.katika.cm/ws`
- **Subscriptions** used in dispute chat:
  - `/topic/dispute.{id}` — new messages
  - `/topic/dispute.{id}.status` — status updates
  - `/topic/dispute.{id}.typing` — typing indicators
- **Publish destinations**:
  - `/app/dispute/{id}/message` — send message
  - `/app/dispute/{id}/typing` — typing event

### 14.3 Key API Endpoints

| Feature | Method | Path |
|---------|--------|------|
| Login | POST | `/api/auth/login` |
| Register | POST | `/api/auth/register` |
| Get profile | GET | `/api/users/me` |
| Transactions list | GET | `/api/escrow/transactions` |
| Transaction detail | GET | `/api/escrow/transactions/{id}` |
| Disputes list | GET | `/api/disputes` |
| Dispute detail | GET | `/api/disputes/{id}` |
| Create dispute | POST | `/api/disputes` |
| Upload evidence | POST | `/api/disputes/{id}/evidence` (multipart) |
| Get messages | GET | `/api/disputes/{id}/messages` |
| Send message | POST | `/api/disputes/{id}/messages` |
| Wallet balance | GET | `/api/wallet` |
| Wallet movements | GET | `/api/wallet/movements` |
| Create payout | POST | `/api/payouts` |
| Validate OTP | POST | `/api/payouts/{id}/otp` |
| Submit payout | POST | `/api/payouts/{id}/submit` |

### 14.4 Pagination

All list endpoints return:

```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "totalElements": 150,
  "totalPages": 8,
  "first": true,
  "last": false
}
```

### 14.5 Evidence Upload (multipart)

```
POST /api/disputes/{id}/evidence
Content-Type: multipart/form-data

- file:    <binary>
- request: <JSON blob, application/json>
           { "evidenceType": "IMAGE|VIDEO|DOCUMENT|SCREENSHOT", "description": "..." }
```

---

## Appendix — Quick Reference

### Color Quick Reference
```
Primary:      #1B4F8A
Primary dark: #0D3D6E
Primary lt:   #E5EEF8
Dark navy:    #0F2240
Gold:         #C9920D
Page bg:      #EDF1F7
Surface:      #FFFFFF
Border:       #E2E8F0
Text:         #0F172A
Muted text:   #64748B
Success:      #10B981
Error:        #DC2626
```

### Spacing Quick Reference
```
xs:  4px   sm: 8px   md: 12px  lg: 16px
xl: 20px  2xl: 24px  3xl: 32px  4xl: 48px
```

### Touch Target Minimums
```
Buttons:     48px height
Nav items:   60px height
List rows:   60px height
Icon-only:   44×44px
```

### Safe Areas
```
iOS top:    env(safe-area-inset-top)     ≈ 44px (notch) or 20px
iOS bottom: env(safe-area-inset-bottom) ≈ 34px (home indicator)
Android:    use WindowInsets API
```
