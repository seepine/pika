import { describe, expect, test } from 'bun:test'
import { isMemoryUrl, isPostgresUrl, isRedisUrl } from '@/common/utils/is'

describe('isPostgresUrl', () => {
  test('仅识别 postgresql:// 前缀', () => {
    expect(isPostgresUrl('postgresql://user:pwd@localhost:5432/db')).toBeTrue()
    expect(isPostgresUrl('postgres://user:pwd@localhost:5432/db')).toBeFalse()
  })

  test('其他值视为 PGlite 数据目录', () => {
    expect(isPostgresUrl('.tmp/.pglite.data')).toBeFalse()
    expect(isPostgresUrl('')).toBeFalse()
    expect(isPostgresUrl(undefined)).toBeFalse()
  })
})

describe('isRedisUrl', () => {
  test('识别 redis 与 valkey 连接串', () => {
    expect(isRedisUrl('redis://localhost:6379/0')).toBeTrue()
    expect(isRedisUrl('rediss://:pwd@redis.example.com:6379/0')).toBeTrue()
    expect(isRedisUrl('valkey://localhost:6379/0')).toBeTrue()
    expect(isRedisUrl('valkeys://:pwd@valkey.example.com:6379/0')).toBeTrue()
  })

  test('文件目录或空值视为非 redis', () => {
    expect(isRedisUrl('/data/cache')).toBeFalse()
    expect(isRedisUrl('.cache')).toBeFalse()
    expect(isRedisUrl('')).toBeFalse()
  })
})

describe('isMemoryUrl', () => {
  test('识别 memory 与 memory://', () => {
    expect(isMemoryUrl('memory')).toBeTrue()
    expect(isMemoryUrl('memory://')).toBeTrue()
  })

  test('memory 前缀的普通目录与空值视为非内存', () => {
    expect(isMemoryUrl('memory-cache')).toBeFalse()
    expect(isMemoryUrl('.tmp/memory.data')).toBeFalse()
    expect(isMemoryUrl('')).toBeFalse()
  })
})
