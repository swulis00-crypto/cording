// 학습 데이터 검증 스크립트: npm run validate:data
// 선생님이 JSON 파일을 수정한 뒤 이 명령으로 오류를 확인할 수 있다.
import { readFileSync } from 'node:fs'
import { validateClassifications, validateQuizzes, validateRules } from '../src/data/validate.ts'

function readJson(fileName: string): unknown {
  const url = new URL(`../src/data/${fileName}`, import.meta.url)
  try {
    return JSON.parse(readFileSync(url, 'utf8'))
  } catch (error) {
    console.error(`✖ ${fileName}을(를) 읽을 수 없습니다: ${(error as Error).message}`)
    process.exit(1)
  }
}

function countByStatus(items: { reviewStatus: string }[]): string {
  const counts = new Map<string, number>()
  for (const item of items) counts.set(item.reviewStatus, (counts.get(item.reviewStatus) ?? 0) + 1)
  return [...counts].map(([status, n]) => `${status} ${n}`).join(', ') || '없음'
}

const classifications = validateClassifications(readJson('classifications.json'))
const quizzes = validateQuizzes(readJson('quizzes.json'), classifications.items)
const level2 = readJson('level2.json') as { rules?: unknown; quizzes?: unknown }
const rules = validateRules(level2.rules)
const level2Quizzes = validateQuizzes(level2.quizzes, classifications.items, rules.items.map((r) => r.id))
const level3 = readJson('level3.json') as { rules?: unknown; quizzes?: unknown }
const authorSteps = validateRules(level3.rules)
const level3Quizzes = validateQuizzes(level3.quizzes, classifications.items, authorSteps.items.map((r) => r.id))
const noRule = level2Quizzes.items.filter((q) => q.rule === undefined).map((q) => `퀴즈 "${q.id}": 규칙(rule)이 없습니다.`)
const ids = [...quizzes.items, ...level2Quizzes.items, ...level3Quizzes.items].map((q) => q.id)
const duplicated = ids.filter((id, i) => ids.indexOf(id) !== i).map((id) => `퀴즈 "${id}": 게임 단계 사이에 id가 중복되었습니다.`)
const errors = [
  ...classifications.errors,
  ...quizzes.errors,
  ...[...rules.errors, ...level2Quizzes.errors, ...noRule].map((e) => `[게임 2단계] ${e}`),
  ...[...authorSteps.errors, ...level3Quizzes.errors].map((e) => `[게임 3단계] ${e}`),
  ...duplicated,
]

console.log(`분류 ${classifications.items.length}개 (${countByStatus(classifications.items)})`)
console.log(`게임 1단계 퀴즈 ${quizzes.items.length}개 (${countByStatus(quizzes.items)})`)
console.log(`게임 2단계 규칙 ${rules.items.length}개 (${countByStatus(rules.items)})`)
console.log(`게임 2단계 퀴즈 ${level2Quizzes.items.length}개 (${countByStatus(level2Quizzes.items)})`)
console.log(`게임 3단계 단계 ${authorSteps.items.length}개, 퀴즈 ${level3Quizzes.items.length}개 (${countByStatus(level3Quizzes.items)})`)

if (errors.length > 0) {
  console.error(`\n✖ 오류 ${errors.length}건`)
  for (const error of errors) console.error(`  - ${error}`)
  process.exit(1)
}
console.log('\n✔ 데이터 오류 없음')
