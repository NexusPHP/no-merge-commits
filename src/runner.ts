import { getInput, setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { inflect, log } from "./util.js";

const MERGE_COMMIT_PARENT_COUNT = 2;

export async function runner(): Promise<void> {
    log("Collecting token from input...", "notice");
    const token = getInput("token", { required: true });
    log("Token collected.", "info");

    log("Instantiating an Octokit client using token...", "notice");
    const client = getOctokit(token);
    log("Octokit client is ready.", "info");

    const { owner, repo, number: pull_number } = context.issue;
    log(`Looking up owner: ${owner}`, "debug");
    log(`Looking up repository: ${repo}`, "debug");
    log(`Looking up pull request number: ${pull_number}`, "debug");

    log(`Retrieving commits of PR #${pull_number}...`, "notice");

    const { data: commits, status: httpStatus } = await client.rest.pulls.listCommits({
        owner,
        repo,
        pull_number,
    });

    if (httpStatus !== 200) {
        setFailed(`Failed to retrieve commits: HTTP ${String(httpStatus)}`);

        return;
    }

    log(`HTTP Status: ${String(httpStatus)}`, "info");
    log(`PR #${pull_number} contains ${commits.length} ${inflect(commits, "commit.", "commits.")}`, "info");

    let mergeCommits = 0;

    for (const { sha, parents } of commits) {
        const shortSha = sha.substring(0, 7);

        log(`Inspecting commit SHA: ${shortSha}`, "notice");

        if (parents.length >= MERGE_COMMIT_PARENT_COUNT) {
            log(`Commit SHA ${shortSha} is a merge commit!`, "error");

            mergeCommits++;
        }
    }

    if (mergeCommits > 0) {
        const message =
            mergeCommits === 1
                ? "1 merge commit was found in this pull request."
                : `${mergeCommits} merge commits were found in this pull request.`;
        setFailed(message);

        return;
    }

    log("No merge commits found in this pull request.", "info");
}
