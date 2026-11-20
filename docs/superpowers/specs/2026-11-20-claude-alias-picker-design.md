# Claude alias picker restoration

Approved direction: khitarashi selected "Native estimates + optional exact mode (recommended)" in the 2026-11-20 structured question, after seeing the context trade-off and picker proposal.

Normal `claude-wisp` restores native gateway discovery and live alias switching. `--model` chooses the initial alias; it does not pin the session. Bare fresh launches retain the active Provider default. Normal resume without a model leaves selection to Claude. Existing saved restrictions and unrelated settings remain native.

`--exact-context` explicitly retains the existing signed, single-target context profile. Exact resume still needs a target and refuses fallback targets. Ordinary mode makes no exact numeric context promise: native estimates can compact early or exceed a smaller provider's limit. Do not disable compaction or fabricate per-model capacities.

Preserve child-only local transport, empty competing auth token, permissions, native arguments, temporary-file cleanup and Windows launch handling. A normal launch from an exact session must remove inherited Wisp-only profile/header/budget restrictions. Real settings, auth files, routing and the running Bridge remain untouched.

Approaches considered: native switching with optional exact mode (selected); one shared conservative budget (rejected because it reduces all targets to the smallest known window); automatic exact sizing across switches (not supported by current evidence). Installed Claude 2.1.329 still retained a 128000 process override after a synthetic model switch.

Scope: launcher parsing/settings/dispatch, regressions, native local-server checks and launcher documentation. No public release, version bump or global installation is part of this implementation checkpoint.
