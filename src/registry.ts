/**
 * @system cli-session
 * @status handwritten
 * @edit edit directly
 *
 * Loads AdapterSpec rows from the registry via registry.require().
 * Validates each row's config JSON against the Valibot schema.
 * Throws loudly on invalid rows — no silent degradation.
 */

import { getEntriesByType } from "@teamscala/db/registry/getEntriesByType";
import { AdapterSpecConfigSchema } from "@teamscala/session-contracts/schemas";
import type { AdapterSpec } from "@teamscala/session-contracts/types";
import { parse as valibotParse } from "valibot";

interface AdapterSpecConfig {
	label?: string;
	transport?: string;
	session?: string;
	capabilities?: unknown;
	defaults?: unknown;
	event_map?: unknown;
	commands?: unknown;
	display?: unknown;
}

function validateAndBuildSpec(
	slug: string,
	raw: AdapterSpecConfig,
): AdapterSpec {
	const config = valibotParse(AdapterSpecConfigSchema, raw);
	return {
		slug,
		label: config.label ?? slug,
		transport: config.transport as AdapterSpec["transport"],
		session: config.session as AdapterSpec["session"],
		capabilities: config.capabilities as AdapterSpec["capabilities"],
		defaults: config.defaults,
		event_map: config.event_map,
		commands: config.commands,
		display: config.display,
	};
}

export function loadAdapterSpecs(): AdapterSpec[] {
	const rows = getEntriesByType("orchestrator_cli");
	const specs: AdapterSpec[] = [];
	for (const row of rows) {
		specs.push(validateAndBuildSpec(row.slug, row.config as AdapterSpecConfig));
	}
	return specs;
}

export function getAdapterSpec(slug: string): AdapterSpec | null {
	const entry = getEntriesByType("orchestrator_cli").find(
		(r) => r.slug === slug,
	);
	if (!entry) return null;
	return validateAndBuildSpec(entry.slug, entry.config as AdapterSpecConfig);
}
