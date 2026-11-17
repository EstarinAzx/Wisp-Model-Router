---
type: active-work
project: wisp
updated: 2026-11-18
tags: [context, active-work, release]
---

# Active Work

_Last updated: 2026-11-18 by Codex._
_Release source: bc624831bf3d82e61596e4857ce77957017512af on main; tree identical to reviewed/tested release head dfeea620a88fb08f4ad2552aeca0f4e117206010._

## Current focus

**Wisp 2.2.15 and companion 1.14.12 are published, verified and installed.** The Bridge was confirmed stopped on port41184 at 2026-11-18 01:06 NZDT; no process needed killing. VS Code reload remains unverified. No implementation, review or release watcher remains active.

## Work contract

- **Authority:** khitarashi requested both Claude authentication fixes, regression tests and CodeRabbit review while preserving provider settings/credentials, then authorized pushing PR238 and, on 2026-11-18, "ok merge and release?" khitarashi then explicitly requested installation of Wisp2.2.15 and companion1.14.12 while preserving provider settings and credentials.
- **Execution/integration:** primary Codex implemented on fix/claude-auth-errors and merged [PR238](https://github.com/EstarinAzx/Wisp-Model-Router/pull/238) as f364b78483d9c3c69e6a50c25e0e557ffcedf45c. Release branch release/wisp-2.2.15 merged through [PR239](https://github.com/EstarinAzx/Wisp-Model-Router/pull/239); [v2.2.15](https://github.com/EstarinAzx/Wisp-Model-Router/releases/tag/v2.2.15) points to bc624831bf3d82e61596e4857ce77957017512af. GitHub renamed Wisp-Router to Wisp-Model-Router; old URLs redirect. Context is versioned. Preserve the unrelated flow edit.
- **Review:** [[review-policy]]. Implementation checkpoint claude-auth-errors-20261117 passed **3/3** launches: first two skipped incorrectly in a linked worktree, third reviewed all11 files in an identical plain checkout with zero issues. Authoritative ledger remains .claude/claude-auth-errors/work.md in the fix-claude-auth-errors worktree. Release checkpoint release-wisp-2.2.15 passed **2/3** launches: all13 files and intended instructions covered, zero issues; first run warned about an external context file. Its ledger is .claude/wisp-2.2.15/work.md in the release-wisp-2-2-15 worktree, with a receipt copy in the main checkout. Both hosted PR checks passed. No pending review or paid-credit escalation. Prior completed review budgets remain closed.
- **Evidence:** main checkout .claude/wisp-2.2.15/receipt.json, published-verification.json and installation.json. Release PR workflow44072038024 and publication workflow44072850705 succeeded. All four tagged platform builds and smokes passed; merge tree equals reviewed release head.
- **Checks:** core2179 tests; terminal219 tests/1186 assertions; core/TUI typechecks; companion build/VSIX; all34 terminal screen baselines; local and downloaded Windows launcher/Responses/signed Desktop smokes. Baseline changes are version labels only. Lockfile changes are workspace version metadata only. No live inference or account refresh.
- **Delivery:** all5 GitHub assets downloaded and SHA256-verified, including companion1.14.12. Main npm wisp-router2.2.15 tarball/integrity/version/platform pins verified; Windows, AppleSilicon and Linux optional npm metadata available. IntelMac optional npm2.2.15 remained unavailable; its verified GitHub binary is the installer's fallback. Initial main npm404 resolved without republishing. Slot remains1.7.6; Desktop protocol remains5.
- **Preservation:** provider config SHA25645f936f4208c1a03773c2820fff32c837f5b8f3534f17f62f0cf74d139b7641f and auth SHA256a26e219ea12d02a1ae91b80a7b402f1bb3404f47e491409e8106ac3ed1de0d00 unchanged during release work. Flow edit SHA256abb6e8469eb6d665c3e2657daa450218425239e9019cf92c7fd733084f60414d unchanged. Original main checkout fast-forwarded; existing clients/Bridge were not stopped.
- **Pending/checkpoint:** publication and installation complete. Global npm wisp-router2.2.15 and VS Code esarinazx.wisp1.14.12 verified; installed executable matches the GitHub asset SHA256, companion bundle matches the verified VSIX, and provider config/auth hashes are unchanged. No processes were restarted. User subsequently requested killing the Bridge; it was already stopped, with no listener on port41184 and no Wisp process. Wrap-up reconfirmed the port has no listener. All four task-owned review/CI shells exited successfully. Start the Bridge and reload VS Code when ready; no start is authorized by this wrap-up.

## Behavior and limits

Claude launches keep local Bridge API-key authentication and clear the competing auth token in child environment and temporary settings. Explicit conflicting token settings are refused. Failed refreshes cannot return a known-expired Anthropic access token for inference; still-valid tokens remain usable after a proactive refresh failure. Trusted upstream401 and local auth failures stay actionable401s across all three Bridge APIs; signed Desktop errors remain redacted. Stored credentials are preserved.

Antigravity's separate generic429 is unresolved by this patch. Today's investigation established Carbon RESOURCE_EXHAUSTED responses without a reset hint and a direct Anthropic fallback failing with an expired OAuth token; the exact Antigravity quota/capacity cause and historical token-refresh rejection were not retained. Account sign-in recovery remains separate. No live native Claude launch was used to verify the warning; regression tests exercise child environment/settings and mock upstreams.

## Previous completed work

- Model-specific Antigravity cooldowns from2.2.14 remain intact. Its receipt lives in .claude/wisp-2.2.14/receipt.json; review checkpoint remains passed2/3. Do not reopen it.
- Release2.2.13 acceptance limits remain in .claude/wisp-2.2.13/release-receipt.json and docs/releases/v2.2.13.md. This patch does not newly qualify full-window inference, compaction, live Anthropic client-stamp acceptance, Local sign-in, forced Claude ANY or Desktop UI.
- Earlier held work remains in [[release-follow-ups]]. The old relay remains stopped/completed.

## Pick up here

No active work. Requested fixes, release and installation are complete. Do not repeat them or reopen passed review budgets. Bridge is stopped; starting it is the next user-directed action if desired. Preserve provider settings/credentials and the unrelated flow edit. Antigravity quota/auth recovery remains a separate task.

## Related

- [[pick-up]]
- [[overview]]
- [[review-policy]]
- [[release-follow-ups]]
