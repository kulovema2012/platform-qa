#!/usr/bin/env node
// Checks files before publishing: the skill's structure and references, and
// private data that must never reach a public repository.
//
//   node scripts/check-skill.mjs [skill dir]   check the skill folder (default skill/platform-qa)
//   node scripts/check-skill.mjs --repo        scan every tracked and untracked, non-ignored file
//
// Generic private-data patterns live here. Personal names (accounts, private
// project names) must not be committed, so extra patterns are read from the
// file named by PLATFORM_QA_PRIVATE_PATTERNS, or ~/.agents/platform-qa/private-patterns.txt
// (one case-insensitive regex per line, # comments). A line containing
// "platform-qa-allow" is skipped (for test fixtures).

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const MAX_SKILL_LINES = 500
const WARN_FILE_LINES = 400
const MAX_DESCRIPTION = 1024
const ALLOW_MARKER = 'platform-qa-allow'
export const DEFAULT_PATTERNS_FILE = join(homedir(), '.agents', 'platform-qa', 'private-patterns.txt')

const GENERIC_PATTERNS = [
  { label: 'Windows user path', regex: /[A-Za-z]:\\+Users\\+/i },
  { label: 'POSIX user path', regex: /\/(?:[a-z]\/Users|home|Users)\/[A-Za-z]/i },
  // Reserved example domains (RFC 2606) are allowed for sample data.
  {
    label: 'email address',
    regex: /[A-Za-z0-9._%+-]+@(?![A-Za-z0-9.-]*\bexample\.(?:com|org|net)\b)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/i,
  },
  {
    label: 'secret-looking token',
    regex: new RegExp(
      [
        String.raw`\bsk-(?:[A-Za-z0-9]+-)*[A-Za-z0-9_]{20,}`, // OpenAI, Anthropic and similar
        String.raw`\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}`,
        String.raw`\bgithub_pat_[A-Za-z0-9_]{20,}`,
        String.raw`\bnpm_[A-Za-z0-9]{20,}`,
        String.raw`\b(?:sk|rk|pk)_live_[A-Za-z0-9]{16,}`,
        String.raw`\bAKIA[0-9A-Z]{16}\b`,
        String.raw`\bxox[abprs]-[A-Za-z0-9-]{10,}`,
        String.raw`\bAIza[0-9A-Za-z_-]{30,}`,
      ].join('|'),
    ),
  },
]

function loadPrivatePatterns(file, errors) {
  if (!file || !existsSync(file)) return null
  const patterns = []
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.trim())) {
    if (!line || line.startsWith('#')) continue
    try {
      patterns.push({ label: 'private name', regex: new RegExp(line, 'i') })
    } catch {
      errors.push(`invalid private pattern in patterns file: ${line}`)
    }
  }
  return patterns
}

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? listFiles(path) : [path]
  })
}

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return null
  const fields = {}
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/)
    if (kv) fields[kv[1]] = kv[2].trim()
  }
  return fields
}

function referencedPaths(text) {
  const paths = new Set()
  for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) paths.add(m[1])
  for (const m of text.matchAll(/`((?:references|scripts)\/[^`\s]+\.[a-z]+)`/g)) paths.add(m[1])
  return [...paths].filter((p) => !/^(?:[a-z]+:|#|\/)/i.test(p)).map((p) => p.split('#')[0])
}

function patternsFor(options, errors, warnings) {
  const {
    privatePatternsFile = process.env.PLATFORM_QA_PRIVATE_PATTERNS,
    defaultPatternsFile = DEFAULT_PATTERNS_FILE,
  } = options
  const privatePatterns = loadPrivatePatterns(privatePatternsFile || defaultPatternsFile, errors)
  if (!privatePatterns) warnings.push('private-name scan skipped: no private patterns file found')
  return [...GENERIC_PATTERNS, ...(privatePatterns || [])]
}

function scanFile(root, rel, patterns, errors, warnings) {
  const buffer = readFileSync(join(root, rel))
  if (buffer.includes(0)) return // binary
  const lines = buffer.toString('utf8').split(/\r?\n/)
  if (lines.length > WARN_FILE_LINES) warnings.push(`${rel} has ${lines.length} lines`)
  lines.forEach((line, i) => {
    if (line.includes(ALLOW_MARKER)) return
    for (const { label, regex } of patterns) {
      if (regex.test(line)) errors.push(`${rel}:${i + 1}: ${label}`)
    }
  })
}

/** Scans the listed files (paths relative to root) for private data. */
export function checkFiles(root, files, options = {}) {
  const errors = []
  const warnings = []
  const patterns = patternsFor(options, errors, warnings)
  for (const rel of files) scanFile(root, rel, patterns, errors, warnings)
  return { errors, warnings }
}

/** Checks a skill folder: frontmatter, size, references and private data. */
export function checkSkill(dir, options = {}) {
  const skillPath = join(dir, 'SKILL.md')
  if (!existsSync(skillPath)) return { errors: ['SKILL.md is missing'], warnings: [] }

  const files = listFiles(dir).map((f) => relative(dir, f))
  const { errors, warnings } = checkFiles(dir, files, options)

  const skillText = readFileSync(skillPath, 'utf8')
  const front = parseFrontmatter(skillText)
  if (!front || front.name !== 'platform-qa') errors.push('SKILL.md frontmatter: name must be "platform-qa"')
  if (!front?.description) errors.push('SKILL.md frontmatter: description is missing')
  else if (front.description.length > MAX_DESCRIPTION)
    errors.push(`SKILL.md frontmatter: description is ${front.description.length} characters (max ${MAX_DESCRIPTION})`)
  if (skillText.split(/\r?\n/).length > MAX_SKILL_LINES) errors.push(`SKILL.md is over ${MAX_SKILL_LINES} lines`)

  for (const rel of files.filter((f) => f.endsWith('.md'))) {
    const file = join(dir, rel)
    for (const ref of referencedPaths(readFileSync(file, 'utf8'))) {
      if (!existsSync(resolve(dirname(file), ref)) && !existsSync(resolve(dir, ref)))
        errors.push(`${rel}: referenced file not found: ${ref}`)
    }
  }
  return { errors, warnings }
}

function repoFiles(root) {
  const out = execFileSync('git', ['-C', root, 'ls-files', '-co', '--exclude-standard', '-z'], { encoding: 'utf8' })
  return out.split('\0').filter(Boolean)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const repoMode = process.argv[2] === '--repo'
  const target = resolve(repoMode ? process.argv[3] || '.' : process.argv[2] || 'skill/platform-qa')
  const { errors, warnings } = repoMode ? checkFiles(target, repoFiles(target)) : checkSkill(target)
  for (const w of warnings) console.warn(`warning: ${w}`)
  for (const e of errors) console.error(`error: ${e}`)
  console.log(`${errors.length} errors, ${warnings.length} warnings`)
  process.exit(errors.length ? 1 : 0)
}
