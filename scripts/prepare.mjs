/** Use shipped artifacts for pinned Git installs; source checkouts can still build. */
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const manifest = JSON.parse(readFileSync('package.json', 'utf8'))
const targets = []
const collect = (value) => {
  if (typeof value === 'string') {
    if (value.startsWith('./lib/') || value.startsWith('./client/')) targets.push(value)
  } else {
    for (const entry of Object.values(value)) collect(entry)
  }
}
collect(manifest.exports)

if (targets.every((target) => existsSync(target))) {
  console.log('prepare: using shipped Host and Client artifacts')
} else {
  const npmCli = process.env.npm_execpath
  if (!npmCli) throw new Error('Missing build artifacts; run npm run build before direct preparation')
  const result = spawnSync(process.execPath, [npmCli, 'run', 'build'], { stdio: 'inherit' })
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
}
