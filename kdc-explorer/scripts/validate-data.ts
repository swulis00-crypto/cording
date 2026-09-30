// 학습 데이터 검증 스크립트: npm run validate:data
// 선생님이 JSON 파일을 수정한 뒤 이 명령으로 오류를 확인할 수 있다.
import { readFileSync } from 'node:fs'
import { validateClassifications, validateQuizzes } from '../src/data/validate.ts'

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
const errors = [...classifications.errors, ...quizzes.errors]

console.log(`분류 ${classifications.items.length}개 (${countByStatus(classifications.items)})`)
console.log(`퀴즈 ${quizzes.items.length}개 (${countByStatus(quizzes.items)})`)

if (errors.length > 0) {
  console.error(`\n✖ 오류 ${errors.length}건`)
  for (const error of errors) console.error(`  - ${error}`)
  process.exit(1)
}
console.log('\n✔ 데이터 오류 없음')
