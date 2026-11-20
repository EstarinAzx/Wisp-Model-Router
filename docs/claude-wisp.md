# Claude Code through Wisp

`claude-wisp` launches the Claude Code installed on your PATH through the running Wisp Bridge. It does not install or update Claude Code. The launcher requires Claude Code **2.1.322 or newer**.

## Choose and switch aliases

Normal launches retain Claude Code's gateway model picker. Your saved Wisp aliases appear there alongside any Provider rows enabled by your Wisp settings. Use `/model` to switch during a conversation.

```sh
claude-wisp
claude-wisp --model Astra
claude-wisp --model "Grok 4.7"
```

`--model` selects the starting target without locking it. A fresh launch without a selection starts on Wisp's Active Provider. The launcher also accepts Provider IDs and configured Claude family routes. Normal `--resume`, `--continue` and `--from-pr` can omit `--model`, leaving the saved selection to Claude; adding `--model` selects a different starting alias. Native fallback arguments remain available in normal mode.

Gateway discovery refreshes when Claude starts and uses its native cache. Relaunch after adding an alias if the current picker has not discovered it yet. Existing user or managed model restrictions still apply.

## Context trade-off

Normal mode uses Claude Code's context estimates and your native context settings. Wisp does not claim those estimates equal each backend's actual capacity. A larger backend can compact early; switching a large conversation to a smaller backend can exceed its limit. Compaction settings are not declarations of model capacity.

Normal mode does not disable compaction, rewrite your settings, or supply one target's numeric budget to every other alias. A launch nested inside Wisp's exact mode removes the inherited Wisp profile and its fixed budget from the new child.

## Opt into one exact target budget

```sh
claude-wisp --exact-context --model Astra
claude-wisp --exact-context --model "Grok 4.7"
```

Exact mode preserves the signed, single-target profile. Codex and Antigravity limits come from their account catalogues. Other targets use available public catalogue metadata or curated known-model data. Missing metadata uses a clearly reported **128000-token fallback**, which is assumed rather than a verified backend capacity.

The numeric context override applies to the child process. Its picker is restricted to that target, and the Bridge refuses other models or a changed route before generation. Switch by exiting and relaunching:

```sh
claude-wisp --exact-context --resume <session-id> --model Sol
```

Exact resume requires an explicit target. Other-target subagents and fallback targets are refused; same-target subagents share the budget. Server-side advisor routing remains separate. Normal sessions retain native model switching instead of this exact-target guarantee.

When resuming a conversation created under the old pinned launcher, pass an explicit `--model <alias>` so its temporary generated model ID is replaced with the real alias. Wisp does not restart an active conversation on your behalf or guarantee that a long conversation fits a smaller backend.

## Settings and validation

Both modes preserve unrelated settings and native permissions, use child-only local Bridge transport, neutralize competing auth tokens, and remove their private temporary settings file on exit. Real auth files, persistent Claude settings and Wisp routes are not rewritten. Conflicting explicit transport overrides are refused. Exact mode additionally refuses settings that disable its required compaction.

Run `bun packages/tui/tests/nativeClaudeContext.check.ts` with installed Claude Code. It uses only a synthetic local Bridge and disposable profiles: normal mode discovers the alias list and switches routes, while exact mode verifies 128K, 400K, 500K and 1M reported budgets and refuses a cross-target switch. Actual provider capacity and full-window generation remain separate acceptance checks.
