import { ExitCode } from '@actions/core'
import { runner } from './runner'
import { log } from './util'

/** Runner */
;(async () => {
  try {
    await runner()
  } catch (error: unknown) {
    if (error instanceof Error) {
      process.exitCode = ExitCode.Failure
      log(error.message, 'error')
    }
  }
})()
