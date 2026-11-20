---
type: active-work
project: wisp
updated: 2026-11-20
tags: [context, active-work, release]
---

# Active Work

Wisp Flight 2.3.0 and VS Code companion 1.14.13 are released and installed on this Windows machine. The installation check finished at 16:45 NZDT on 20 November 2026. This release and installation are complete.

## Release and review

- Khitarashi authorized the release, then the local installation and wrap-up. The install instruction required preserving provider settings, credentials and the existing Bridge state.
- [PR #240](https://github.com/EstarinAzx/Wisp-Model-Router/pull/240) merged to `3c05bc06db27c88a911131f5deefd5b3e35b4910`. Tag [v2.3.0](https://github.com/EstarinAzx/Wisp-Model-Router/releases/tag/v2.3.0) points to that commit. Its tree matches reviewed head `fe54fb67092bcd9feb6cd7c41680b9a588ed184e`.
- The [tag workflow](https://github.com/EstarinAzx/Wisp-Model-Router/actions/runs/44667678469) passed on Windows x64, both macOS architectures and Linux x64, then published four binaries, the VSIX and the npm release. All five GitHub asset digests and the main npm shell integrity were verified. The Windows and Linux optional tarballs initially returned 404. Windows subsequently installed from its optional package and the installed binary matched the release digest. The Windows GitHub fallback was independently verified.
- [[review-policy]] governs review. Flight implementation checkpoint `flight-production` passed on `f27cd37` (7/7). Release checkpoint `release-wisp-2.3.0` passed on `fe54fb6` (4/4, including one additional run authorized by khitarashi). Hosted review found three picker layout issues involving the footer, wrapped model IDs and the provider list. All three were fixed with regression checks. The final hosted review recorded zero new actionable comments. The authoritative release ledger is `out/release-2.3.0/review.json` in the `release/wisp-2.3.0` worktree. No review is pending.

## Local installation

- The global npm command reports `wisp-router 2.3.0`. Its Windows optional-package binary matches the published SHA-256. VS Code lists `esarinazx.wisp@1.14.13`. The installed extension and webview bundles match the published VSIX.
- Wisp's `config.json` and `auth.json` hashes matched before and after each installation. Port 41184 had no listener before installation, after each installer, or at final verification. No Bridge command or VS Code reload was issued. Activation inside an already-open editor window was not tested.
- Installation evidence is in the primary checkout at `.claude/wisp-2.3.0/installation.json`. Publication checks are in the release worktree at `out/release-2.3.0/published/verification.json`. The unrelated edit to `.context/flows.md` was preserved.

## Pick up here

No active task, watcher, pending reply or requested restart remains. Leave the Bridge in the user's chosen state. Earlier held work, including separate provider investigations, remains in [[release-follow-ups]].

## Related

- [[pick-up]]
- [[overview]]
- [[review-policy]]
- [[release-follow-ups]]
