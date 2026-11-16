/** 缓存 / 数据库连接串的类型判断集合：集中定义「值走哪种后端，否则视为目录」的规则。 */

/**
 * 判断数据库连接串是否为 PostgreSQL。
 *
 * 仅识别 `postgresql://` 前缀：`postgres://` 由 `createDb` 显式报错，避免被误当作 PGlite 数据目录。
 */
export const isPostgresUrl = (url: string | undefined): boolean =>
  url?.startsWith('postgresql://') ?? false

/** Bun.RedisClient 支持的连接串协议，valkey 与 redis 协议互通 */
const REDIS_PROTOCOLS = [
  'redis',
  'rediss',
  'valkey',
  'valkeys',
  'redis+tls',
  'redis+unix',
  'redis+tls+unix',
]

/** 判断缓存连接串是否走 Redis，未命中则视为文件缓存目录 */
export const isRedisUrl = (url: string): boolean =>
  REDIS_PROTOCOLS.some((protocol) => url.startsWith(`${protocol}://`))

/**
 * 判断是否为内存模式：精确值 `memory` 或 `memory://` 协议串。
 * 不能用 `startsWith('memory')`，否则 `memory-cache` 这类普通目录会被误判为内存。
 */
export const isMemoryUrl = (url: string): boolean => url === 'memory' || url.startsWith('memory://')
