---
name: frontend-ux-review
description: WCAG 2.1 Level AA and Core Web Vitals checklist for frontend UX review. Use when reviewing for accessibility and performance.
---

# Frontend UX review skill

## When to use

- Reviewing frontend changes for UX, accessibility, and performance.
- Checking WCAG 2.1 Level AA compliance and Core Web Vitals.

## Instructions

1. **WCAG 2.1 Level AA checklist**
   - **Keyboard:** All functionality available via keyboard; no keyboard traps; visible focus indicators.
   - **Focus:** Logical focus order; focus visible on interactive elements.
   - **Labels and names:** Form controls have associated labels; buttons and links have accessible names.
   - **Color contrast:** Text and UI components meet contrast requirements (4.5:1 for normal text, 3:1 for large text and UI).
   - **Text resize:** Content reflows and remains usable at 200% zoom (or equivalent).
   - **Semantics and ARIA:** Use correct HTML elements (headings, landmarks, lists); use ARIA only when native semantics are insufficient; ensure ARIA is valid and not redundant.

2. **Core Web Vitals**
   - **LCP (Largest Contentful Paint):** Main content loads quickly; avoid blocking main content with heavy scripts or large assets.
   - **INP / FID (Interaction to Next Paint / First Input Delay):** Input responsiveness; avoid long tasks that block the main thread.
   - **CLS (Cumulative Layout Shift):** Avoid layout shift; reserve space for images and dynamic content; avoid inserting content above existing content without reserved space.

3. **How to check / avoid regressions**
   - Use browser DevTools (Lighthouse, Performance, Accessibility panels), axe or similar a11y tools, and real-device or throttled testing where appropriate. Prefer metrics (LCP, INP, CLS) over subjective "feels fast."

4. **Full UX reviewer behavior**
   - For the complete UX Reviewer agent workflow and output format, see [frontend/agents/ux-reviewer.agent.md](../../../frontend/agents/ux-reviewer.agent.md).
