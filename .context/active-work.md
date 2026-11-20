---
type: active-work
project: wisp
updated: 2026-11-20
tags: [context, active-work, release]
---

# Active Work

_Updated 2026-11-20 by Codex. Released source `3a73f0bb5a5a1bd154f2b3a7a16c93bb0beb56c5`._

## Wisp 2.3.2 released and installed

- Khitarashi approved **native context estimates plus optional exact mode**, then explicitly requested: "Release this fix as Wisp 2.3.2 and install the updated TUI and VS Code companion for me. and also update readme then wrap up to update the baton." Scope and behavior are in the [approved design](../docs/superpowers/specs/2026-11-20-claude-alias-picker-design.md) and [launcher guide](../docs/claude-wisp.md).
- [PR #242](https://github.com/EstarinAzx/Wisp-Model-Router/pull/242) merged to `3a73f0bb5a5a1bd154f2b3a7a16c93bb0beb56c5`; [v2.3.2](https://github.com/EstarinAzx/Wisp-Model-Router/releases/tag/v2.3.2) points there. Its complete tree matches reviewed head `a3e164886ae595788e137a19dbc5dac7deb79c53`. Main also carries the versioned handoff.
- Normal `claude-wisp` restores the gateway alias picker and in-session switching. `--model` chooses a starting alias; `--exact-context` retains the signed one-target budget and guards. Normal `--resume`, `--continue` and `--from-pr` retain native selection unless `--model` or an explicit `--settings.model` overrides it. The argument takes precedence over the settings model.
- Root and companion READMEs, launcher guide and release notes are updated. **Terminal/npm 2.3.2**, **companion 1.14.15**, slot **1.7.6**, Desktop protocol **5**, Claude Code request stamp **2.1.329**.

## Verification and review

- Bun 1.4.2: **2,180 core tests and 242 TUI tests passed**, including 44 terminal snapshots. Typechecks, packaged launcher/Desktop checks and compiled native Claude Code 2.1.329 checks passed. Normal mode discovered every fixture alias and switched routes; exact 128K/400K/500K/1M budgets and cross-target refusal passed. Installed-binary checks repeated the native modes successfully with synthetic provider IO.
- Initial concurrent testing had two wall-clock failures. A later run hit an intermittent Windows `EPERM` in unchanged quota-lock recovery code/tests, identical to v2.3.1. The focused recovery test and final full suites passed without code or threshold changes. Full logs remain in the release receipt directory; this is not claimed to fix the unrelated intermittent quota-lock condition.
- [Release workflow 44719175062](https://github.com/EstarinAzx/Wisp-Model-Router/actions/runs/44719175062) passed Windows x64, Linux x64 and both macOS architectures, then publication. All five GitHub asset digests, the main npm archive and all four npm platform archives were verified. Published extension/webview bundles match the locally verified build. The live README blob matches the release.
- [[review-policy]] remains authoritative. Implementation checkpoint `claude-alias-picker` passed at **1/3** native CLI runs. Release checkpoint `release-wisp-2.3.2` passed at **3/3**; do not reset or relaunch this consumed budget. Hosted review identified missing `--from-pr` resume handling (fixed with red/green regressions at `3e244ad`) and missing documentation of settings-model precedence (fixed at `a3e1648`, covered by native CLI run 3). All current PR checks were green; the final docs-only commit had no separate hosted check. No review or reply is pending.
- Receipts live under `out/release-2.3.2/` in the **fix/claude-alias-picker** worktree: `review.json`, `published/verification.json`, `published/registry-status.json`, and `installed-native.log`. The implementation receipt is `out/claude-picker/review.json`. Use `git worktree list` to find the checkout; use its physical D: path for Bun, since the C: junction caused absolute workspace paths in a provisional lockfile. The original lockfile was preserved.

## Installation and user state

- Global `wisp --version` / npm report **2.3.2**; VS Code lists **esarinazx.wisp@1.14.15**. Installed npm files, Windows optional-package binary and extension/webview bundles match the verified release. Installation receipt and logs are `.claude/wisp-2.3.2/installation.json` in the primary checkout.
- npm initially returned 404 after accepting the publish with a processing notice. Installation used a release-tag wrapper archive whose full SHA1 matched the CI publish log, plus verified release assets. npm subsequently exposed **2.3.2 as latest**, and the installed wrapper archive's SHA512 matched registry metadata. No publication blocker remains.
- Wisp config/auth, VS Code user settings and Claude settings hashes remained unchanged. Port **41184** had no listener before or after installation; no Bridge start/stop or VS Code reload was issued. Already-running Claude sessions need a relaunch to receive the restored picker; resume an older pinned chat with an explicit `--model <alias>`. Activation inside a previously open editor window was not tested.
- No live-provider generation or full-window capacity acceptance was performed. Normal mode uses Claude's estimates (the synthetic aliases reported 1M), not an exact per-backend capacity guarantee. The user's unrelated flow-note edit remains preserved and uncommitted.

## Pick up here

No active work. Release, installation, README and handoff are complete. Keep the user's Bridge state and settings unchanged. Earlier held provider investigations remain in [[release-follow-ups]].

## Related

- [[pick-up]]
- [[overview]]
- [[review-policy]]
- [[release-follow-ups]]
- [[flows]]
