/**
 * @system cli-session
 * @status handwritten
 * @edit edit directly
 * Boot-time mount for @teamscala/cli-session. Registers:
 *   - History readers + parsers
 *   - Tmux policy sync boot hook
 *   - Session-picker daemon: boot hook + RPC routes
 *
 * SDK factories are registered by each per-SDK adapter package's own mount
 * (e.g. @teamscala/opencode), not by this package — cli-session is generic
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
import { parseLine as parseOpenCode } from "@teamscala/cli-protocol/parsers/opencode";

export async function mount(ctx: MountContext): Promise<void> {
	registerHistoryReader("claude-code", readClaudeHistory);
	registerHistoryReader("codex", readCodexHistory);

	registerParser("claude-stream-json", parseClaudeStreamJson);
	registerParser("codex-jsonl", parseCodexJsonl);
	registerParser("gemini-acp", parseAcpFrame);
	registerParser("opencode", parseOpenCode);

	ctx.registerBootHook("tmux-target-policy-sync", async () => {
		const { syncTmuxTargetPolicy } = await import("../tmux-policy-sync");
		await syncTmuxTargetPolicy();
	});

	ctx.registerBootHook("session-picker-daemon", async () => {
		const { registerDaemonRoutes } = await import("../session-daemon/routes.ts");
		const { registerFleetLifecycleRoutes } = await import(
			"../session-daemon/fleet-lifecycle-routes.ts"
		);
		const { startSessionPickerDaemon } = await import("../session-daemon/daemon.ts");
		registerDaemonRoutes(ctx.app);
		registerFleetLifecycleRoutes(ctx.app);
		await startSessionPickerDaemon();
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
