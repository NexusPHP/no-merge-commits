import { EOL } from "os";
import { afterEach, beforeEach, describe, expect, it as test, vi } from "vitest";
import { color, inflect, log } from "../src/util.js";

describe("nexusphp/no-merge-commits util", () => {
    beforeEach(() => {
        vi.spyOn(process.stdout, "write").mockImplementation(vi.fn<() => boolean>());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("color gives the correct type", () => {
        expect(color("")).toBe("\x1B[32m");
        expect(color("info")).toBe("\x1B[32m");
        expect(color("error")).toBe("\x1B[31m");
        expect(color("reset")).toBe("\x1B[0m");
        expect(color("notice")).toBe("\x1B[37m");
        expect(color("warning")).toBe("\x1B[33m");
        expect(color("other")).toBe("\x1B[32m");
    });

    test("log gives correct log message", () => {
        log("Notice", "info");

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(process.stdout.write).toHaveBeenNthCalledWith(1, `\x1B[32m[INFO] Notice\x1B[0m${EOL}`);
    });

    test("inflect gives the correct noun", () => {
        expect(inflect(["a", "b"], "letter", "letters")).toBe("letters");
        expect(inflect(["a"], "letter", "letters")).toBe("letter");
    });
});
