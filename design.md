# Sahaayi Design System

## 1. Product Direction

Sahaayi is a multilingual, voice-first support platform for migrant workers in Kerala. The interface should feel:

- Friendly and reassuring
- Simple enough for first-time smartphone users
- Modern, human, and non-governmental
- Clear during urgent situations
- Highly usable on low-end Android devices
- Consistent across mobile, tablet, and desktop web

The visual language is inspired by the reference design: soft pastel surfaces, dark contrast panels, rounded cards, pill-shaped controls, playful line illustrations, and spacious layouts.

---

## 2. Core Design Principles

### Voice First
The primary action on every worker-facing screen should be a large voice button.

### One Task at a Time
Avoid dense dashboards for workers. Each screen should focus on one question, one decision, or one action.

### Low Literacy Friendly
Use icons, short sentences, audio playback, and clear visual hierarchy.

### Human and Reassuring
Avoid institutional or legal-looking interfaces. The product should feel like a helpful person, not a government form.

### Trust Through Transparency
Clearly show:

- What information was understood
- What action will happen next
- Whether an estimate requires verification
- Who can access the case
- What is still missing

---

## 3. Visual Style

### Overall Look

- Clean white and soft pastel backgrounds
- Large dark charcoal sections for focus states
- Rounded cards with minimal shadows
- Soft mint, sky blue, blush pink, and lavender accents
- Black line illustrations with simple facial expressions
- Generous spacing and large touch targets
- Smooth transitions with no excessive animation

### Mood

- Calm
- Hopeful
- Safe
- Personal
- Approachable

---

## 4. Color Palette

### Base Colors

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#F7F7F5` | Main application background |
| `--color-surface` | `#FFFFFF` | Cards, forms, panels |
| `--color-dark` | `#1B1B1B` | Dark sections, primary text, footer |
| `--color-muted-dark` | `#343434` | Secondary dark buttons and pills |
| `--color-border` | `#E8E8E4` | Borders and dividers |
| `--color-text` | `#191919` | Primary text |
| `--color-text-muted` | `#737373` | Secondary text |

### Accent Colors

| Token | Value | Usage |
|---|---|---|
| `--color-blue` | `#8DDFF2` | Selected pills, information states |
| `--color-mint` | `#79EBC5` | Success, completed steps, safe actions |
| `--color-pink` | `#F6A7D9` | Friendly emphasis and worker profile |
| `--color-lavender` | `#C9B5F7` | Secondary highlights |
| `--color-yellow` | `#F7D978` | Warnings and pending actions |
| `--color-danger` | `#F28B82` | Urgent alerts and critical cases |

### Usage Rules

- Use one main accent color per screen.
- Avoid combining more than two bright accents in a single card.
- Never rely on color alone to communicate urgency or state.
- Urgent actions must include text and an icon.

---

## 5. Typography

Use a modern rounded sans-serif font.

### Recommended Fonts

- Primary: `Inter`
- Alternative: `Manrope`
- Malayalam: `Noto Sans Malayalam`
- Hindi and other Indic scripts: `Noto Sans Devanagari`, `Noto Sans Bengali`, and relevant Noto families

### Type Scale

| Style | Desktop | Mobile | Weight |
|---|---:|---:|---:|
| Display | 56px | 36px | 700 |
| H1 | 40px | 30px | 700 |
| H2 | 30px | 24px | 700 |
| H3 | 22px | 20px | 600 |
| Body Large | 18px | 17px | 400 |
| Body | 16px | 16px | 400 |
| Small | 14px | 14px | 400 |
| Label | 13px | 13px | 600 |

### Text Rules

- Keep worker-facing sentences short.
- Limit paragraphs to two or three lines.
- Use sentence case, not all caps.
- Avoid complex legal or technical vocabulary.
- Provide audio playback beside important instructions.

---

## 6. Shape Language

### Border Radius

| Element | Radius |
|---|---:|
| Large cards | 32px |
| Standard cards | 24px |
| Inputs | 18px |
| Buttons | 999px |
| Pills | 999px |
| Modal sheets | 28px |

### Shadows

Use subtle shadows only.

```css
box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
```

Avoid strong floating shadows and glassmorphism.

---

## 7. Layout System

### Desktop

- Maximum content width: `1440px`
- Main container width: `1200px`
- Side padding: `48px`
- Grid: `12 columns`
- Gap: `24px`

Recommended dashboard layout:

- Left navigation: `240px`
- Main content: flexible
- Right context panel: `320px`, optional

### Tablet

- Side navigation collapses to icons
- Main content uses two columns
- Context panel moves below the main section

