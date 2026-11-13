import { afterEach, beforeEach, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DEFAULT_SOURCE, install, uninstall } from '../lib/install.mjs'

let tmp

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'pqa-'))
})

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
})

const skillDir = (target) => join(tmp, target, 'platform-qa')
const skillFile = (target) => join(skillDir(target), 'SKILL.md')
const backupsRoot = () => join(tmp, '.agents', 'platform-qa', 'backups')

// A source tree we can change, to simulate a new release.
function makeSource(text = 'v1') {
  const src = join(tmp, 'src', 'platform-qa')
  rmSync(src, { recursive: true, force: true })
  mkdirSync(src, { recursive: true })
  writeFileSync(join(src, 'SKILL.md'), `---\nname: platform-qa\n---\n${text}\n`)
  return src
}

test('installs skill into .agents/skills and makes it visible in .claude/skills', async () => {
  const result = await install({ home: tmp })

  expect(existsSync(skillFile('.agents/skills'))).toBe(true)
  expect(existsSync(skillFile('.claude/skills'))).toBe(true)
  expect(result.installed).toHaveLength(2)
})

test('backs up an edited copy outside the skills folders before replacing it', async () => {
  await install({ home: tmp })
  writeFileSync(skillFile('.agents/skills'), 'local edit')

  const result = await install({ home: tmp, now: () => new Date('2026-11-13T00:00:00.123Z') })

  expect(result.backedUp).toHaveLength(1)
  expect(result.backedUp[0].startsWith(backupsRoot())).toBe(true)
  expect(readFileSync(join(result.backedUp[0], 'SKILL.md'), 'utf8')).toBe('local edit')
  expect(readdirSync(join(tmp, '.agents/skills'))).toEqual(['platform-qa'])
})

test('upgrading an unedited install makes no backup', async () => {
  await install({ home: tmp, source: makeSource('v1') })

  const result = await install({ home: tmp, source: makeSource('v2') })

  expect(result.backedUp).toEqual([])
  expect(readFileSync(skillFile('.agents/skills'), 'utf8')).toContain('v2')
})

test('treats a copy without a manifest that differs from the source as edited', async () => {
  mkdirSync(skillDir('.agents/skills'), { recursive: true })
  writeFileSync(skillFile('.agents/skills'), 'hand-made')

  const result = await install({ home: tmp })

  expect(result.backedUp).toHaveLength(1)
})

test('falls back to copying when links cannot be created', async () => {
  const failingLink = async () => {
    throw Object.assign(new Error('EPERM: operation not permitted'), { code: 'EPERM' })
  }

  const result = await install({ home: tmp, link: failingLink })

  expect(result.mode).toBe('copy')
  expect(existsSync(skillFile('.claude/skills'))).toBe(true)
})

test('skips a target whose skills folder is the same folder as the first one', async () => {
  mkdirSync(join(tmp, '.agents/skills'), { recursive: true })
  mkdirSync(join(tmp, '.claude'), { recursive: true })
  symlinkSync(join(tmp, '.agents/skills'), join(tmp, '.claude/skills'), process.platform === 'win32' ? 'junction' : 'dir')

  const result = await install({ home: tmp })

  expect(existsSync(skillFile('.agents/skills'))).toBe(true)
  expect(existsSync(skillFile('.claude/skills'))).toBe(true)
  expect(result.skipped).toHaveLength(1)
})

test('dry run writes nothing', async () => {
  const result = await install({ home: tmp, dryRun: true })

  expect(readdirSync(tmp)).toEqual([])
  expect(result.installed).toHaveLength(2)
})

test('uninstall removes installed skill but leaves other skills alone', async () => {
  mkdirSync(join(tmp, '.agents/skills/other-skill'), { recursive: true })
  await install({ home: tmp })

  const result = await uninstall({ home: tmp })

  expect(existsSync(skillDir('.agents/skills'))).toBe(false)
  expect(existsSync(skillDir('.claude/skills'))).toBe(false)
  expect(existsSync(join(tmp, '.agents/skills/other-skill'))).toBe(true)
  expect(result.removed).toHaveLength(2)
})

test('uninstall backs up an edited copy instead of deleting it', async () => {
  await install({ home: tmp, link: async () => { throw Object.assign(new Error('no'), { code: 'EPERM' }) } })
  writeFileSync(join(skillDir('.claude/skills'), 'MY-NOTES.md'), 'mine')

  const result = await uninstall({ home: tmp })

  expect(existsSync(skillDir('.claude/skills'))).toBe(false)
  expect(result.backedUp).toHaveLength(1)
  expect(readFileSync(join(result.backedUp[0], 'MY-NOTES.md'), 'utf8')).toBe('mine')
})

test('two installs in the same second do not collide on backup names', async () => {
  const now = () => new Date('2026-11-13T00:00:00.000Z')
  await install({ home: tmp })
  writeFileSync(skillFile('.agents/skills'), 'edit 1')
  await install({ home: tmp, now })
  writeFileSync(skillFile('.agents/skills'), 'edit 2')

  const result = await install({ home: tmp, now })

  expect(result.backedUp).toHaveLength(1)
  expect(readdirSync(backupsRoot())).toHaveLength(2)
})

test('reinstalling the same version makes no backup', async () => {
  await install({ home: tmp })

  const result = await install({ home: tmp })

  expect(result.backedUp).toEqual([])
  expect(readdirSync(join(tmp, '.agents/skills'))).toEqual(['platform-qa'])
})

test('the real skill source ships a SKILL.md', () => {
  expect(existsSync(join(DEFAULT_SOURCE, 'SKILL.md'))).toBe(true)
})
