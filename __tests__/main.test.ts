import { setFailed } from "@actions/core";
import { getOctokit } from "@actions/github";
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
            return process.env["INPUT_TOKEN"] ?? "";
        }),
        setFailed: vi.fn(),
    };
});

const mockGetOctokit = vi.mocked(getOctokit);
const mockSetFailed = vi.mocked(setFailed);

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
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(process.stdout.write).toHaveBeenCalledTimes(calls.length);

        for (let i = 0; i < calls.length; i++) {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(process.stdout.write).toHaveBeenNthCalledWith(i + 1, calls[i] + EOL);
        }
    }

    it("fails when no token is provided", async () => {
        process.env["INPUT_TOKEN"] = "";

        await expect(runner()).rejects.toThrow("Input required and not supplied: token");
        assertWritten(["Collecting token from input..."]);
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
        } as unknown as ReturnType<typeof getOctokit>);

        await expect(runner()).resolves.toBeUndefined();

        assertWritten([
            "Collecting token from input...",
            "Token collected.",
            "Instantiating an Octokit client using token...",
            "Octokit client is ready.",
            "::debug::Looking up owner: me",
            "::debug::Looking up repository: awesome",
            "::debug::Looking up pull request number: 1",
            "Retrieving commits of PR #1...",
            "HTTP Status: 200",
            "PR #1 contains 1 commit.",
            "Inspecting commit SHA: 819a33b",
            "No merge commits found in this pull request.",
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
        } as unknown as ReturnType<typeof getOctokit>);

        await expect(runner()).resolves.toBeUndefined();
        expect(mockSetFailed).toHaveBeenCalledWith("1 merge commit was found in this pull request.");

        assertWritten([
            "Collecting token from input...",
            "Token collected.",
            "Instantiating an Octokit client using token...",
            "Octokit client is ready.",
            "::debug::Looking up owner: me",
            "::debug::Looking up repository: awesome",
            "::debug::Looking up pull request number: 1",
            "Retrieving commits of PR #1...",
            "HTTP Status: 200",
            "PR #1 contains 1 commit.",
            "Inspecting commit SHA: 819a33b",
            "::error::Commit SHA 819a33b is a merge commit!",
        ]);
    });
});