### Mobile

- Single-column layout
- Horizontal padding: `16px`
- Bottom navigation
- Sticky primary action where appropriate
- Cards use full available width
- Avoid nested scrolling

### Breakpoints

```text
Mobile: 0–639px
Tablet: 640–1023px
Desktop: 1024px and above
Large desktop: 1440px and above
```

---

## 8. Worker App Structure

The worker interface should be designed mobile-first.

### Mobile Navigation

Use a fixed bottom navigation with four items:

1. Home
2. My Cases
3. Documents
4. Profile

Use icon plus short label.

### Desktop Navigation

Use a left sidebar with:

- Sahaayi logo
- Home
- My Cases
- Documents
- Help Centres
- Profile
- Language switcher
- Emergency Help

The emergency action should remain visually distinct.

---

## 9. Home Screen

### Mobile

The top section should include:

- Greeting in the selected language
- Current language
- Notification icon
- Short reassuring line

Primary card:

- Large illustration
- Text: “How can I help you today?”
- Large microphone button
- Secondary text input
- Language indicator

Quick actions as rounded cards:

- Wage issue
- Workplace injury
- Documents
- Registration help
- Safety issue
- Other help

### Desktop

Use a two-column hero:

- Left: voice interaction and primary actions
- Right: illustration or active case summary

Below the hero:

- Recent cases
- Pending actions
- Nearby verified support centres
- Important updates

---

## 10. Voice Interaction

### Default State

- Large circular microphone button
- Soft accent background
- Label: “Hold to speak”
- Language shown directly below

### Listening State

- Expand the voice card
- Show animated waveform
- Display live transcription
- Provide stop and cancel actions

### Processing State

- Show clear progress steps:
  - Listening
  - Understanding
  - Preparing next steps

### Result State

Show:

- What the system understood
- Detected issue category
- Urgency level
- Key extracted details
- Edit button
- Continue button

Do not move forward without worker confirmation for important fields.

---

## 11. Case Cards

Each case card should contain:

- Issue icon
- Case title
- Status pill
- Date created
- Location
- Next required action
- Human caseworker, when assigned

### Status Colors

| Status | Color |
|---|---|
| New | Blue |
| Awaiting worker | Yellow |
| Under review | Lavender |
| Urgent | Red |
| Resolved | Mint |
| Closed | Neutral grey |

### Case Detail Page

Sections:

1. Case summary
2. Worker’s original statement
3. Translated statement
4. Evidence timeline
5. Missing information
6. Recommended next steps
7. Assigned support organisation
8. Case activity

On desktop, use a two-column layout.

On mobile, use stacked expandable sections.

---

## 12. Evidence Timeline

Use a vertical timeline with rounded evidence cards.

Evidence types:

- Voice note
- Worksite photo
- Payment screenshot
- WhatsApp screenshot
- Attendance record
- Identity document
- Medical document

Each card should show:

- Evidence type
- Date and time
- Extracted information
- Verification state
- Worker confirmation state

AI-generated interpretation must be labelled:

> “AI-extracted information. Please verify.”

---

## 13. Forms and Inputs

### Input Style

- Large rounded fields
- Minimum height: `52px`
- Visible labels above fields
- Supporting text below fields
- Clear error messages
- Avoid placeholder-only labels

### Preferred Input Methods

- Voice
- Camera capture
- Upload
- Large selection cards
- Simple date picker
- Numeric keypad for amounts

Avoid long multi-field forms.

Break forms into short steps with a progress indicator.

---

## 14. Buttons

### Primary Button

- Dark background
- White text
- Pill shape
- Minimum height: `52px`

### Secondary Button

- White background
- Dark border
- Dark text

### Accent Button

Use mint or blue for supportive actions.

### Emergency Button

- Red-tinted background
- Clear warning icon
- Text such as “Get urgent help”

Buttons must remain at least `44px` high.

---

## 15. Illustrations

Use simple line-drawn human faces and symbols inspired by the reference.

### Style

- Thick black strokes
- Flat pastel circles or blobs
- Minimal facial details
- No photorealism
- Inclusive characters
- Friendly expressions
- Consistent stroke width

Possible illustration themes:

- Worker speaking
- Helper listening
- Document being reviewed
- Hospital support
- Wage calculation
- Case successfully resolved

---

## 16. Caseworker Dashboard

The caseworker interface can be more information-dense than the worker app.

### Main Sections

- New cases
- Urgent cases
- Assigned to me
- Awaiting evidence
- Resolved cases
- Analytics

### Desktop Layout

- Left sidebar
- Header with search and filters
- Summary metric cards
- Case table or card grid
- Right-side case preview drawer

