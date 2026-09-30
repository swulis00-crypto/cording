// 앱이 사용하는 학습 데이터의 진입점. 화면 코드는 JSON을 직접 읽지 않고 이 모듈을 통해 사용한다.
import rawClassifications from './classifications.json'
import rawQuizzes from './quizzes.json'
import { validateClassifications, validateQuizzes } from './validate.ts'
import type { Classification } from '../types/index.ts'

const classificationResult = validateClassifications(rawClassifications as unknown)
const quizResult = validateQuizzes(rawQuizzes as unknown, classificationResult.items)

/** 분류번호순으로 정렬한 전체 분류 */
export const classifications: Classification[] = [...classificationResult.items].sort((a, b) =>
  a.code.localeCompare(b.code),
)

/** 1차 시제품에서 다루는 주류(level 1) */
export const mainClasses: Classification[] = classifications.filter((c) => c.level === 1)

export const quizzes = quizResult.items

/** 화면에 안내할 데이터 오류 */
export const dataErrors: string[] = [...classificationResult.errors, ...quizResult.errors]

export function getClassification(id: string): Classification | undefined {
  return classifications.find((c) => c.id === id)
}
