// 학습 데이터 검증 (PRD 9.5). 앱과 `npm run validate:data` 스크립트가 함께 사용한다.
// Node에서 바로 실행되도록 이 파일은 확장자를 붙인 import만 사용한다.
import {
  QUIZ_TYPES,
  REVIEW_STATUSES,
  type Classification,
  type Quiz,
  type QuizType,
  type ReviewStatus,
} from '../types/index.ts'

export interface ValidationResult<T> {
  /** 사용할 수 있는 항목 */
  items: T[]
  /** 사람이 읽을 수 있는 오류 메시지 */
  errors: string[]
}

const CODE_PATTERN = /^\d{3}(\.\d+)?$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

function isReviewStatus(value: unknown): value is ReviewStatus {
  return REVIEW_STATUSES.includes(value as ReviewStatus)
}

function label(item: Record<string, unknown>, index: number): string {
  return isNonEmptyString(item.id) ? `"${item.id}"` : `${index + 1}번째 항목`
}

/**
 * 분류 데이터를 검증한다.
 * id·code·name이 잘못되었거나 id가 중복된 항목은 제외하고,
 * 그 밖의 필드 오류는 보고한 뒤 안전한 기본값으로 채워 사용한다.
 */
export function validateClassifications(input: unknown): ValidationResult<Classification> {
  const errors: string[] = []
  if (!Array.isArray(input)) {
    return { items: [], errors: ['분류 데이터가 목록(배열) 형식이 아닙니다.'] }
  }

  const items: Classification[] = []
  const seenIds = new Set<string>()

  input.forEach((raw, index) => {
    if (!isRecord(raw)) {
      errors.push(`분류 ${index + 1}번째 항목이 객체 형식이 아닙니다.`)
      return
    }
    const where = `분류 ${label(raw, index)}`

    if (!isNonEmptyString(raw.id)) {
      errors.push(`${where}: id가 없습니다.`)
      return
    }
    if (seenIds.has(raw.id)) {
      errors.push(`${where}: id가 중복되었습니다.`)
      return
    }
    if (typeof raw.code !== 'string') {
      errors.push(`${where}: 분류번호(code)는 "000"처럼 따옴표로 감싼 문자열이어야 합니다.`)
      return
    }
    if (!CODE_PATTERN.test(raw.code)) {
      errors.push(`${where}: 분류번호 "${raw.code}"의 형식이 올바르지 않습니다.`)
      return
    }
    if (!isNonEmptyString(raw.name)) {
      errors.push(`${where}: 분류명(name)이 없습니다.`)
      return
    }
    seenIds.add(raw.id)

    const level = Number.isInteger(raw.level) && (raw.level as number) >= 1 ? (raw.level as number) : 1
    if (level !== raw.level) errors.push(`${where}: level은 1 이상의 정수여야 합니다.`)

    if (raw.parentId !== null && typeof raw.parentId !== 'string') {
      errors.push(`${where}: parentId는 null 또는 문자열이어야 합니다.`)
    }
    if (!isNonEmptyString(raw.learnerDescription)) errors.push(`${where}: 쉬운 설명(learnerDescription)이 없습니다.`)
    if (!isStringArray(raw.exampleTopics)) errors.push(`${where}: 대표 주제(exampleTopics)는 문자열 목록이어야 합니다.`)
    if (typeof raw.hint !== 'string') errors.push(`${where}: 힌트(hint)는 문자열이어야 합니다.`)
    if (!isStringArray(raw.confusedWith)) errors.push(`${where}: confusedWith는 문자열 목록이어야 합니다.`)
    if (!isNonEmptyString(raw.sourceEdition)) errors.push(`${where}: 출처 판본(sourceEdition)이 없습니다.`)
    if (!isReviewStatus(raw.reviewStatus)) {
      errors.push(`${where}: 검수 상태(reviewStatus)는 ${REVIEW_STATUSES.join(', ')} 중 하나여야 합니다.`)
    }

    items.push({
      id: raw.id,
      code: raw.code,
      name: raw.name,
      parentId: typeof raw.parentId === 'string' ? raw.parentId : null,
      level,
      learnerDescription: typeof raw.learnerDescription === 'string' ? raw.learnerDescription : '',
      exampleTopics: isStringArray(raw.exampleTopics) ? raw.exampleTopics : [],
      hint: typeof raw.hint === 'string' ? raw.hint : '',
      confusedWith: isStringArray(raw.confusedWith) ? raw.confusedWith : [],
      symbol: typeof raw.symbol === 'string' ? raw.symbol : '',
      sourceEdition: typeof raw.sourceEdition === 'string' ? raw.sourceEdition : '',
      reviewStatus: isReviewStatus(raw.reviewStatus) ? raw.reviewStatus : 'needs-review',
    })
  })

  // 참조 검사: 존재하지 않는 분류를 가리키면 보고하고 그 참조만 제거한다.
  for (const item of items) {
    if (item.parentId !== null && !seenIds.has(item.parentId)) {
      errors.push(`분류 "${item.id}": 상위 분류 "${item.parentId}"가 존재하지 않습니다.`)
      item.parentId = null
    }
    const missing = item.confusedWith.filter((id) => !seenIds.has(id) || id === item.id)
    for (const id of missing) {
      errors.push(`분류 "${item.id}": 헷갈리기 쉬운 분류 "${id}"가 올바르지 않습니다.`)
    }
    item.confusedWith = item.confusedWith.filter((id) => !missing.includes(id))
  }

  return { items, errors }
}

