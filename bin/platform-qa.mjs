#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { install, uninstall } from '../lib/install.mjs'

const USAGE = `Usage: platform-qa <command>

Commands:
  install [--dry-run]   Install the platform-qa skill into ~/.agents/skills (linked into ~/.claude/skills)
  uninstall             Remove the installed skill (changed copies are backed up first)
  --version             Print the version
  --help                Show this help

Backups of changed copies go to ~/.agents/platform-qa/backups/.`

const ALLOWED_FLAGS = { install: ['--dry-run'], uninstall: [] }

const pkgPath = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'package.json')
const home = process.env.PLATFORM_QA_HOME || homedir()
const [command, ...flags] = process.argv.slice(2)

async function main() {
  if (command === '--version' || command === '-v') {
    console.log(JSON.parse(readFileSync(pkgPath, 'utf8')).version)
    return 0
  }
  if (command === '--help' || command === '-h' || command === 'help') {
    console.log(USAGE)
    return 0
  }
  if (!(command in ALLOWED_FLAGS)) {
    console.error(USAGE)
    return 1
  }
  const unknown = flags.filter((flag) => !ALLOWED_FLAGS[command].includes(flag))
  if (unknown.length) {
    console.error(`platform-qa: unknown option ${unknown.join(', ')}\n\n${USAGE}`)
    return 1
  }

  if (command === 'install') {
    const dryRun = flags.includes('--dry-run')
    const result = await install({ home, dryRun })
    const verb = dryRun ? 'Would install' : 'Installed'
    for (const path of result.installed) console.log(`${verb}: ${path}`)
    for (const path of result.skipped) console.log(`  (same folder as the first target, nothing extra to do: ${path})`)
    for (const path of result.backedUp)
      console.log(`${dryRun ? 'Would back up' : 'Backed up'} a changed copy to: ${path}`)
    if (result.mode === 'copy') console.log('Links were not allowed here, so the skill was copied into each folder instead.')
    return 0
  }

  const result = await uninstall({ home })
  if (result.removed.length === 0) console.log('platform-qa is not installed.')
  for (const path of result.removed) console.log(`Removed: ${path}`)
  for (const path of result.backedUp) console.log(`Backed up a changed copy to: ${path}`)
  return 0
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(`platform-qa: ${error.message}`)
    process.exit(1)
  },
)
