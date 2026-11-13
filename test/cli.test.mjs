import { afterEach, beforeEach, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const bin = join(import.meta.dir, '..', 'bin', 'platform-qa.mjs')
let tmp

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'pqa-cli-'))
})

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
})

const run = (...args) =>
  spawnSync(process.execPath, [bin, ...args], {
    encoding: 'utf8',
    env: { ...process.env, PLATFORM_QA_HOME: tmp },
  })

test('--version prints the package version', () => {
  const pkg = JSON.parse(readFileSync(join(import.meta.dir, '..', 'package.json'), 'utf8'))

  const result = run('--version')

  expect(result.status).toBe(0)
  expect(result.stdout.trim()).toBe(pkg.version)
})

test('install --dry-run lists targets and writes nothing', () => {
  const result = run('install', '--dry-run')

  expect(result.status).toBe(0)
  expect(result.stdout).toContain('platform-qa')
  expect(existsSync(join(tmp, '.agents'))).toBe(false)
})

test('install then uninstall round-trips', () => {
  expect(run('install').status).toBe(0)
  expect(existsSync(join(tmp, '.agents/skills/platform-qa/SKILL.md'))).toBe(true)

  expect(run('uninstall').status).toBe(0)
  expect(existsSync(join(tmp, '.agents/skills/platform-qa'))).toBe(false)
})

test('--help prints usage and exits zero', () => {
  const result = run('--help')

  expect(result.status).toBe(0)
  expect(result.stdout).toContain('Usage')
})

test('unknown flag is rejected instead of doing a real install', () => {
  const result = run('install', '--dryrun')

  expect(result.status).toBe(1)
  expect(result.stderr).toContain('--dryrun')
  expect(existsSync(join(tmp, '.agents'))).toBe(false)
})

test('dry run describes backups as future actions', () => {
  run('install')
  writeFileSync(join(tmp, '.agents/skills/platform-qa/SKILL.md'), 'edited')

  const result = run('install', '--dry-run')

  expect(result.stdout).toContain('Would back up')
  expect(result.stdout).not.toContain('Backed up')
})

test('unknown command exits non-zero with usage', () => {
  const result = run('explode')

  expect(result.status).toBe(1)
  expect(result.stderr).toContain('Usage')
})
