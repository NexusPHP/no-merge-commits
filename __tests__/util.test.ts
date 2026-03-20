import { afterEach, beforeEach, describe, expect, it as test, vi } from "vitest";
import { inflect } from "../src/util.js";

describe("nexusphp/no-merge-commits util", () => {
    beforeEach(() => {
        vi.spyOn(process.stdout, "write").mockImplementation(vi.fn<() => boolean>());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("inflect gives the correct noun", () => {
        expect(inflect(["a", "b"], "letter", "letters")).toBe("letters");
        expect(inflect(["a"], "letter", "letters")).toBe("letter");
    });
});
