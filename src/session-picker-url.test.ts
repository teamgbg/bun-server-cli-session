// @system codegen
// @status generated
// @edit change the suite in the owned-suites band, then re-run codegen. Hand-edits are overwritten.
//
// This suite's assertions are OWNED by the codegen band: the band module
// carries them verbatim, this file is the emission, and hand edits here are
// overwritten on the next run. The rationale each assertion carries moved
// with it into the band.

import { afterEach, describe, expect, it } from "bun:test";
import { getSessionPickerUrl } from "./session-picker-url.ts";

describe("getSessionPickerUrl", () => {
	const orig = process.env.SESSION_PICKER_URL;
	afterEach(() => {
		if (orig === undefined) delete process.env.SESSION_PICKER_URL;
		else process.env.SESSION_PICKER_URL = orig;
	});

	it("defaults to the local daemon when no env is injected (SSH-login regression)", () => {
		delete process.env.SESSION_PICKER_URL;
		expect(getSessionPickerUrl()).toBe("http://127.0.0.1:3021");
	});

	it("honours SESSION_PICKER_URL as an optional override", () => {
		process.env.SESSION_PICKER_URL = "http://127.0.0.1:9999";
		expect(getSessionPickerUrl()).toBe("http://127.0.0.1:9999");
	});
});
