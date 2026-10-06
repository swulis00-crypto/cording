// 앱이 사용하는 학습 데이터의 진입점. 화면 코드는 JSON을 직접 읽지 않고 이 모듈을 통해 사용한다.
import rawClassifications from './classifications.json'
import rawLevel2 from './level2.json'
import rawQuizzes from './quizzes.json'
import { validateClassifications, validateQuizzes, validateRules } from './validate.ts'
import { getPlayableQuizzes } from '../features/quiz/engine.ts'
import type { Classification, NumberRule, Quiz } from '../types/index.ts'

const level2 = rawLevel2 as unknown as { rules?: unknown; quizzes?: unknown }

const classificationResult = validateClassifications(rawClassifications as unknown)
const quizResult = validateQuizzes(rawQuizzes as unknown, classificationResult.items)
const ruleResult = validateRules(level2.rules)
const level2QuizResult = validateQuizzes(
  level2.quizzes,
  classificationResult.items,
  ruleResult.items.map((r) => r.id),
)

/** 분류번호순으로 정렬한 전체 분류 */
export const classifications: Classification[] = [...classificationResult.items].sort((a, b) =>
  a.code.localeCompare(b.code),
)

/** 1차 시제품에서 다루는 주류(level 1) */
export const mainClasses: Classification[] = classifications.filter((c) => c.level === 1)

/** 게임 1단계 문항 */
export const quizzes = quizResult.items

/** 게임 2단계 규칙 (데이터 순서 = 학습 순서) */
export const rules: NumberRule[] = ruleResult.items

/** 게임 2단계 문항. 규칙(rule)이 없는 문항은 쓰지 않는다. */
export const level2Quizzes: Quiz[] = level2QuizResult.items.filter((q) => q.rule !== undefined)

/** 모든 게임 단계의 문항 (오답 복습용) */
export const allQuizzes: Quiz[] = [...quizzes, ...level2Quizzes]

/** 화면에 안내할 데이터 오류 */
export const dataErrors: string[] = [
  ...classificationResult.errors,
  ...quizResult.errors,
  ...ruleResult.errors.map((e) => `[게임 2단계] ${e}`),
  ...level2QuizResult.errors.map((e) => `[게임 2단계] ${e}`),
  ...level2QuizResult.items.filter((q) => q.rule === undefined).map((q) => `[게임 2단계] 퀴즈 "${q.id}": 규칙(rule)이 없습니다.`),
]

export function getClassification(id: string): Classification | undefined {
  return classifications.find((c) => c.id === id)
}

export function getClassificationByCode(code: string): Classification | undefined {
  return classifications.find((c) => c.code === code)
}

/** 한 분류 바로 아래의 하위 분류 (번호순) */
export function getChildren(parentId: string): Classification[] {
  return classifications.filter((c) => c.parentId === parentId)
}

export function getRule(id: string): NumberRule | undefined {
  return rules.find((r) => r.id === id)
}

/** 해당 분류 미션에 출제할 수 있는 게임 1단계 문항 (데이터 순서 유지) */
export function getMissionQuizzes(classificationId: string, preview: boolean): Quiz[] {
  return getPlayableQuizzes(quizzes, preview).filter((q) => q.classificationId === classificationId)
}

/** 게임 2단계에서 출제할 수 있는 문항 (규칙 순서 → 데이터 순서) */
export function getRuleQuizzes(preview: boolean): Quiz[] {
  const playable = getPlayableQuizzes(level2Quizzes, preview)
  return rules.flatMap((r) => playable.filter((q) => q.rule === r.id))
}
