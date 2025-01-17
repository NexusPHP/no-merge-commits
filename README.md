# ![git-merge](.github/git-merge.svg) No Merge Commits Action

A Github Action to detect merge commits in pull requests and to prevent them from being merged.

## How this works

This action will query GitHub REST API to find all commits in a pull request. After that, this
will analyse the response data and check if there are merge commits. If there are any, this action
will error and exit.

## Usage

```yaml
name: Detect Merge Commits

on:
  pull_request:

permissions:
  contents: read
  pull-requests: read

jobs:
  test:
    name: Check for merge commits
    runs-on: ubuntu-24.04

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Run test
        uses: NexusPHP/no-merge-commits@v2.1.0
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

```

You'll also need to add a [required status check][1] rule for your
action to block merging if it detects merge commits.

[1]: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/managing-a-branch-protection-rule
