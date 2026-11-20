---
type: active-work
project: wisp
updated: 2026-11-20
tags: [context, active-work, release]
---

# Active Work

_Updated 2026-11-20 by Codex. Published commit `18a4ac4ee28b6c97ec430d2ce1fdeea6c1894258`._

## Wisp 2.3.1 published

- Khitarashi explicitly authorized committing, pushing and releasing 2.3.1 in the 2026-11-20 pick-up chat, after requesting Claude Code stamp 2.1.329. The earlier handoff's publication hold is retained in the historical review receipt; this release was explicitly authorized. Live provider acceptance and supported-integration qualification were not performed.
- [PR #241](https://github.com/EstarinAzx/Wisp-Model-Router/pull/241) merged to `18a4ac4ee28b6c97ec430d2ce1fdeea6c1894258`. [Tag v2.3.1](https://github.com/EstarinAzx/Wisp-Model-Router/releases/tag/v2.3.1) points there. Its tree exactly matches reviewed head `1a4057de0851ec07814aa9a1463fdacf52b84d1a`.
- The user's README changes and all three replacement screenshots are included. The live README blob was verified; screenshot bytes match the previously verified `1890190` images. Terminal/npm is 2.3.1, companion VSIX is 1.14.14, slot remains 1.7.6 and Desktop protocol remains 5.
- Final checks used pinned Bun 1.4.2: 2,180 core tests, 230 TUI tests, all package typechecks, Windows compiled launcher/Desktop smoke checks and VSIX checks passed. [Tag workflow 44705778577](https://github.com/EstarinAzx/Wisp-Model-Router/actions/runs/44705778577) passed all four native platform builds and publication.
- All five GitHub asset digests and the main npm package integrity were verified. The published extension/webview bundles match the local build, including stamp 2.1.329. The downloaded Windows binary passed launcher/Desktop smoke checks. The published npm shell's actual GitHub download fallback passed in an isolated home; its binary hash and both launcher guards matched expectations.
- All four optional npm platform packages were absent from registry metadata during verification; the main npm shell was published with correct version pins and latest tag. GitHub assets are available for every target. Windows fallback was exercised; other hosts' fallback downloads were not run locally.
- Per [[review-policy]], stamp checkpoint `wisp-2.3.1-claude-stamp` and release checkpoint `release-wisp-2.3.1` passed at 1/3 CLI runs each with zero issues. The automatic PR review completed with no actionable comments. No review is pending.
- Evidence lives under `out/release-2.3.1/` in the `feat/wisp-2.3.1` worktree: `review.json` links earlier checkpoints, `published/verification.json` records artifacts/npm, and `published/fallback-verification.json` records the Windows fallback. Use `git worktree list` to locate it. The primary checkout owns the versioned handoff.
- Khitarashi subsequently requested installation of both release surfaces; the verified installation state is below.

## Previous release and review (2.3.0)

- Khitarashi authorized the release, then the local installation and wrap-up. The install instruction required preserving provider settings, credentials and the existing Bridge state.
- [PR #240](https://github.com/EstarinAzx/Wisp-Model-Router/pull/240) merged to `3c05bc06db27c88a911131f5deefd5b3e35b4910`. Tag [v2.3.0](https://github.com/EstarinAzx/Wisp-Model-Router/releases/tag/v2.3.0) points to that commit. Its tree matches reviewed head `fe54fb67092bcd9feb6cd7c41680b9a588ed184e`.
- The [tag workflow](https://github.com/EstarinAzx/Wisp-Model-Router/actions/runs/44667678469) passed on Windows x64, both macOS architectures and Linux x64, then published four binaries, the VSIX and the npm release. All five GitHub asset digests and the main npm shell integrity were verified. The Windows and Linux optional tarballs initially returned 404. Windows subsequently installed from its optional package and the installed binary matched the release digest. The Windows GitHub fallback was independently verified.
- [[review-policy]] governs review. Flight implementation checkpoint `flight-production` passed on `f27cd37` (7/7). Release checkpoint `release-wisp-2.3.0` passed on `fe54fb6` (4/4, including one additional run authorized by khitarashi). Hosted review found three picker layout issues involving the footer, wrapped model IDs and the provider list. All three were fixed with regression checks. The final hosted review recorded zero new actionable comments. The authoritative release ledger is `out/release-2.3.0/review.json` in the `release/wisp-2.3.0` worktree. No review is pending.

## Local installation

- Khitarashi requested both updates after publication. Global `wisp --version` and npm report **2.3.1**; VS Code lists **esarinazx.wisp@1.14.14**. The installed Windows optional-package binary matches the published SHA-256, and the installed extension/webview bundles exactly match the released VSIX.
- Installed from the verified published npm archive and VSIX. Evidence is in the primary checkout at `.claude/wisp-2.3.1/installation.json`, with installer logs and the pre-installation hashes alongside it.
- Credentials and VS Code user settings remained byte-identical. A separately opened local test-build TUI changed `.wisp/config.json` during installation; its current edits were preserved, with no config rollback. Port 41184 had no listener before or after installation; no Bridge start/stop or editor reload was issued.
- An already-open window was running `out/wisp-231/wisp.exe` from the feature worktree. Reopen via the installed `wisp` command for the released build. Activation inside an open editor window was not tested. The unrelated `.context/flows.md` edit remains untouched.

## Pick up here

No active work. Wisp 2.3.1 and companion 1.14.14 are released and installed. Wait for khitarashi's next instruction and keep the Bridge in the user's chosen state. Earlier held work, including separate provider investigations, remains in [[release-follow-ups]].

## Related

- [[pick-up]]
- [[overview]]
- [[review-policy]]
- [[release-follow-ups]]
