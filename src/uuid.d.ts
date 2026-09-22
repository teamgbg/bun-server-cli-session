declare module "uuid" {
	export function v1(
		options?: Record<string, unknown>,
		buffer?: unknown,
		offset?: number,
	): string;
	export function v3(
		name: string | Uint8Array,
		namespace: string | Uint8Array,
		buffer?: unknown,
		offset?: number,
	): string;
	export function v4(
		options?: Record<string, unknown>,
		buffer?: unknown,
		offset?: number,
	): string;
	export function v5(
		name: string | Uint8Array,
		namespace: string | Uint8Array,
		buffer?: unknown,
		offset?: number,
	): string;
	export function v6(
		options?: Record<string, unknown>,
		buffer?: unknown,
		offset?: number,
	): string;
	export function v7(
		options?: Record<string, unknown>,
		buffer?: unknown,
		offset?: number,
	): string;
	export function validate(uuid: string, version?: number): boolean;
	export function version(uuid: string): number;
}
