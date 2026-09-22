/**
 * @system cli-session
 * @status handwritten
 * @edit edit directly
 *
 * Re-exports canonical types from @teamscala/os/contracts/orchestrator and
 * @teamscala/session-contracts. TransportNotSupportedError has one canonical
 * home in session-contracts per doctrine 'error-classes-have-one-home'.
 */

export * from "@teamscala/os/contracts/orchestrator";

export type {
	EncodeInputFn,
	ParseLineFn,
	SessionStore,
	TransportHandle,
} from "@teamscala/session-contracts/types";

export { TransportNotSupportedError } from "@teamscala/session-contracts/types";