/**
 * 퀴즈 데이터를 검증한다. 오류가 있는 문항은 제외한다.
 * `approved` 문항은 문제·보기·정답·해설을 모두 갖춰야 한다.
 */
export function validateQuizzes(input: unknown, classifications: Classification[]): ValidationResult<Quiz> {
  const errors: string[] = []
  if (!Array.isArray(input)) {
    return { items: [], errors: ['퀴즈 데이터가 목록(배열) 형식이 아닙니다.'] }
  }

  const classificationIds = new Set(classifications.map((c) => c.id))
  const items: Quiz[] = []
  const seenIds = new Set<string>()

  input.forEach((raw, index) => {
    if (!isRecord(raw)) {
      errors.push(`퀴즈 ${index + 1}번째 항목이 객체 형식이 아닙니다.`)
      return
    }
    const where = `퀴즈 ${label(raw, index)}`
    const problems: string[] = []

    if (!isNonEmptyString(raw.id)) problems.push('id가 없습니다.')
    else if (seenIds.has(raw.id)) problems.push('id가 중복되었습니다.')

    if (!isNonEmptyString(raw.classificationId) || !classificationIds.has(raw.classificationId)) {
      problems.push(`존재하지 않는 분류 "${String(raw.classificationId)}"를 참조합니다.`)
    }
    if (!QUIZ_TYPES.includes(raw.type as QuizType)) {
      problems.push(`문항 유형(type)은 ${QUIZ_TYPES.join(', ')} 중 하나여야 합니다.`)
    }
    if (!isNonEmptyString(raw.question)) problems.push('문제(question)가 없습니다.')

    const options = raw.options
    if (!isStringArray(options) || options.length < 2 || options.some((o) => o.trim() === '')) {
      problems.push('보기(options)는 비어 있지 않은 문자열 2개 이상이어야 합니다.')
    } else if (new Set(options).size !== options.length) {
      problems.push('보기(options)에 같은 값이 중복되었습니다.')
    } else if (typeof raw.correctAnswer !== 'string' || !options.includes(raw.correctAnswer)) {
      problems.push(`정답 "${String(raw.correctAnswer)}"이(가) 보기 중에 없습니다.`)
    }

    if (!isReviewStatus(raw.reviewStatus)) {
      problems.push(`검수 상태(reviewStatus)는 ${REVIEW_STATUSES.join(', ')} 중 하나여야 합니다.`)
    } else if (raw.reviewStatus === 'approved' && !isNonEmptyString(raw.explanation)) {
      problems.push('공개(approved) 문항에는 해설(explanation)이 있어야 합니다.')
    }

    if (problems.length > 0) {
      errors.push(...problems.map((p) => `${where}: ${p}`))
      return
    }

    seenIds.add(raw.id as string)
    items.push({
      id: raw.id as string,
      classificationId: raw.classificationId as string,
      type: raw.type as QuizType,
      difficulty: typeof raw.difficulty === 'number' ? raw.difficulty : 1,
      question: raw.question as string,
      options: options as string[],
      correctAnswer: raw.correctAnswer as string,
      explanation: typeof raw.explanation === 'string' ? raw.explanation : '',
      hint: typeof raw.hint === 'string' ? raw.hint : '',
      reviewStatus: raw.reviewStatus as ReviewStatus,
    })
  })

  return { items, errors }
}
