import { expect, test } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

test('Host normalization preserves multiline literal contents and declaration literal types', () => {
  const directory = mkdtempSync(join(tmpdir(), 'dshmarket-host-output-'))
  try {
    mkdirSync(join(directory, 'lib/types'), { recursive: true })
    const literal = 'export const value = `first  \nsecond\n`;  \n'
    const declarations = 'export type Value = `first  \nsecond`;\nexport declare function load(name: string,  \ncount: number): void;\n'
    writeFileSync(join(directory, 'lib/index.js'), literal)
    writeFileSync(join(directory, 'lib/types/index.d.ts'), declarations)
    const run = () => spawnSync(process.execPath, [resolve('scripts/normalize-host-artifacts.mjs')], { cwd: directory, encoding: 'utf8' })
    const first = run()
    expect(first.status, first.stderr).toBe(0)
    const js = readFileSync(join(directory, 'lib/index.js'), 'utf8')
    const types = readFileSync(join(directory, 'lib/types/index.d.ts'), 'utf8')
    expect(js).toBe('export const value = `first  \nsecond\n`;\n')
    expect(types).toBe('export type Value = `first  \nsecond`;\nexport declare function load(name: string,\ncount: number): void;\n')
    expect(run().status).toBe(0)
    expect(readFileSync(join(directory, 'lib/index.js'), 'utf8')).toBe(js)
    expect(readFileSync(join(directory, 'lib/types/index.d.ts'), 'utf8')).toBe(types)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
