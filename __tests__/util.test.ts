import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'
import { EOL } from 'os'
import { color, log, inflect } from '../src/util'

describe('nexusphp/no-merge-commits util', () => {
  beforeEach(() => {
    jest.spyOn(process.stdout, 'write').mockImplementation(jest.fn<() => boolean>())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('color gives the correct type', async () => {
    await expect(color('')).resolves.toBe('\x1B[32m')
    await expect(color('info')).resolves.toBe('\x1B[32m')
    await expect(color('error')).resolves.toBe('\x1B[31m')
    await expect(color('reset')).resolves.toBe('\x1B[0m')
    await expect(color('notice')).resolves.toBe('\x1B[37m')
    await expect(color('warning')).resolves.toBe('\x1B[33m')
    await expect(color('other')).resolves.toBe('\x1B[32m')
  })

  test('log gives correct log message', async () => {
    await log('Notice', 'info')

    expect(process.stdout.write).toHaveBeenNthCalledWith(1, `\x1B[32m[INFO] Notice\x1B[0m${EOL}`)
  })

  test('inflect gives the correct noun', async () => {
    await expect(inflect(['a', 'b'], 'letter', 'letters')).resolves.toBe('letters')
    await expect(inflect(['a'], 'letter', 'letters')).resolves.toBe('letter')
  })
})