### Core Case Table Fields

- Worker
- Issue type
- Language
- Location
- Urgency
- Assigned person
- Current status
- Last update

### Mobile Caseworker View

Use stacked cards instead of tables.

---

## 17. Cards and Panels

### Standard Card

- White surface
- 24px radius
- 20–24px padding
- Thin border
- No heavy shadow

### Highlight Card

- Pastel background
- Large title
- Minimal content
- Strong action button

### Dark Focus Panel

Use for:

- Voice listening
- Emergency guidance
- Critical confirmation
- Important onboarding steps

Use white text and pastel accents.

---

## 18. Charts and Data Visualisation

Use simple rounded charts similar to the reference.

Recommended visualisations:

- Cases by issue type
- Resolution status
- Cases by language
- Average resolution time
- Wage amounts recovered
- Registration assistance completed

### Chart Style

- Rounded line charts
- Soft pastel fills
- Minimal grid lines
- Clear tooltips
- No 3D charts
- No dense dashboards

---

## 19. Responsive Behaviour

### Navigation

- Desktop: left sidebar
- Tablet: collapsed sidebar
- Mobile: bottom navigation

### Cards

- Desktop: two to four cards per row
- Tablet: two cards per row
- Mobile: one card per row

### Dialogs

- Desktop: centred modal
- Mobile: bottom sheet

### Tables

- Desktop: full table
- Mobile: transform rows into cards

### Voice Interface

- Mobile: full-screen or large bottom sheet
- Desktop: centred interaction card

---

## 20. Accessibility

- Minimum contrast ratio: WCAG AA
- Minimum touch target: `44 × 44px`
- Keyboard accessible on desktop
- Visible focus states
- Screen-reader labels
- Audio playback for major instructions
- Captions for all audio
- Avoid time-limited interactions
- Support text scaling
- Do not encode urgency using color alone
- Keep language selection visible and easy to change

---

## 21. Motion

Use subtle, purposeful animation.

### Recommended

- Card fade and slide
- Pill selection transition
- Voice waveform
- Progress step animation
- Case status update animation
- Bottom-sheet transitions

### Timing

```text
Fast: 150ms
Standard: 250ms
Slow: 400ms
```

Avoid bouncing, spinning, or decorative motion during urgent workflows.

---

## 22. Empty, Loading, and Error States

### Empty State

Use a friendly illustration and one clear action.

Example:

> “You do not have any active cases.”

Button:

> “Ask Sahaayi for help”

### Loading State

Show skeleton cards and clear status text.

### Error State

Explain what failed and provide a recovery action.

Example:

> “We could not understand the audio. Try speaking again or type your message.”

---

## 23. Design Tokens

```css
:root {
  --color-bg: #F7F7F5;
  --color-surface: #FFFFFF;
  --color-dark: #1B1B1B;
  --color-muted-dark: #343434;
  --color-text: #191919;
  --color-text-muted: #737373;
  --color-border: #E8E8E4;

  --color-blue: #8DDFF2;
  --color-mint: #79EBC5;
  --color-pink: #F6A7D9;
  --color-lavender: #C9B5F7;
  --color-yellow: #F7D978;
  --color-danger: #F28B82;

  --radius-sm: 14px;
  --radius-md: 18px;
  --radius-lg: 24px;
  --radius-xl: 32px;
  --radius-pill: 999px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
}
```

---

## 24. Suggested Initial Screens

### Worker App

1. Language selection
2. Welcome and permissions
3. Home
4. Voice intake
5. Confirm understood information
6. Case created
7. Case detail
8. Evidence upload
9. Documents wallet
10. Profile and consent settings

### Caseworker App

1. Dashboard
2. Case queue
3. Case detail
4. Evidence review
5. Worker communication
6. Assignment and escalation
7. Reports and analytics

---

## 25. Do Not Use

- Corporate blue government portal styling
- Dense forms
- Sharp corners
- Heavy gradients
- Excessive glass effects
- Small text
- Too many icons without labels
- Long onboarding flows
- Large amounts of information on one worker-facing screen
- AI output without confirmation
- Decorative animations during emergencies

---

## 26. Final Visual Direction

The final interface should look like a modern consumer wellness app adapted for a serious worker-support platform:

- Soft pastel personality
- Strong black-and-white contrast
- Friendly illustrations
- Large rounded cards
- Voice-first interaction
- Clear status pills
- Calm and trustworthy layouts
- Simple mobile journeys
- More structured desktop case-management views

The worker experience should feel effortless. The caseworker experience should feel organised and actionable.
