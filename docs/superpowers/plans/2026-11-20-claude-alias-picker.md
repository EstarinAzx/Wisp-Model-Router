# Claude Alias Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore live alias switching by default and keep exact budgets explicitly optional.
**Architecture:** Keep the existing child-settings builder and Windows launcher; make the signed context profile optional. Normal mode probes the existing Bridge and uses normal gateway model IDs. The Bridge's exact-profile validation remains unchanged.
**Tech Stack:** TypeScript, Bun 1.4.2, Node HTTP, existing native Claude fixture.
**Spec:** ../specs/2026-11-20-claude-alias-picker-design.md

## Global Constraints
- Preserve auth/permission boundaries, real stores and running Bridge.
- Use existing exact context version floor 2.1.322; validate actual switching on installed 2.1.329 with synthetic IO.
- Inline Codex implementation; existing CodeRabbit policy, max three launches, no paid escalation.
- Preserve unrelated primary-worktree flow-note changes. No dependency/version changes or publication.

## Review Focus
- Normal launches inherited from exact mode must not carry the signed profile/header/global budget.
- Case-insensitive protected env keys must not reintroduce competing auth or transport.
- Resume/fallback/arguments after `--` retain native semantics in normal mode.
- Exact mode retains target binding, fallback refusal and explicit-target resume.
- Both direct and compiled launch paths clean temporary settings and mirror exit status.

### Task 1: Restore the picker and verify both modes
**Files:** `packages/core/src/claudeContext.ts` (exact-mode relaunch guidance), `packages/tui/src/claudeContextLaunch.ts`, `packages/tui/src/claude-wisp.ts`, `packages/tui/tests/claudeContext.test.ts`, `packages/tui/tests/nativeClaudeContext.check.ts`, `docs/claude-wisp.md`, `README.md`, `packages/tui/npm/wisp-router/README.md`.
**Interfaces:** `ClaudeContextArgs` adds `exactContext` and `resume`; `parseClaudeContextArgs` consumes the new flag. `buildClaudeContextLaunch` accepts an absent profile/token for normal mode, producing child env/args/settings without picker restrictions. `runClaudeWisp` chooses normal discovery or existing exact negotiation.
- [ ] Add parser and settings tests: normal resume/fallback accepted, exact restrictions retained, no normal profile/picker/budget injection, nested exact cleanup, explicit transport conflicts refused.
- [ ] Run `bun test packages/tui/tests/claudeContext.test.ts`; observe new assertions fail against the old implementation.
- [ ] Implement the two modes using existing transport/settings handling. Normalize initial Wisp alias IDs and validate selected local routes; preserve native selection on normal resume without an explicit model.
- [ ] Extend direct/dispatcher fake-child tests to verify normal mode does not negotiate a context profile and still cleans temporary settings.
- [ ] Extend native fixture: all aliases appear and switch routes in one normal session; exact 128K/400K/500K/1M profiles and refused switches still pass.
- [ ] Update launcher README/guide text with the approved trade-off and exact opt-in commands.
- [ ] Run full core and TUI suites, typechecks, native fixture, compiled launcher checks; require pass. Run CodeRabbit on the complete checkpoint and settle findings within its budget.
- [ ] Commit the reviewed implementation, retaining evidence and reporting deployment limits.
