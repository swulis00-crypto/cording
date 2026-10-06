import { describe, expect, it } from 'vitest'
import { validateClassifications, validateQuizzes, validateRules } from './validate.ts'

function classification(overrides: Record<string, unknown> = {}) {
  return {
    id: 'kdc-000',
    code: '000',
    name: '총류',
    parentId: null,
    level: 1,
    learnerDescription: '설명',
    exampleTopics: ['백과사전'],
    hint: '힌트',
    confusedWith: [],
    symbol: '📚',
    sourceEdition: 'KDC 제6판',
    reviewStatus: 'needs-review',
    ...overrides,
  }
}

function quiz(overrides: Record<string, unknown> = {}) {
  return {
    id: 'quiz-000-001',
    classificationId: 'kdc-000',
    type: 'code-to-name',
    difficulty: 1,
    question: '000은 무엇인가요?',
    options: ['총류', '철학', '종교', '역사'],
    correctAnswer: '총류',
    explanation: '000은 총류입니다.',
    hint: '',
    reviewStatus: 'approved',
    ...overrides,
  }
}

describe('validateClassifications', () => {
  it('올바른 데이터는 오류 없이 통과한다', () => {
    const result = validateClassifications([classification()])
    expect(result.errors).toEqual([])
    expect(result.items).toHaveLength(1)
  })

  it('배열이 아니면 오류를 낸다', () => {
    expect(validateClassifications({}).errors).toHaveLength(1)
  })

  it('중복 id를 탐지하고 뒤의 항목을 제외한다', () => {
    const result = validateClassifications([classification(), classification({ name: '다른 이름' })])
    expect(result.items).toHaveLength(1)
    expect(result.errors.join()).toContain('중복')
  })

  it('숫자로 적은 분류번호를 탐지한다', () => {
    const result = validateClassifications([classification({ code: 0 })])
    expect(result.items).toHaveLength(0)
    expect(result.errors.join()).toContain('문자열')
  })

  it('분류명이 없으면 제외한다', () => {
    const result = validateClassifications([classification({ name: '' })])
    expect(result.items).toHaveLength(0)
    expect(result.errors.join()).toContain('분류명')
  })

  it('필수 아닌 필드 오류는 보고하되 항목은 기본값으로 유지한다', () => {
    const result = validateClassifications([classification({ reviewStatus: 'ok', exampleTopics: 'x' })])
    expect(result.items).toHaveLength(1)
    expect(result.items[0].reviewStatus).toBe('needs-review')
    expect(result.items[0].exampleTopics).toEqual([])
    expect(result.errors).toHaveLength(2)
  })

  it('존재하지 않는 분류를 참조하면 보고하고 참조를 제거한다', () => {
    const result = validateClassifications([
      classification({ confusedWith: ['kdc-999'] }),
      classification({ id: 'kdc-010', code: '010', name: '하위', parentId: 'kdc-nope', level: 2 }),
    ])
    expect(result.errors).toHaveLength(2)
    expect(result.items[0].confusedWith).toEqual([])
    expect(result.items[1].parentId).toBeNull()
  })
})

describe('validateQuizzes', () => {
  const classifications = validateClassifications([classification()]).items

  it('올바른 문항은 통과한다', () => {
    const result = validateQuizzes([quiz()], classifications)
    expect(result.errors).toEqual([])
    expect(result.items).toHaveLength(1)
  })

  it('정답이 보기에 없으면 탐지한다', () => {
    const result = validateQuizzes([quiz({ correctAnswer: '문학' })], classifications)
    expect(result.items).toHaveLength(0)
    expect(result.errors.join()).toContain('보기 중에 없습니다')
  })

  it('존재하지 않는 분류를 참조하면 탐지한다', () => {
    const result = validateQuizzes([quiz({ classificationId: 'kdc-999' })], classifications)
    expect(result.errors.join()).toContain('kdc-999')
  })

  it('중복 id를 탐지한다', () => {
    const result = validateQuizzes([quiz(), quiz()], classifications)
    expect(result.items).toHaveLength(1)
    expect(result.errors.join()).toContain('중복')
  })

  it('해설 없는 approved 문항은 제외하고, draft는 해설 없이도 허용한다', () => {
    const result = validateQuizzes(
      [quiz({ explanation: '' }), quiz({ id: 'quiz-000-002', explanation: '', reviewStatus: 'draft' })],
      classifications,
    )
    expect(result.items.map((q) => q.id)).toEqual(['quiz-000-002'])
    expect(result.errors.join()).toContain('해설')
  })

  it('보기가 중복되면 탐지한다', () => {
    const result = validateQuizzes([quiz({ options: ['총류', '총류', '철학', '역사'] })], classifications)
    expect(result.errors.join()).toContain('중복')
  })
})

describe('게임 2단계 데이터', () => {
  const classifications = validateClassifications([classification()]).items
  const build = (overrides: Record<string, unknown> = {}) =>
    quiz({ type: 'build-number', rule: 'rule-1', template: '7□0', options: ['1', '2', '3', '4'], correctAnswer: '740', ...overrides })

  it('번호 조립: 틀과 숫자 카드로 만들 수 있는 정답이면 통과한다', () => {
    const result = validateQuizzes([build(), build({ id: 'q2', template: '8□□', correctAnswer: '811' })], classifications, ['rule-1'])
    expect(result.errors).toEqual([])
    expect(result.items[0].template).toBe('7□0')
  })

  it('번호 조립: 틀이 없거나, 카드로 만들 수 없거나, 고정 숫자가 다르면 탐지한다', () => {
    const result = validateQuizzes(
      [
        build({ id: 'a', template: undefined }),
        build({ id: 'b', correctAnswer: '750' }),
        build({ id: 'c', correctAnswer: '840' }),
        build({ id: 'd', correctAnswer: '7400' }),
      ],
      classifications,
      ['rule-1'],
    )
    expect(result.items).toEqual([])
    expect(result.errors).toHaveLength(4)
  })

  it('존재하지 않는 규칙을 참조하면 탐지한다', () => {
    const result = validateQuizzes([build({ rule: 'rule-9' })], classifications, ['rule-1'])
    expect(result.errors.join()).toContain('rule-9')
  })

  it('규칙 데이터를 검증한다', () => {
    const ok = { id: 'rule-1', emoji: '🔍', title: '제목', summary: '설명', examples: [{ code: '410', label: '수학' }], reviewStatus: 'draft' }
    expect(validateRules([ok]).errors).toEqual([])
    const result = validateRules([ok, ok, { ...ok, id: 'rule-2', examples: [{ code: 410, label: '수학' }] }])
    expect(result.items).toHaveLength(1)
    expect(result.errors).toHaveLength(2)
  })
})
