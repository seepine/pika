import { z } from 'zod'
import { cache } from '@/common/cache'
import { zodBoolean, zodDayjs } from '@/common/zod'
import { t } from '@/common/plugins/i18n'
import { UserRepository } from '@/system/repositories/user'
import { UserPreferenceRepository } from '@/system/repositories/user-preference'
import type { User } from '@/system/schemas/user'
import { HttpError } from '@pika/elysia-plugins'
import { isPhone } from '@pika/shared'
import { hashPassword } from '@/common/utils/crypto'
import { emailSchema, passwordSchema } from '@/system/utils/validation'
import { MultiFactorService } from '@/system/services/multi-factor'

// 与注册路径及 `user.name` 的 varchar(50) 容量保持一致，
// 否则系统创建的短用户名/长用户名账号无法通过管理接口更新其他字段
const nameLengthMessage = t('SYSTEM.NICKNAME_LENGTH_INVALID', { min: 1, max: 50 })

const nameSchema = z.string().min(1, nameLengthMessage).max(50, nameLengthMessage)

const userItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  emailVerified: z.boolean(),
  phoneNumber: z.string().optional(),
  phoneNumberVerified: z.boolean(),
  picture: z.string().optional(),
  loginMultiFactorEnabled: z.boolean(),
  loginAt: zodDayjs().optional(),
  createAt: zodDayjs(),
})

export abstract class AdminUserService {
  static ListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    keyword: z.string().trim().min(1).max(50).optional(),
    emailVerified: zodBoolean().optional(),
    phoneNumberVerified: zodBoolean().optional(),
  })

  static ListRespSchema = z.object({
    items: z.array(userItemSchema),
    total: z.number(),
  })

  static IdParamsSchema = z.object({ id: z.string().min(1) })

  static UpdateBodySchema = z.object({
    name: nameSchema,
    email: emailSchema.nullish(),
    emailVerified: z.boolean(),
    phoneNumber: z.string().min(1).refine(isPhone, t('SYSTEM.PHONE_INVALID')).nullish(),
    phoneNumberVerified: z.boolean(),
  })

  static UpdateRespSchema = userItemSchema

  static ResetPasswordBodySchema = z.object({
    password: passwordSchema,
  })

  static ResetPasswordRespSchema = z.object({ success: z.boolean() })

  static RemoveRespSchema = z.object({ success: z.boolean() })

  private static toItem = (row: User) => {
    return {
      id: row.id,
      name: row.name,
      email: row.email ?? undefined,
      emailVerified: row.emailVerified,
      phoneNumber: row.phoneNumber ?? undefined,
      phoneNumberVerified: row.phoneNumberVerified,
      picture: row.picture ?? undefined,
      loginMultiFactorEnabled: row.loginMultiFactorEnabled,
      loginAt: row.loginAt ?? undefined,
      createAt: row.createAt,
    }
  }

  static list = async (
    query: z.infer<typeof AdminUserService.ListQuerySchema>,
  ): Promise<z.infer<typeof AdminUserService.ListRespSchema>> => {
    const { items, total } = await UserRepository.list(query)
    return {
      items: items.map(AdminUserService.toItem),
      total,
    }
  }

  static update = async (
    id: string,
    body: z.infer<typeof AdminUserService.UpdateBodySchema>,
  ): Promise<z.infer<typeof AdminUserService.UpdateRespSchema>> => {
    const user = await UserRepository.findByIdOrThrow(id, 404)

    // 与其他邮箱认证路径保持一致，写入前统一小写与去空白
    const email = body.email?.toLowerCase().trim() ?? null
    const phoneNumber = body.phoneNumber ?? null

    if (email !== null && email !== user.email) {
      const existing = await UserRepository.findByEmail(email)
      if (existing && existing.id !== id) {
        throw new HttpError(t('SYSTEM.EMAIL_ALREADY_EXISTS'), 409)
      }
    }
    if (phoneNumber !== null && phoneNumber !== user.phoneNumber) {
      const existing = await UserRepository.findByPhone(phoneNumber)
      if (existing && existing.id !== id) {
        throw new HttpError(t('SYSTEM.PHONE_ALREADY_EXISTS'), 409)
      }
    }

    await UserRepository.updateById(id, {
      name: body.name,
      email,
      emailVerified: body.emailVerified,
      phoneNumber,
      phoneNumberVerified: body.phoneNumberVerified,
    })
    await cache.del(id)
    return AdminUserService.toItem(await UserRepository.findByIdOrThrow(id, 404))
  }

  static resetPassword = async (
    id: string,
    body: z.infer<typeof AdminUserService.ResetPasswordBodySchema>,
  ): Promise<z.infer<typeof AdminUserService.ResetPasswordRespSchema>> => {
    await UserRepository.findByIdOrThrow(id, 404)
    await UserRepository.updateById(id, { password: await hashPassword(body.password) })
    await cache.del(id)
    return { success: true }
  }

  static remove = async (
    id: string,
    currentUserId: string,
  ): Promise<z.infer<typeof AdminUserService.RemoveRespSchema>> => {
    if (id === currentUserId) {
      throw new HttpError(t('SYSTEM.CANNOT_REMOVE_SELF'), 400)
    }
    await UserRepository.findByIdOrThrow(id, 404)
    await UserRepository.removeAndClearById(id)
    await cache.del(id)
    return { success: true }
  }

  /** 移除用户多因素验证 */
  static RemoveMultiFactorBodySchema = z.object({ id: z.string() })
  static RemoveMultiFactorRespSchema = z.object({ success: z.boolean() })
  static removeMultiFactor = async (
    id: string,
  ): Promise<z.infer<typeof AdminUserService.RemoveMultiFactorRespSchema>> => {
    await UserRepository.findByIdOrThrow(id, 404)
    await MultiFactorService.clearAll(id)
    await cache.del(id)
    return { success: true }
  }
}
