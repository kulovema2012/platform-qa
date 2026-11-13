import { createHash } from 'node:crypto'
import { cp, lstat, mkdir, readFile, readdir, realpath, rename, rm, rmdir, symlink, unlink, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const SKILL_NAME = 'platform-qa'
export const DEFAULT_TARGETS = ['.agents/skills', '.claude/skills']
export const DEFAULT_SOURCE = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'skill', SKILL_NAME)
export const MANIFEST = '.platform-qa-manifest.json'

const defaultLink = (target, path) => symlink(target, path, process.platform === 'win32' ? 'junction' : 'dir')

async function statOrNull(path) {
  try {
    return await lstat(path)
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

// Resolves links in the parts of a path that exist, so two routes to the same folder compare equal.
async function realOrResolved(path) {
  try {
    return await realpath(path)
  } catch {
    return resolve(path)
  }
}

// Removes a symlink or Windows junction without touching what it points to.
// Bun's rm() fails on junctions (EFAULT), and unlink() refuses directory junctions on some systems.
async function removeLink(path) {
  try {
    await unlink(path)
  } catch (error) {
    if (!['EISDIR', 'EPERM', 'EFAULT'].includes(error.code)) throw error
    await rmdir(path)
  }
}

async function hashTree(dir) {
  const files = {}
  async function walk(current) {
    for (const name of await readdir(current)) {
      const path = join(current, name)
      const stat = await lstat(path)
      if (stat.isDirectory()) await walk(path)
      else if (name !== MANIFEST || current !== dir) {
        files[relative(dir, path).split(sep).join('/')] = createHash('sha256').update(await readFile(path)).digest('hex')
      }
    }
  }
  await walk(dir)
  return files
}

const sameFiles = (a, b) => {
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((k) => a[k] === b[k])
}

// An installed copy is unedited when it still matches the manifest written at install time.
// Copies without a manifest count as unedited only when they match the new source exactly.
async function isUnedited(path, source) {
  const current = await hashTree(path)
  try {
    const manifest = JSON.parse(await readFile(join(path, MANIFEST), 'utf8'))
    return sameFiles(current, manifest.files)
  } catch {
    return sameFiles(current, await hashTree(source))
  }
}

function stamp(now) {
  return now().toISOString().replace(/[-:]/g, '').replace('.', '-')
}

async function moveToBackup(path, home, now, label, dryRun) {
  const root = join(home, '.agents', SKILL_NAME, 'backups')
  let dir = join(root, stamp(now))
  for (let n = 1; await statOrNull(dir); n++) dir = join(root, `${stamp(now)}-${n}`)
  const dest = join(dir, label)
  if (!dryRun) {
    await mkdir(dir, { recursive: true })
    await rename(path, dest)
  }
  return dest
}

const labelFor = (target) => target.replace(/[\\/]+/g, '-').replace(/^[.-]+/, '')

/**
 * Clears the way for a fresh install or an uninstall at `path`.
 * Links and unedited copies are removed; edited copies are moved to the backups folder.
 * Returns { removed, backup } describing what happened.
 */
async function clear(path, { source, home, now, label, dryRun }) {
  const stat = await statOrNull(path)
  if (!stat) return { removed: false, backup: null }
  if (stat.isSymbolicLink()) {
    if (!dryRun) await removeLink(path)
    return { removed: true, backup: null }
  }
  if (await isUnedited(path, source)) {
    if (!dryRun) await rm(path, { recursive: true, force: true })
    return { removed: true, backup: null }
  }
  return { removed: true, backup: await moveToBackup(path, home, now, label, dryRun) }
}

async function readVersion() {
  try {
    const pkg = JSON.parse(await readFile(resolve(DEFAULT_SOURCE, '..', '..', 'package.json'), 'utf8'))
    return pkg.version
  } catch {
    return 'unknown'
  }
}

export async function install({
  home,
  targets = DEFAULT_TARGETS,
  dryRun = false,
  now = () => new Date(),
  link = defaultLink,
  source = DEFAULT_SOURCE,
} = {}) {
  const installed = []
  const backedUp = []
  const skipped = []
  let mode = 'symlink'
  const [primaryTarget, ...otherTargets] = targets
  const primary = join(home, primaryTarget, SKILL_NAME)
  const opts = { source, home, now, dryRun }

  const first = await clear(primary, { ...opts, label: labelFor(primaryTarget) })
  if (first.backup) backedUp.push(first.backup)
  if (!dryRun) {
    await mkdir(dirname(primary), { recursive: true })
    await cp(source, primary, { recursive: true })
    const manifest = { version: await readVersion(), files: await hashTree(primary) }
    await writeFile(join(primary, MANIFEST), JSON.stringify(manifest, null, 2) + '\n')
  }
  installed.push(primary)
  const primaryParent = await realOrResolved(dirname(primary))

  for (const target of otherTargets) {
    const dest = join(home, target, SKILL_NAME)
    if ((await realOrResolved(dirname(dest))) === primaryParent) {
      skipped.push(dest)
      installed.push(dest)
      continue
    }
    const result = await clear(dest, { ...opts, label: labelFor(target) })
    if (result.backup) backedUp.push(result.backup)
    if (!dryRun) {
      await mkdir(dirname(dest), { recursive: true })
      try {
        await link(primary, dest)
      } catch (error) {
        mode = 'copy'
        await cp(primary, dest, { recursive: true })
      }
    }
    installed.push(dest)
  }

  return { installed, backedUp, skipped, mode }
}

export async function uninstall({ home, targets = DEFAULT_TARGETS, now = () => new Date(), source = DEFAULT_SOURCE } = {}) {
  const removed = []
  const backedUp = []
  // Remove links first so the canonical copy is never reached through one.
  for (const target of [...targets].reverse()) {
    const path = join(home, target, SKILL_NAME)
    const result = await clear(path, { source, home, now, label: labelFor(target), dryRun: false })
    if (result.removed) removed.push(path)
    if (result.backup) backedUp.push(result.backup)
  }
  return { removed, backedUp }
}
