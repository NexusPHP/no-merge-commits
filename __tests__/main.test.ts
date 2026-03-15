import * as github from "@actions/github";
import { EOL } from "os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runner } from "../src/runner.js";

vi.mock("@actions/github", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@actions/github")>();
    return {
        ...actual,
        context: {
            issue: {
                number: 1,
                owner: "me",
                repo: "awesome",
            },
        },
        getOctokit: vi.fn(),
    };
});

vi.mock("@actions/core", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@actions/core")>();
    return {
        ...actual,
        getInput: vi.fn((name: string) => {
            if (name === "token" && !process.env["INPUT_TOKEN"]) {
                throw new Error("Input required and not supplied: token");
            }
            return process.env["INPUT_TOKEN"] || "";
        }),
    };
});

const mockGetOctokit = vi.mocked(github.getOctokit);

describe("nexusphp/no-merge-commits main", () => {
    beforeEach(() => {
        process.env["INPUT_TOKEN"] = "someToken";
        vi.spyOn(process.stdout, "write").mockImplementation(vi.fn<() => boolean>());
        vi.spyOn(process.stderr, "write").mockImplementation(vi.fn<() => boolean>());
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete process.env["INPUT_TOKEN"];
    });

    function assertWritten(calls: string[]): void {
        expect(process.stdout.write).toHaveBeenCalledTimes(calls.length);

        for (let i = 0; i < calls.length; i++) {
            expect(process.stdout.write).toHaveBeenNthCalledWith(i + 1, calls[i] + EOL);
        }
    }

    it("fails when no token is provided", async () => {
        process.env["INPUT_TOKEN"] = "";

        await expect(runner()).rejects.toThrowError("Input required and not supplied: token");
        assertWritten(["\x1B[37m[NOTICE] Collecting token from input...\x1B[0m"]);
    });

    it("succeeds checking no merge commits", async () => {
        mockGetOctokit.mockReturnValue({
            rest: {
                pulls: {
                    listCommits: () => {
                        return {
                            data: [
                                {
                                    sha: "819a33b1698acae12d7d8ae9a9b9d2bcb70246b2",
                                    html_url: "https://some.place",
                                    parents: [
                                        {
                                            sha: "a6bb65ad37fe4fda1e1dfe2d5beeae91ead50bfe",
                                            url: "https://api.some.place",
                                            html_url: "https://some.place",
                                        },
                                    ],
                                },
                            ],
                            status: 200,
                        };
                    },
                },
            },
        } as any);

        await expect(runner()).resolves.toBeUndefined();

        assertWritten([
            "\x1B[37m[NOTICE] Collecting token from input...\x1B[0m",
            "\x1B[32m[INFO] Token collected.\x1B[0m",
            "\x1B[37m[NOTICE] Instantiating an Octokit client using token...\x1B[0m",
            "\x1B[32m[INFO] Octokit client is ready.\x1B[0m",
            "::debug::\x1B[37m[DEBUG] Looking up owner: me\x1B[0m",
            "::debug::\x1B[37m[DEBUG] Looking up repository: awesome\x1B[0m",
            "::debug::\x1B[37m[DEBUG] Looking up pull request number: 1\x1B[0m",
            "\x1B[37m[NOTICE] Retrieving commits of PR #1...\x1B[0m",
            "\x1B[32m[INFO] HTTP Status: 200\x1B[0m",
            "\x1B[32m[INFO] PR #1 contains 1 commit.\x1B[0m",
            "\x1B[37m[NOTICE] Inspecting commit SHA: 819a33b\x1B[0m",
            "\x1B[32m[INFO] No merge commits found in this pull request.\x1B[0m",
        ]);
    });

    it("fails when a merge commit is detected", async () => {
        mockGetOctokit.mockReturnValue({
            rest: {
                pulls: {
                    listCommits: () => {
                        return {
                            data: [
                                {
                                    sha: "819a33b1698acae12d7d8ae9a9b9d2bcb70246b2",
                                    html_url: "https://some.place",
                                    parents: [
                                        {
                                            sha: "a6bb65ad37fe4fda1e1dfe2d5beeae91ead50bfe",
                                            url: "https://api.some.place",
                                            html_url: "https://some.place",
                                        },
                                        {
                                            sha: "c75b41ded1540564f1b9340acf5c909288a3b466",
                                            url: "https://api.some.place",
                                            html_url: "https://some.place",
                                        },
                                    ],
                                },
                            ],
                            status: 200,
                        };
                    },
                },
            },
        } as any);

        await expect(runner()).rejects.toThrowError("Merge commits were found in this pull request.");

        assertWritten([
            "\x1B[37m[NOTICE] Collecting token from input...\x1B[0m",
            "\x1B[32m[INFO] Token collected.\x1B[0m",
            "\x1B[37m[NOTICE] Instantiating an Octokit client using token...\x1B[0m",
            "\x1B[32m[INFO] Octokit client is ready.\x1B[0m",
            "::debug::\x1B[37m[DEBUG] Looking up owner: me\x1B[0m",
            "::debug::\x1B[37m[DEBUG] Looking up repository: awesome\x1B[0m",
            "::debug::\x1B[37m[DEBUG] Looking up pull request number: 1\x1B[0m",
            "\x1B[37m[NOTICE] Retrieving commits of PR #1...\x1B[0m",
            "\x1B[32m[INFO] HTTP Status: 200\x1B[0m",
            "\x1B[32m[INFO] PR #1 contains 1 commit.\x1B[0m",
            "\x1B[37m[NOTICE] Inspecting commit SHA: 819a33b\x1B[0m",
            "::error::\x1B[31m[ERROR] Commit SHA 819a33b is a merge commit!\x1B[0m",
        ]);
    });
});
