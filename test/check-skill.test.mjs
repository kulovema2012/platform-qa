import { afterEach, beforeEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { checkFiles, checkSkill } from '../scripts/check-skill.mjs'

let dir

const write = (rel, text) => {
  const path = join(dir, rel)
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, text)
}

const validSkill = `---
name: platform-qa
description: Tests apps locally.
---

# platform-qa

See [scoring](references/scoring.md).
`

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'pqa-lint-'))
  write('SKILL.md', validSkill)
  write('references/scoring.md', '# Scoring\n')
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

test('valid skill has no errors', () => {
  const result = checkSkill(dir)

  expect(result.errors).toEqual([])
})

test('reports a referenced file that does not exist', () => {
  write('SKILL.md', validSkill + '\nAlso [missing](references/missing.md).\n')

  const result = checkSkill(dir)

  expect(result.errors.join('\n')).toContain('references/missing.md')
})

test('reports a Windows user path with file and line', () => {
  write('references/scoring.md', '# Scoring\n\nSaved at C:\\Users\\someone\\notes\n') // platform-qa-allow

  const result = checkSkill(dir)

  expect(result.errors.join('\n')).toMatch(/references[\\/]scoring\.md:3/)
})

test('reports an email address', () => {
  write('references/scoring.md', 'Contact person@acme-mail.io for help\n') // platform-qa-allow

  const result = checkSkill(dir)

  expect(result.errors.join('\n')).toContain('email')
})

test('allows emails at reserved example domains', () => {
  write('references/scoring.md', 'Use alice@example.com, Alice@Example.COM or bob@test.example.org\n')

  const result = checkSkill(dir)

  expect(result.errors).toEqual([])
})

test('reports a missing or wrong skill name in frontmatter', () => {
  write('SKILL.md', validSkill.replace('name: platform-qa', 'name: other'))

  const result = checkSkill(dir)

  expect(result.errors.join('\n')).toContain('name')
})

test('reports a description over 1024 characters', () => {
  write('SKILL.md', validSkill.replace('Tests apps locally.', 'x'.repeat(1025)))

  const result = checkSkill(dir)

  expect(result.errors.join('\n')).toContain('description')
})

test('reports names listed in an uncommitted private patterns file', () => {
  write('references/scoring.md', 'Tested on Acme Ledger last week\n')
  const patternsFile = join(dir, '..', `${Date.now()}-patterns.txt`)
  writeFileSync(patternsFile, '# private names\nacme ledger\n')

  const result = checkSkill(dir, { privatePatternsFile: patternsFile })

  rmSync(patternsFile)
  expect(result.errors.join('\n')).toMatch(/scoring\.md:1: private name/)
})

test('uses the default private patterns file when no file is named', () => {
  write('references/scoring.md', 'Tested on Acme Ledger last week\n') // platform-qa-allow
  const defaultFile = join(dir, '..', `${Date.now()}-default.txt`)
  writeFileSync(defaultFile, 'acme ledger\n')

  const result = checkSkill(dir, { privatePatternsFile: undefined, defaultPatternsFile: defaultFile })

  rmSync(defaultFile)
  expect(result.errors.join('\n')).toContain('private name')
})

test('warns when no private patterns are loaded', () => {
  const result = checkSkill(dir, { privatePatternsFile: undefined, defaultPatternsFile: join(dir, 'missing.txt') })

  expect(result.warnings.join('\n')).toContain('private-name scan skipped')
})

test('reports a private pattern that is not a valid regex', () => {
  const patternsFile = join(dir, '..', `${Date.now()}-bad.txt`)
  writeFileSync(patternsFile, 'acme(\n')

  const result = checkSkill(dir, { privatePatternsFile: patternsFile })

  rmSync(patternsFile)
  expect(result.errors.join('\n')).toContain('invalid private pattern')
})

test.each([
  // Built from pieces so the repository never contains a key-shaped string.
  ['Anthropic key', 'key ' + ['sk', 'ant', 'api03', 'abcdefghijklmnopqrstuvwxyz0123'].join('-')],
  ['OpenAI project key', 'key ' + ['sk', 'proj', 'abcdefghijklmnopqrstuvwxyz0123'].join('-')],
  ['GitHub fine-grained token', ['github', 'pat', '11ABCDEFG0123456789', 'abcdefghijklmnop'].join('_')],
  ['Stripe live key', ['sk', 'live', 'abcdefghijklmnopqrstuvwx'].join('_')],
  ['AWS access key', 'AK' + 'IA' + 'ABCDEFGHIJKLMNOP'],
  ['Slack token', ['xo' + 'xb', '1234567890', 'abcdefghij'].join('-')],
  ['Google API key', 'AI' + 'za' + 'SyA-abcdefghijklmnopqrstuvwxyz01234'],
])('reports a %s', (_label, line) => {
  write('references/scoring.md', `${line}\n`)

  const result = checkSkill(dir)

  expect(result.errors.join('\n')).toContain('secret-looking token')
})

test('reports a POSIX user path with a capital drive letter', () => {
  write('references/scoring.md', 'see /C/Users/someone/x\n') // platform-qa-allow

  const result = checkSkill(dir)

  expect(result.errors.join('\n')).toContain('user path')
})

test('skips lines marked platform-qa-allow', () => {
  write('references/scoring.md', 'fixture C:\\Users\\someone // platform-qa-allow\n')

  const result = checkSkill(dir)

  expect(result.errors).toEqual([])
})

test('checkFiles scans any listed file in a repository', () => {
  write('README.md', 'mail me at someone@acme-mail.io\n') // platform-qa-allow

  const result = checkFiles(dir, ['README.md'])

  expect(result.errors.join('\n')).toMatch(/README\.md:1: email/)
})

test('ignores links to web pages and in-page anchors', () => {
  write('SKILL.md', validSkill + '\n[site](https://example.com) and [top](#platform-qa)\n')

  const result = checkSkill(dir)

  expect(result.errors).toEqual([])
})
