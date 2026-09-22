/**
 * @system cli-session
 * @status handwritten
 * @edit edit directly
 *
 * Resolves the session-picker daemon URL — ONE resolver for every client.
 *
 * The daemon is a DEV-HOST-ONLY local singleton (`session-picker-is-dev-only`)
 * on a fixed local port, and every client — the TUI, terminal-ws, the daemon's
 * own tmux hooks/menu — runs on that SAME host. So there is exactly one correct
 * target in all contexts: the local daemon. There is no environment variation
 * to protect against (the carve-out to `service-ports-from-registry` for
 * dev-host singletons), so we default to the local URL instead of failing hard.
 *
 * `SESSION_PICKER_URL` is an OPTIONAL override (a non-default port / a test
 * daemon); absent it we connect to the local singleton. This is what makes the
 * picker behave identically whether it's launched from an SSH login shell, the
 * dashboard PTY, or anywhere else. The bug this closed: the old strict-throw
 * resolver left SSH logins (which carry no injected service env) unable to reach
 * a daemon that was running the whole time, so they fell back to a bare tmux
 * session — "all my sessions are missing" on a tablet SSH session while the PC
 * worked. There is NO separate "daemon URL" var: one daemon, one resolver.
 */
const LOCAL_DAEMON_URL = "http://127.0.0.1:3021";

export function getSessionPickerUrl(): string {
	return process.env.SESSION_PICKER_URL ?? LOCAL_DAEMON_URL;
}
