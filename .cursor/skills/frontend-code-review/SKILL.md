---
name: frontend-code-review
description: Code review checklist for frontend changes. Use when reviewing PRs that touch frontend/.
---

# Frontend code review skill

## When to use

- Reviewing pull requests or changes that touch `frontend/`.
- Performing a code review focused on constitution compliance, boundaries, and Angular patterns.

## Instructions

1. **Constitution checklist**
   - **Monorepo boundaries:** `frontend` depends only on `shared`. No backend imports or business logic in shared. No direct `frontend` ↔ `backend` dependency.
   - **TypeScript:** Strict mode; no unwarranted `any`; explicit return types for public APIs where appropriate.
   - **Security baselines:** No secrets in source; no sensitive data in logs; no stack traces or internals exposed to client. Input validation/sanitization and rate limiting are backend; note if frontend sends unsanitized or unvalidated data.

2. **Angular best practices**
   - Use the [Angular best-practices rule](../../../frontend/agents/platform-guidelines/angular-best-practices.md). Check: standalone components, signals, `input()`/`output()`, `inject()`, native control flow, no `ngClass`/`ngStyle`, `ChangeDetectionStrategy.OnPush`, reactive forms where applicable.

3. **Accessibility baseline**
   - Labels, focus order, keyboard navigation, semantics (e.g. headings, landmarks). For full UX and WCAG 2.1 AA + CWV, use the [UX Reviewer agent](../../../frontend/agents/ux-reviewer.agent.md) or [frontend-ux-review skill](../frontend-ux-review/SKILL.md).

4. **Full reviewer behavior**
   - For the complete Code Reviewer agent workflow and output format, see [frontend/agents/code-reviewer.agent.md](../../../frontend/agents/code-reviewer.agent.md).
