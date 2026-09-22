/**
 * @system cli-session
 * @status handwritten
 * @edit edit directly
 *
 * Registry-driven tmux target policy. Reads from config:tmux-target-policy
 * with fallback to pane_id normalization and 60s reconcile interval.
 */

import { getAppLogger } from "@teamscala/logger/app-loggers";

const logger = getAppLogger();

import { TmuxTargetPolicyConfigSchema } from "@teamscala/db-validation/registry-schemas/tmux-target-policy";
import { loadOptionalRegistryConfig } from "@teamscala/db/registry/load-config";

type NormalizeTarget = "pane_id" | "window_name" | "window_index";

export interface TmuxTargetPolicyConfig {
	normalize_to: NormalizeTarget;
	reconcile_interval_seconds: number;
	fallback_target: string | null;
}

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
	} catch (err) {
		if (!policySynced) {
			logger.warn(
				`[tmux-policy] Failed to load tmux-target-policy: ${err instanceof Error ? err.message : String(err)} — using defaults`,
			);
		}
	}
	policySynced = true;
}

export function getTmuxTargetPolicy(): TmuxTargetPolicyConfig {
	return currentPolicy;
}

export function getTmuxReconcileIntervalSeconds(): number {
	return currentPolicy.reconcile_interval_seconds;
}
