import { treaty } from '@elysia/eden'
import { type Api, startApp } from '@/app'
import { ensureAdminUser } from '@/system/hooks/init-admin-user'
import { UserRepository } from '@/system/repositories/user'
import { user, type User } from '@/system/schemas/user'
import { useDb } from '@/common/db'
import { verifyPassword } from '@/common/utils/crypto'
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'

const adminEmail = 'admin-bootstrap-48533@gmail.com'
const adminPassword = 'Admin123456'

/** 清空用户表 */
const clearUsers = () => useDb().delete(user)

describe('initAdminUser', () => {
  let appHandle!: Awaited<ReturnType<typeof startApp>>
  let api!: ReturnType<typeof treaty<Api>>
  /** 测试库跨文件共享，先快照用户表，结束后恢复 */
  let userSnapshot: User[] = []
  const originalEnv: Record<string, string | undefined> = {}

  beforeAll(async () => {
    originalEnv['ADMIN_EMAIL'] = process.env['ADMIN_EMAIL']
    originalEnv['ADMIN_PASSWORD'] = process.env['ADMIN_PASSWORD']

    // 先用原始环境启动：迁移在这一步完成，且快照不含后面手动建的管理员账号
    appHandle = await startApp({ port: 48533 })
    api = treaty<Api>(appHandle.baseUrl)
    userSnapshot = await useDb().select().from(user)

    // 该 hook 只在库中无用户时建号，清空后手动触发
    process.env['ADMIN_EMAIL'] = adminEmail
    process.env['ADMIN_PASSWORD'] = adminPassword
    await clearUsers()
    await ensureAdminUser()
  })

  afterAll(async () => {
    await clearUsers()
    if (userSnapshot.length > 0) {
      await useDb().insert(user).values(userSnapshot)
    }
    await appHandle.app.stop()
    // 恢复原始环境变量，避免影响其它测试文件
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key]
        continue
      }
      process.env[key] = value
    }
  })

  test('库中无用户时按环境变量创建管理员账号', async () => {
    const user = await UserRepository.findByEmail(adminEmail)
    expect(user).toBeDefined()
    expect(user!.emailVerified).toBe(true)
    // 密码必须落库为哈希值，且可通过登录校验
    expect(user!.password).not.toBe(adminPassword)
    expect(await verifyPassword(adminPassword, user!.password!)).toBe(true)
  })

  test('重复执行不会创建重复账号', async () => {
    await ensureAdminUser()
    await ensureAdminUser()
    const { total } = await UserRepository.list({ page: 1, pageSize: 10, keyword: adminEmail })
    expect(total).toBe(1)
  })

  test('库中已有用户时不再自动创建管理员账号', async () => {
    // 换一个未使用的 ADMIN_EMAIL 也不应建号
    const anotherEmail = 'admin-bootstrap-skip-48533@gmail.com'
    process.env['ADMIN_EMAIL'] = anotherEmail
    try {
      await ensureAdminUser()
    } finally {
      process.env['ADMIN_EMAIL'] = adminEmail
    }
    expect(await UserRepository.findByEmail(anotherEmail)).toBeUndefined()
  })

  test('创建后可直接登录并拥有管理员角色', async () => {
    const { data: tokenInfo, status } = await api.system.oauth.token.post({
      grant_type: 'password',
      username: adminEmail,
      password: adminPassword,
    })
    expect(status).toBe(200)
    expect(tokenInfo).not.toBeNull()

    const { data: userInfo } = await api.system.oauth.userinfo.get({
      headers: { Authorization: `Bearer ${tokenInfo!.access_token}` },
    })
    expect(userInfo!.email).toBe(adminEmail)
    expect(userInfo!.roles).toContain('admin')
  })

  test('ADMIN_PASSWORD 为占位符等弱口令时拒绝启动', async () => {
    const weakEmail = 'admin-weak-password-48533@gmail.com'
    process.env['ADMIN_EMAIL'] = weakEmail
    process.env['ADMIN_PASSWORD'] = '?'
    try {
      await expect(ensureAdminUser()).rejects.toThrow('ADMIN_PASSWORD')
    } finally {
      process.env['ADMIN_EMAIL'] = adminEmail
      process.env['ADMIN_PASSWORD'] = adminPassword
    }
    expect(await UserRepository.findByEmail(weakEmail)).toBeUndefined()
  })

  test('ADMIN_EMAIL 不是邮箱时拒绝启动', async () => {
    const invalidEmail = 'admin-not-an-email'
    process.env['ADMIN_EMAIL'] = invalidEmail
    process.env['ADMIN_PASSWORD'] = adminPassword
    try {
      await expect(ensureAdminUser()).rejects.toThrow('ADMIN_EMAIL')
    } finally {
      process.env['ADMIN_EMAIL'] = adminEmail
    }
    expect(await UserRepository.findByEmail(invalidEmail)).toBeUndefined()
  })

  test('ADMIN_EMAIL 超过 50 字符时拒绝启动', async () => {
    const tooLongEmail = `${'a'.repeat(45)}@gmail.com`
    process.env['ADMIN_EMAIL'] = tooLongEmail
    process.env['ADMIN_PASSWORD'] = adminPassword
    try {
      await expect(ensureAdminUser()).rejects.toThrow('ADMIN_EMAIL')
    } finally {
      process.env['ADMIN_EMAIL'] = adminEmail
    }
    expect(await UserRepository.findByEmail(tooLongEmail)).toBeUndefined()
  })
})
