/**
 * @system cli-session
 * @status handwritten
 * @edit edit directly
 * Boot-time mount for @teamscala/cli-session. Registers:
 *   - History readers + parsers
 *   - Tmux policy sync boot hook
 *
 * The TypeScript session-picker daemon is RETIRED (apps/session-picker,
 * `session-picker-is-one-surface` and `session-picker-source-is-published-package`):
 * the picker is one Rust binary, tabs open only through fleetctl, and there is no
 * HTTP daemon, no TS middleman and no second process. This mount used to register a
 * `session-picker-daemon` boot hook importing `../session-daemon/routes.ts`,
 * `../session-daemon/fleet-lifecycle-routes.ts` and `../session-daemon/daemon.ts` —
 * three modules that exist nowhere in the workspace, left behind by the
 * cli-session-capture monorepo split (94ff7b8) that never carried them over. Every
 * consumer that mounted this package then FATALed at boot with
 * `Cannot find module '../session-daemon/routes.ts'` (measured 2026-09-28, the
 * scala-agents-ui prod container move). The hook is deleted rather than guarded: a
 * capability that doctrine has retired must not be importable at all.
 *
 * SDK factories are registered by each per-SDK adapter package's own mount,
 * not by this package — cli-session is generic
 * over which CLI/SDK is in use.
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

	ctx.registerBootHook("tmux-target-policy-sync", async () => {
		const { syncTmuxTargetPolicy } = await import("../tmux-policy-sync");
		await syncTmuxTargetPolicy();
	});

	const _orchHandler = async (
		_req: Request,
		_params: Record<string, string>,
	): Promise<Response> => new Response("Not implemented", { status: 501 });
	ctx.registerHandler("orchestrators-get", _orchHandler);
	ctx.registerHandler("orchestrators-post", _orchHandler);
	ctx.registerHandler("orchestrators-send", _orchHandler);
	ctx.registerHandler("orchestrators-history", _orchHandler);
	ctx.registerHandler("orchestrators-delete", _orchHandler);
	ctx.registerHandler(
		"orchestrators-events",
		async (_req: Request, _params: Record<string, string>) =>
			new Response("WebSocket upgrade required", { status: 400 }),
	);
	ctx.registerHandler("orchestrators-interrupt", _orchHandler);
	ctx.registerHandler("orchestrators-compact", _orchHandler);
	ctx.registerHandler("orchestrators-clear", _orchHandler);
	ctx.registerHandler("orchestrators-model", _orchHandler);
	ctx.registerHandler("orchestrators-session-check", _orchHandler);
}
