import dayjs from 'dayjs'
import { onStartBefore } from '@pika/elysia-hook'
import { log } from '@/common/log'
import { hashPassword } from '@/common/utils/crypto'
import { EMAIL_MAX_LENGTH, emailSchema, passwordSchema } from '@/system/utils/validation'
import { UserRepository } from '@/system/repositories/user'
import { cache } from '@/common/cache'

/** 获取初始化锁的超时（秒），避免缓存不可用时进程卡在监听端口之前 */
const LOCK_TIMEOUT_SECONDS = 10

/**
 * 同时配置 `ADMIN_EMAIL` 与 `ADMIN_PASSWORD` 时，库中无用户则创建管理员账号。
 *
 * 已有用户时跳过，不覆盖已有账号；修改密码请走「忘记密码」。
 */
export const ensureAdminUser = async (): Promise<void> => {
  const email = Bun.env['ADMIN_EMAIL']?.trim().toLowerCase()
  const password = Bun.env['ADMIN_PASSWORD']
  if (!email || !password?.trim()) {
    return
  }
  // 格式不合法时登录会走手机号查询，创建的账号永远无法登录
  const parsedEmail = emailSchema.safeParse(email)
  if (!parsedEmail.success) {
    throw new Error(
      `[hook/admin] ADMIN_EMAIL 不合法（${parsedEmail.error.issues[0]?.message}），需为合法邮箱且不超过 ${EMAIL_MAX_LENGTH} 字符`,
    )
  }
  // 避免 `?` 这类占位符被当作密码，创建出可登录的弱口令管理员
  const parsedPassword = passwordSchema.safeParse(password)
  if (!parsedPassword.success) {
    throw new Error(
      `[hook/admin] ADMIN_PASSWORD 不合法（${parsedPassword.error.issues[0]?.message}），需 6-30 位且同时包含字母与数字`,
    )
  }
  try {
    await cache.lock(
      'init-admin',
      async () => {
        if (await UserRepository.findByEmail(email)) {
          log.debug(`[hook/admin] admin user ${email} already exists, skip create`)
          return
        }
        if (await UserRepository.hasUser()) {
          log.debug(`[hook/admin] user already exists, skip create admin user`)
          return
        }

        try {
          await UserRepository.save({
            // 昵称取邮箱前缀，与邮箱注册保持一致；name 长度上限 50
            name: email.split('@')[0]!.slice(0, 50),
            email,
            emailVerified: true,
            password: await hashPassword(parsedPassword.data),
            createAt: dayjs(),
          })
          log.info(`[hook/admin] admin user ${email} created`)
        } catch (error) {
          // 多进程并发启动时可能被其它进程抢先创建，确认已存在即可
          if (await UserRepository.findByEmail(email)) {
            return
          }
          throw error
        }
      },
      LOCK_TIMEOUT_SECONDS,
    )
  } catch (error) {
    // 超时文案：适配器模式为 lock acquire failed，内存模式为 async-lock timed out
    if (error instanceof Error && /lock acquire failed|async-lock timed out/.test(error.message)) {
      throw new Error(
        `[hook/admin] 获取初始化锁超时（${LOCK_TIMEOUT_SECONDS}s），请检查 CACHE_URL 指向的目录或服务是否可用`,
      )
    }
    throw error
  }
}

onStartBefore(ensureAdminUser)
