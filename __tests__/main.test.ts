import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import * as github from '@actions/github'
import { runner } from '../src/runner'
import { EOL } from 'os'

describe('nexusphp/no-merge-commits main', () => {
  beforeEach(() => {
    process.env['INPUT_TOKEN'] = 'someToken'

    jest.spyOn(github.context, 'repo', 'get').mockImplementation(() => {
      return {
        owner: 'me',
        repo: 'awesome',
      }
    })
    jest.spyOn(github.context, 'issue', 'get').mockImplementation(() => {
      return {
        number: 1,
        owner: 'me',
        repo: 'awesome',
      }
    })
    jest.spyOn(process.stdout, 'write').mockImplementation(jest.fn<() => boolean>())
    jest.spyOn(process.stderr, 'write').mockImplementation(jest.fn<() => boolean>())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  function assertWritten(calls: string[]): void {
    expect(process.stdout.write).toHaveBeenCalledTimes(calls.length)

    for (let i = 0; i < calls.length; i++) {
      expect(process.stdout.write).toHaveBeenNthCalledWith(i + 1, calls[i] + EOL)
    }
  }

  it('fails when no token is provided', async () => {
    process.env['INPUT_TOKEN'] = ''

    await expect(runner()).rejects.toThrowError('Input required and not supplied: token')
    assertWritten(['\x1B[37m[NOTICE] Collecting token from input...\x1B[0m'])
  })

  it('fails when status code is not HTTP 200', async () => {
    jest.spyOn(github, 'getOctokit').mockImplementation(
      jest.fn<ReturnType<any>>((token: string) => {
        return {
          rest: {
            pulls: {
              listCommits: () => {
                return {
                  data: {},
                  status: 422,
                }
              },
            },
          },
        }
      })
    )

    await expect(runner()).rejects.toThrowError('Retrieving the commits of the pull request failed with HTTP 422 status code.')

    assertWritten([
      '\x1B[37m[NOTICE] Collecting token from input...\x1B[0m',
      '\x1B[32m[INFO] Token collected.\x1B[0m',
      '\x1B[37m[NOTICE] Instantiating an Octokit client using token...\x1B[0m',
      '\x1B[32m[INFO] Octokit client is ready.\x1B[0m',
      '\x1B[37m[NOTICE] Looking up owner: me\x1B[0m',
      '\x1B[37m[NOTICE] Looking up repository: awesome\x1B[0m',
      '\x1B[37m[NOTICE] Looking up pull request number: 1\x1B[0m',
      '\x1B[37m[NOTICE] Retrieving commits of PR #1...\x1B[0m',
    ])
  })

  it('succeeds checking no merge commits', async () => {
    jest.spyOn(github, 'getOctokit').mockImplementation(
      jest.fn<ReturnType<any>>((token: string) => {
        return {
          rest: {
            pulls: {
              listCommits: () => {
                return {
                  data: [
                    {
                      sha: '819a33b1698acae12d7d8ae9a9b9d2bcb70246b2',
                      html_url: 'https://some.place',
                      parents: [
                        {
                          sha: 'a6bb65ad37fe4fda1e1dfe2d5beeae91ead50bfe',
                          url: 'https://api.some.place',
                          html_url: 'https://some.place',
                        },
                      ],
                    },
                  ],
                  status: 200,
                }
              },
            },
          },
        }
      })
    )

    await expect(runner()).resolves.toBeUndefined()

    assertWritten([
      '\x1B[37m[NOTICE] Collecting token from input...\x1B[0m',
      '\x1B[32m[INFO] Token collected.\x1B[0m',
      '\x1B[37m[NOTICE] Instantiating an Octokit client using token...\x1B[0m',
      '\x1B[32m[INFO] Octokit client is ready.\x1B[0m',
      '\x1B[37m[NOTICE] Looking up owner: me\x1B[0m',
      '\x1B[37m[NOTICE] Looking up repository: awesome\x1B[0m',
      '\x1B[37m[NOTICE] Looking up pull request number: 1\x1B[0m',
      '\x1B[37m[NOTICE] Retrieving commits of PR #1...\x1B[0m',
      '\x1B[32m[INFO] PR #1 contains 1 commit.\x1B[0m',
      '\x1B[37m[NOTICE] Inspecting commit SHA: 819a33b\x1B[0m',
      '\x1B[32m[INFO] No merge commits found in this pull request.\x1B[0m',
    ])
  })

  it('fails when a merge commit is detected', async () => {
    jest.spyOn(github, 'getOctokit').mockImplementation(
      jest.fn<ReturnType<any>>((token: string) => {
        return {
          rest: {
            pulls: {
              listCommits: () => {
                return {
                  data: [
                    {
                      sha: '819a33b1698acae12d7d8ae9a9b9d2bcb70246b2',
                      html_url: 'https://some.place',
                      parents: [
                        {
                          sha: 'a6bb65ad37fe4fda1e1dfe2d5beeae91ead50bfe',
                          url: 'https://api.some.place',
                          html_url: 'https://some.place',
                        },
                        {
                          sha: 'c75b41ded1540564f1b9340acf5c909288a3b466',
                          url: 'https://api.some.place',
                          html_url: 'https://some.place',
                        },
                      ],
                    },
                  ],
                  status: 200,
                }
              },
            },
          },
        }
      })
    )

    await expect(runner()).rejects.toThrowError('Merge commits were found in this pull request.')

    assertWritten([
      '\x1B[37m[NOTICE] Collecting token from input...\x1B[0m',
      '\x1B[32m[INFO] Token collected.\x1B[0m',
      '\x1B[37m[NOTICE] Instantiating an Octokit client using token...\x1B[0m',
      '\x1B[32m[INFO] Octokit client is ready.\x1B[0m',
      '\x1B[37m[NOTICE] Looking up owner: me\x1B[0m',
      '\x1B[37m[NOTICE] Looking up repository: awesome\x1B[0m',
      '\x1B[37m[NOTICE] Looking up pull request number: 1\x1B[0m',
      '\x1B[37m[NOTICE] Retrieving commits of PR #1...\x1B[0m',
      '\x1B[32m[INFO] PR #1 contains 1 commit.\x1B[0m',
      '\x1B[37m[NOTICE] Inspecting commit SHA: 819a33b\x1B[0m',
      '\x1B[31m[ERROR] Commit SHA 819a33b is a merge commit!\x1B[0m',
    ])
  })
})
