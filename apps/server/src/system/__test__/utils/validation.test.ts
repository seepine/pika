import { describe, expect, test } from 'bun:test'
import { EMAIL_MAX_LENGTH, createEmailSchema, emailSchema } from '@/system/utils/validation'

const isAccepted = (email: string) => emailSchema.safeParse(email).success

describe('emailSchema', () => {
  test('接受常规邮箱', () => {
    for (const email of [
      'admin@example.com',
      'first.last@gmail.com',
      'a_b-c@qq.com',
      'x1@163.com',
    ]) {
      expect(isAccepted(email)).toBeTrue()
    }
  })

  test('忽略首尾空格，校验与落库均为 trim 后的值', () => {
    const result = emailSchema.safeParse('  admin@example.com  ')
    expect(result.success).toBeTrue()
    expect(result.data).toBe('admin@example.com')
    // trim 后仍超长依旧拒绝
    expect(isAccepted(`  ${'a'.repeat(45)}@gmail.com  `)).toBeFalse()
  })

  test('拒绝 + 子地址与其他特殊字符，避免派生出大量随机邮箱', () => {
    for (const email of [
      'admin+1@gmail.com',
      'admin+random-tag@gmail.com',
      'a%tag@qq.com',
      "o'brien@gmail.com",
      'a!b@163.com',
      'a b@gmail.com',
    ]) {
      expect(isAccepted(email)).toBeFalse()
    }
  })
  test('拒绝首尾点与连续点', () => {
    for (const email of ['.admin@gmail.com', 'admin.@gmail.com', 'a..b@gmail.com']) {
      expect(isAccepted(email)).toBeFalse()
    }
  })

  test('拒绝超过 50 字符的邮箱，与 user.email 字段长度一致', () => {
    const longEmail = `${'a'.repeat(45)}@gmail.com`
    expect(longEmail.length).toBeGreaterThan(EMAIL_MAX_LENGTH)
    const result = emailSchema.safeParse(longEmail)
    expect(result.success).toBeFalse()
    expect(result.error!.issues[0]!.code).toBe('too_big')
  })

  test('字符集不合法时不暴露具体规则，与格式错误使用同一文案', () => {
    const plusResult = emailSchema.safeParse('admin+1@gmail.com')
    const formatResult = emailSchema.safeParse('not-an-email')
    expect(plusResult.success).toBeFalse()
    expect(plusResult.error!.issues[0]!.message).toBe(formatResult.error!.issues[0]!.message)
  })

  test('支持自定义格式错误文案', () => {
    const schema = createEmailSchema('新邮箱格式错误')
    expect(schema.safeParse('not-an-email').error!.issues[0]!.message).toBe('新邮箱格式错误')
    expect(schema.safeParse('admin+1@gmail.com').error!.issues[0]!.message).toBe('新邮箱格式错误')
  })
})
