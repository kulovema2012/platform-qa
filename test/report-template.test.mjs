import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const refs = join(import.meta.dir, '..', 'skill', 'platform-qa', 'references')
const template = readFileSync(join(refs, 'report-template.html'), 'utf8')
const tracking = readFileSync(join(refs, 'tracking.md'), 'utf8')

const trackerBlock = () => {
  const start = template.indexOf('<!-- tracker:start')
  const end = template.indexOf('<!-- tracker:end -->')
  return template.slice(start, end)
}
const trackerScript = () => {
  const block = trackerBlock()
  const open = block.lastIndexOf('<script>')
  return block.slice(open + '<script>'.length, block.indexOf('</script>', open))
}

test('template has exactly one tracker block, after the report body', () => {
  // Arrange
  const starts = template.split('<!-- tracker:start').length - 1
  const ends = template.split('<!-- tracker:end -->').length - 1

  // Act
  const afterMain = template.indexOf('<!-- tracker:start') > template.indexOf('</main>')

  // Assert
  expect([starts, ends, afterMain]).toEqual([1, 1, true])
})

test('tracker script is valid JavaScript', () => {
  // Arrange
  const code = trackerScript()

  // Act
  const compile = () => new Function(code)

  // Assert
  expect(code.length).toBeGreaterThan(1000)
  expect(compile).not.toThrow()
})

test('tracker statuses match the tracking reference, in order', () => {
  // Arrange
  const list = trackerScript().match(/const STATUSES = \[(.*)\];/)?.[1] ?? ''
  const inScript = [...list.matchAll(/\["([a-z]+)", "[^"]+"\]/g)].map(m => m[1])

  // Act
  const inDoc = [...tracking.matchAll(/^\| `([a-z]+)` \|/gm)].map(m => m[1])

  // Assert
  expect(inScript).toEqual(['todo', 'doing', 'blocked', 'fixed', 'verified', 'reopened', 'wontfix'])
  expect(inDoc).toEqual(inScript)
})

test('example finding and missing feature carry their item ID', () => {
  // Arrange
  const ids = [...template.matchAll(/data-item="([^"]+)"/g)].map(m => m[1])

  // Act
  const finding = ids.some(id => /^F-[A-Z]+-\d+$/.test(id))
  const missing = ids.some(id => /^MF-\d+$/.test(id))

  // Assert
  expect([finding, missing]).toEqual([true, true])
})

test('status seed has a placeholder the report fills', () => {
  // Arrange
  const block = trackerBlock()

  // Act
  const seed = block.match(/<script type="application\/json" id="qa-status-seed">([^<]*)<\/script>/)

  // Assert
  expect(seed?.[1]).toBe('{{status_seed_json}}')
})
