/**
 * @system cli-session
 * @status handwritten
 * @edit edit directly
 * Boot-time mount for @teamscala/cli-session: registers the history readers
 * and the line parsers the session surface reads through
 * @teamscala/session-contracts.
 *
 * SDK factories are registered by each per-SDK adapter package's own mount,
 * not by this package — cli-session is generic
 * over which CLI/SDK is in use.
 *
 * Retired from this mount, each because it declared a capability nothing
 * derived (measured 2026-09-29):
 *   - the TypeScript session-picker daemon hooks (apps/session-picker: the
 *     picker is one Rust binary, tabs open only through fleetctl; the hooks
 *     imported three ../session-daemon/* modules that exist nowhere, so every
 *     consumer FATALed at boot — 2026-09-28, the scala-agents-ui prod move)
 *   - the tmux-target-policy boot sync (the policy module it loaded had no
 *     readers anywhere in the workspace)
 *   - eleven orchestrators-* handlers that all answered 501 "Not
 *     implemented" and had zero workspace consumers — a registered route is
 *     a promise the surface makes; a handler that can never answer is not one
 */

import type { MountContext } from "@teamscala/os/runtime-contracts/mount-context";
import { registerHistoryReader } from "@teamscala/session-contracts/history-readers-registry";
import { registerParser } from "@teamscala/session-contracts/parsers-registry";
import { readClaudeHistory } from "@teamscala/cli-protocol/history-readers/claude";
import { readCodexHistory } from "@teamscala/cli-protocol/history-readers/codex";
import { parseLine as parseClaudeStreamJson } from "@teamscala/cli-protocol/parsers/claude-stream-json";
import { parseLine as parseCodexJsonl } from "@teamscala/cli-protocol/parsers/codex-jsonl";
import { parseAcpFrame } from "@teamscala/cli-protocol/parsers/gemini-acp";

export async function mount(ctx: MountContext): Promise<void> {
	registerHistoryReader("claude-code", readClaudeHistory);
	registerHistoryReader("codex", readCodexHistory);

	registerParser("claude-stream-json", parseClaudeStreamJson);
	registerParser("codex-jsonl", parseCodexJsonl);
	registerParser("gemini-acp", parseAcpFrame);
}
