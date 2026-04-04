import { debug, error, getInput, info, setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { inflect } from "./util.js";

const MERGE_COMMIT_PARENT_COUNT = 2;

export async function runner(): Promise<void> {
    info("Collecting token from input...");
    const token = getInput("token", { required: true });
    info("Token collected.");

    info("Instantiating an Octokit client using token...");
    const client = getOctokit(token);
    info("Octokit client is ready.");

    const { owner, repo, number: pull_number } = context.issue;
    debug(`Looking up owner: ${owner}`);
    debug(`Looking up repository: ${repo}`);
    debug(`Looking up pull request number: ${pull_number}`);

    info(`Retrieving commits of PR #${pull_number}...`);

    const { data: commits, status: httpStatus } = await client.rest.pulls.listCommits({
        owner,
        repo,
        pull_number,
    });

    if (httpStatus !== 200) {
        setFailed(`Failed to retrieve commits: HTTP ${String(httpStatus)}`);

        return;
    }

    info("HTTP Status: 200");
    info(`PR #${pull_number} contains ${commits.length} ${inflect(commits, "commit.", "commits.")}`);

    let mergeCommits = 0;

    for (const { sha, parents } of commits) {
        const shortSha = sha.substring(0, 7);

        info(`Inspecting commit SHA: ${shortSha}`);

        if (parents.length >= MERGE_COMMIT_PARENT_COUNT) {
            error(`Commit SHA ${shortSha} is a merge commit!`);

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

    info("No merge commits found in this pull request.");
}
