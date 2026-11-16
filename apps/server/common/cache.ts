import { Cache } from '@seepine/cache'
import { BunRedisAdapter } from '@seepine/cache/adapt/bun'
import { FileAdapter } from '@seepine/cache/adapt/file'
import { config } from './config'
import { isMemoryUrl, isRedisUrl } from './utils/is'
import { resolvePath } from './utils/path'

// CACHE_URL 为空或 memory / memory:// 时走内存缓存，为 redis/valkey 连接串时走 Redis，其他值视为文件缓存目录
const createAdapter = () => {
  const { cacheUrl } = config
  if (!cacheUrl || isMemoryUrl(cacheUrl)) {
    return undefined
  }
  if (isRedisUrl(cacheUrl)) {
    return new BunRedisAdapter(cacheUrl)
  }
  return new FileAdapter(resolvePath(cacheUrl))
}

export const cache = new Cache({ adapter: createAdapter() })
