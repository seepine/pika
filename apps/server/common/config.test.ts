import { describe, expect, test } from 'bun:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const configPath = join(import.meta.dir, 'config.ts')

// config.ts 在模块顶层求值，需用子进程隔离环境变量
const runConfig = (env: Record<string, string> = {}) =>
  Bun.spawnSync({
    cmd: [process.execPath, '-e', `await import(${JSON.stringify(configPath)})`],
    cwd: tmpdir(),
    env: { ...process.env, JWT_SECRET: '', ...env },
    stdout: 'pipe',
    stderr: 'pipe',
  })

// Bun 在 FORCE_COLOR 等环境下会给 console.log 的数字加 ANSI 颜色码，需剥离后再比较
const ANSI_PATTERN = /\u001B\[[0-9;]*m/g

const readConfigValue = (expression: string, env: Record<string, string> = {}) => {
  const proc = Bun.spawnSync({
    cmd: [
      process.execPath,
      '-e',
      `const { config } = await import(${JSON.stringify(configPath)}); console.log(${expression})`,
    ],
    cwd: tmpdir(),
    env: { ...process.env, NODE_ENV: 'production', JWT_SECRET: 'secret', NO_COLOR: '1', ...env },
    stdout: 'pipe',
    stderr: 'pipe',
  })
  return proc.stdout.toString().replace(ANSI_PATTERN, '').trim()
}

describe('config', () => {
  test('生产环境缺少 JWT_SECRET 时拒绝启动', () => {
    const proc = runConfig({ NODE_ENV: 'production' })
    expect(proc.exitCode).not.toBe(0)
    expect(proc.stderr.toString()).toContain('JWT_SECRET')
  })

  test('生产环境设置 JWT_SECRET 后正常启动', () => {
    const proc = runConfig({ NODE_ENV: 'production', JWT_SECRET: 'secret' })
    expect(proc.exitCode).toBe(0)
  })

  test('开发环境未设置 JWT_SECRET 时使用默认值', () => {
    const proc = runConfig({ NODE_ENV: 'development' })
    expect(proc.exitCode).toBe(0)
  })

  test('CACHE_URL 未配置或留空时回退默认文件缓存目录', () => {
    const cacheUrl = readConfigValue('config.cacheUrl', { CACHE_URL: '' })
    expect(cacheUrl.endsWith('/.pika/data/.cache')).toBe(true)
  })

  test('CACHE_URL=memory 时使用内存缓存', () => {
    expect(readConfigValue('config.cacheUrl', { CACHE_URL: 'memory' })).toBe('memory')
  })

  test('MULTI_FACTOR_SECRET 为占位值 ? 时拒绝启动', () => {
    const proc = runConfig({
      NODE_ENV: 'production',
      JWT_SECRET: 'secret',
      MULTI_FACTOR_SECRET: '?',
    })
    expect(proc.exitCode).not.toBe(0)
    expect(proc.stderr.toString()).toContain('MULTI_FACTOR_SECRET')
  })

  test('未配置 MULTI_FACTOR_SECRET 时回退到 JWT_SECRET', () => {
    expect(readConfigValue('config.multiFactor.secret', { MULTI_FACTOR_SECRET: '' })).toBe('secret')
  })

  test('PORT 留空或非法时回退默认端口', () => {
    expect(readConfigValue('config.port', { PORT: '' })).toBe('9528')
    expect(readConfigValue('config.port', { PORT: ' ' })).toBe('9528')
    expect(readConfigValue('config.port', { PORT: 'abc' })).toBe('9528')
    expect(readConfigValue('config.port', { PORT: '80.5' })).toBe('9528')
  })

  test('PORT=0 时使用系统分配端口', () => {
    expect(readConfigValue('config.port', { PORT: '0' })).toBe('0')
  })

  test('PORT 合法', () => {
    expect(readConfigValue('config.port', { PORT: '59' })).toBe('59')
    expect(readConfigValue('config.port', { PORT: '059' })).toBe('59')
  })
})
