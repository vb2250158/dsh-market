/** Normalize emitted signature trivia without changing string or template contents. */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { transformSync } from 'esbuild'

for (const directory of ['lib', 'lib/types']) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !/\.(?:js|d\.ts)$/.test(entry.name)) continue
    const file = join(directory, entry.name)
    const before = readFileSync(file, 'utf8')
    let after
    if (entry.name.endsWith('.d.ts')) {
      // These compiler-emitted lines contain only a declaration signature, never a literal.
      after = before.replace(/^(export declare function [^\r\n`'"\/]+,)[ \t]+$/gm, '$1')
    } else {
      const emitted = text => transformSync(text, { loader: 'js', minify: true, legalComments: 'none' }).code
      const expected = emitted(before)
      after = before.replace(/[ \t]+$/gm, '')
      if (emitted(after) !== expected) {
        // Keep meaningful literal spaces; accept each remaining edit only when parsing agrees.
        after = before
        const candidates = [...before.matchAll(/[ \t]+$/gm)].reverse()
        for (const match of candidates) {
          const candidate = after.slice(0, match.index) + after.slice(match.index + match[0].length)
          if (emitted(candidate) === expected) after = candidate
        }
      }
    }
    if (before !== after) writeFileSync(file, after)
  }
}
