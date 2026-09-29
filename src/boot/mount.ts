// @system codegen
// @status generated
// @edit edit the registry row's content, then regenerate

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
