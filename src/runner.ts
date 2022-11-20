import { context, getOctokit } from '@actions/github'
import { inflect, log } from './util'
import { getInput } from '@actions/core'

export async function runner(): Promise<void> {
  log('Collecting token from input...', 'notice')
  const token = getInput('token', { required: true })
  log('Token collected.', 'info')

  log('Instantiating an Octokit client using token...', 'notice')
  const client = getOctokit(token)
  log('Octokit client is ready.', 'info')

  const { owner, repo, number } = context.issue
  log(`Looking up owner: ${owner}`, 'notice')
  log(`Looking up repository: ${repo}`, 'notice')
  log(`Looking up pull request number: ${number}`, 'notice')

  log(`Retrieving commits of PR #${number}...`, 'notice')

  const { data: commits, status } = await client.rest.pulls.listCommits({
    owner,
    repo,
    pull_number: context.issue.number,
  })

  if (status !== 200) {
    throw new Error(`Retrieving the commits of the pull request failed with HTTP ${status} status code.`)
  }

  log(`PR #${number} contains ${commits.length} ${await inflect(commits, 'commit.', 'commits.')}`, 'info')

  let mergeCommits = 0

  for (const { sha, parents } of commits) {
    const shortSha = sha.substring(0, 7)

    log(`Inspecting commit SHA: ${shortSha}`, 'notice')

    if (parents.length > 1) {
      log(`Commit SHA ${shortSha} is a merge commit!`, 'error')

      mergeCommits++
    }
  }

  if (mergeCommits > 0) {
    throw new Error('Merge commits were found in this pull request.')
  }

  log('No merge commits found in this pull request.', 'info')
}
