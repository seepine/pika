import { snakeCase } from 'drizzle-orm/pg-core'
import { baseColumns, dayjsType } from '@/common/db/base/columns'

export const user = snakeCase.table('user', (t) => ({
  ...baseColumns(t),
  name: t.varchar({ length: 50 }).notNull(),
  email: t.varchar({ length: 50 }).unique(),
  emailVerified: t.boolean().default(false).notNull(),
  phoneNumber: t.varchar({ length: 20 }).unique(),
  phoneNumberVerified: t.boolean().default(false).notNull(),
  password: t.varchar({ length: 255 }),
  picture: t.varchar({ length: 500 }),
  /**
   * 是否开启登录多因素验证
   *
   * - 控制登录时是否要求多因素验证
   * - 其他敏感业务，建议始终需要校验，不依赖此字段
   */
  loginMultiFactorEnabled: t.boolean().default(false).notNull(),
  loginAt: dayjsType(),
}))

export type User = typeof user.$inferSelect
export type UserInsert = typeof user.$inferInsert
