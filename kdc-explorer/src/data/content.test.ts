// 실제 학습 데이터 파일 검사
import { describe, expect, it } from 'vitest'
import { QUIZ_TYPES } from '../types/index.ts'
import { dataErrors, mainClasses, quizzes } from './index.ts'

// PRD 5.1 표, KDC 제6판 주류
const EXPECTED_MAIN_CLASSES = [
  ['000', '총류'],
  ['100', '철학'],
  ['200', '종교'],
  ['300', '사회과학'],
  ['400', '자연과학'],
  ['500', '기술과학'],
  ['600', '예술'],
  ['700', '언어'],
  ['800', '문학'],
  ['900', '역사'],
]

describe('학습 데이터', () => {
  it('검증 오류가 없다', () => {
    expect(dataErrors).toEqual([])
  })

  it('주류 10개가 번호순으로 정확한 명칭을 가진다', () => {
    expect(mainClasses.map((c) => [c.code, c.name])).toEqual(EXPECTED_MAIN_CLASSES)
  })

  it('모든 주류가 KDC 제6판을 출처로 기록한다', () => {
    for (const c of mainClasses) expect(c.sourceEdition).toBe('KDC 제6판')
  })

  it('퀴즈는 주류당 3문항, 총 30문항이다', () => {
    expect(quizzes).toHaveLength(30)
    for (const c of mainClasses) {
      expect(quizzes.filter((q) => q.classificationId === c.id)).toHaveLength(3)
    }
  })

  it('모든 문항이 보기 4개, 해설, 힌트를 가진다', () => {
    for (const q of quizzes) {
      expect(q.options, q.id).toHaveLength(4)
      expect(q.explanation, q.id).not.toBe('')
      expect(q.hint, q.id).not.toBe('')
    }
  })

  it('네 가지 문항 유형을 모두 포함한다', () => {
    expect(new Set(quizzes.map((q) => q.type))).toEqual(new Set(QUIZ_TYPES))
  })

  it('모든 주류에 쉬운 설명·대표 주제·힌트가 있다', () => {
    for (const c of mainClasses) {
      expect(c.learnerDescription).not.toBe('')
      expect(c.exampleTopics.length).toBeGreaterThan(0)
      expect(c.hint).not.toBe('')
    }
  })
})
