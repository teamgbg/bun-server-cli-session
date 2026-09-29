// @system codegen
// @status generated
// @edit edit the registry row's content, then regenerate

const LOCAL_DAEMON_URL = "http://127.0.0.1:3021";

export function getSessionPickerUrl(): string {
	return process.env.SESSION_PICKER_URL ?? LOCAL_DAEMON_URL;
}
