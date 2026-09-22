/**
 * @system cli-session
 * @status handwritten
 * @edit edit directly
 *
 * Resolves a tmux target (e.g. "Joe-claude-09_20:2.1") to a human-readable
 * label like "Joe-claude-09_20 / Claude-01" using the session name and
 * window name from tmux.
 * Also provides policy-driven normalization of tmux targets to durable form.
 * The policy is read from registry row type='config' slug='tmux-target-policy'.
 * If the row is missing, defaults to 'pane_id' (the most durable option).
 */

import { printMessage } from "@teamscala/tmux-session/interact";
import { getAppLogger } from "@teamscala/logger/app-loggers";

/** Defensive print-message read: returns null on any failure/timeout. */
function safePrint(target: string, format: string, timeoutMs: number): string | null {
	try {
		return printMessage(target, format, { timeoutMs });
	} catch {
		return null;
	}
}

const logger = getAppLogger();

import type { TmuxTargetPolicyConfig } from "@teamscala/db-validation/registry-schemas/tmux-target-policy";
import { TmuxTargetPolicyConfigSchema } from "@teamscala/db-validation/registry-schemas/tmux-target-policy";
import { loadOptionalRegistryConfig } from "@teamscala/db/registry/load-config";

type NormalizeTarget = TmuxTargetPolicyConfig["normalize_to"];

const DEFAULT_POLICY: TmuxTargetPolicyConfig = {
	normalize_to: "pane_id",
	reconcile_interval_seconds: 60,
	fallback_target: null,
};

let currentPolicy: TmuxTargetPolicyConfig = { ...DEFAULT_POLICY };
let policySynced = false;

export async function syncTmuxTargetPolicy(): Promise<void> {
	try {
		const raw = await loadOptionalRegistryConfig(
			"config",
			"tmux-target-policy",
			TmuxTargetPolicyConfigSchema,
		);
		if (raw) {
			currentPolicy = raw;
			if (!policySynced) {
				logger.info(
					`[tmux-policy] Loaded normalize_to=${raw.normalize_to} reconcile_interval=${raw.reconcile_interval_seconds}s`,
				);
			}
		} else if (!policySynced) {
			logger.info(
				"[tmux-policy] No tmux-target-policy found in registry — using defaults (pane_id, 60s)",
			);
		}
	} catch {
		logger.warn(
			"[tmux-policy] No tmux-target-policy found in registry — using defaults (pane_id, 60s)",
		);
	}
	policySynced = true;
}

export function _getTmuxTargetPolicy(): TmuxTargetPolicyConfig {
	return currentPolicy;
}

export function _getTmuxReconcileIntervalSeconds(): number {
	return currentPolicy.reconcile_interval_seconds;
}

function parseTmuxTarget(
	tmuxTarget: string,
): { sessionName: string; windowIndex: string; paneIndex: string } | null {
	if (!tmuxTarget) return null;
	const colonIdx = tmuxTarget.indexOf(":");
	if (colonIdx < 0) return null;
	const sessionName = tmuxTarget.slice(0, colonIdx);
	const windowPart = tmuxTarget.slice(colonIdx + 1);
	const dotIdx = windowPart.indexOf(".");
	const windowIndex = dotIdx >= 0 ? windowPart.slice(0, dotIdx) : windowPart;
	const paneIndex = dotIdx >= 0 ? windowPart.slice(dotIdx + 1) : "0";
	return { sessionName, windowIndex, paneIndex };
}

export function _resolveTmuxLabel(tmuxTarget: string): string | null {
	const parsed = parseTmuxTarget(tmuxTarget);
	if (!parsed) return tmuxTarget || null;

	const windowName = safePrint(`${parsed.sessionName}:${parsed.windowIndex}`, "#{window_name}", 3000);
	if (windowName) {
		return `${parsed.sessionName} / ${windowName}`;
	}

	return parsed.sessionName;
}

export function _resolveTmuxTargetLabel(tmuxTarget: string): string | null {
	if (!tmuxTarget) return null;

	const output = safePrint(tmuxTarget, "#{session_name}|#{window_name}", 1000);
	if (output) {
		const [sessionName, windowName] = output.split("|");
		if (sessionName && windowName) {
			return `${sessionName} / ${windowName}`;
		}
	}

	const parsed = parseTmuxTarget(tmuxTarget);
	if (!parsed) {
		return tmuxTarget.startsWith("%")
			? `tmux ${tmuxTarget} (gone)`
			: tmuxTarget;
	}

	if (/^\d+$/.test(parsed.windowIndex)) {
		const windowName = resolveWindowName(
			parsed.sessionName,
			parsed.windowIndex,
		);
		return `${parsed.sessionName} / ${windowName}`;
	}

	return `${parsed.sessionName} / ${parsed.windowIndex}`;
}

export function resolveWindowName(
	sessionName: string,
	windowIndex: string,
): string {
	return safePrint(`${sessionName}:${windowIndex}`, "#{window_name}", 1000) ?? windowIndex;
}

function normalizeToPaneId(tmuxTarget: string): string {
	if (tmuxTarget.startsWith("%")) return tmuxTarget;
	const paneOutput = safePrint(tmuxTarget, "#{pane_id}", 1000);
	if (paneOutput && paneOutput.startsWith("%")) return paneOutput;
	return tmuxTarget;
}

function normalizeToWindowName(tmuxTarget: string): string {
	const parsed = parseTmuxTarget(tmuxTarget);
	if (!parsed) return tmuxTarget;
	const winName = safePrint(tmuxTarget, "#{window_name}", 1000);
	if (winName) {
		return `${parsed.sessionName}:${winName}.${parsed.paneIndex}`;
	}
	return tmuxTarget;
}

const NORMALIZERS: Record<NormalizeTarget, (target: string) => string> = {
	pane_id: normalizeToPaneId,
	window_name: normalizeToWindowName,
	window_index: (t) => t,
};

export function _normalizeTmuxTargetToDurable(tmuxTarget: string): string {
	if (!tmuxTarget) return tmuxTarget;
	const normalize = NORMALIZERS[currentPolicy.normalize_to];
	return normalize(tmuxTarget);
}

export function _resolveTmuxTargetWithWindowName(tmuxTarget: string): string {
	const parsed = parseTmuxTarget(tmuxTarget);
	if (!parsed) return tmuxTarget;
	if (/^\d+$/.test(parsed.windowIndex)) {
		const windowName = resolveWindowName(
			parsed.sessionName,
			parsed.windowIndex,
		);
		return `${parsed.sessionName}:${windowName}.${parsed.paneIndex}`;
	}
	return tmuxTarget;
}
