import { afterEach, expect, test } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const directories: string[] = []
afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

function prepareFixture(complete: boolean, buildExit: number) {
  const directory = mkdtempSync(join(tmpdir(), 'dshmarket-prepare-'))
  directories.push(directory)
  mkdirSync(join(directory, 'lib'))
  mkdirSync(join(directory, 'client'))
  writeFileSync(join(directory, 'package.json'), JSON.stringify({ exports: { '.': './lib/index.js', './client': './client/client.js' } }))
  writeFileSync(join(directory, 'lib/index.js'), '')
  if (complete) writeFileSync(join(directory, 'client/client.js'), '')
  const cli = join(directory, 'npm-fixture.cjs')
  writeFileSync(cli, `console.log('source build invoked'); process.exit(${buildExit})`)
  return spawnSync(process.execPath, [resolve('scripts/prepare.mjs')], {
    cwd: directory,
    // Windows treats environment keys without case; remove an inherited NPM_EXECPATH too.
    env: { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toLowerCase() !== 'npm_execpath')), npm_execpath: cli },
    encoding: 'utf8',
  })
}

test('a complete pinned package skips the source build', () => {
  const result = prepareFixture(true, 9)
  expect(result.status, result.stderr).toBe(0)
  expect(result.stdout).toContain('using shipped Host and Client artifacts')
  expect(result.stdout).not.toContain('source build invoked')
})

test('missing Client artifacts invoke the source build', () => {
  const result = prepareFixture(false, 0)
  expect(result.status, result.stderr).toBe(0)
  expect(result.stdout).toContain('source build invoked')
})

test('a failed source build remains an installation failure', () => {
  const result = prepareFixture(false, 7)
  expect(result.status, result.stderr).toBe(7)
})
