import { describe, expect, it } from 'vitest'
import type { Quiz } from '../../types/index.ts'
import { checkAnswer, getPlayableQuizzes, prepareMission, shuffle, summarize, type AnswerRecord } from './engine.ts'

function quiz(overrides: Partial<Quiz> = {}): Quiz {
  return {
    id: 'q1',
    classificationId: 'kdc-000',
    type: 'code-to-name',
    difficulty: 1,
    question: '000은?',
    options: ['총류', '철학', '종교', '역사'],
    correctAnswer: '총류',
    explanation: '해설',
    hint: '',
    reviewStatus: 'approved',
    ...overrides,
  }
}

function answer(correct: boolean, id = 'q'): AnswerRecord {
  return { quizId: id, selected: 'x', correct, usedHint: false }
}

describe('checkAnswer', () => {
  it('정답과 같으면 true', () => {
    expect(checkAnswer(quiz(), '총류')).toBe(true)
  })

  it('정답과 다르면 false', () => {
    expect(checkAnswer(quiz(), '철학')).toBe(false)
  })

  it('번호 문자열을 정확히 비교한다 ("000"과 "0"은 다름)', () => {
    const q = quiz({ options: ['000', '100', '200', '300'], correctAnswer: '000' })
    expect(checkAnswer(q, '000')).toBe(true)
    expect(checkAnswer(q, '0')).toBe(false)
  })
})

describe('summarize', () => {
  it('정답 수, 정답률, 점수(정답 10점, 오답 0점), 별을 계산한다', () => {
    expect(summarize([answer(true), answer(false), answer(true)])).toEqual({
      total: 3,
      correctCount: 2,
      accuracy: 67,
      score: 20,
      stars: 2,
    })
  })

  it('모두 맞히면 100%', () => {
    expect(summarize([answer(true), answer(true)]).accuracy).toBe(100)
  })

  it('모두 틀리면 0%, 0점', () => {
    const s = summarize([answer(false), answer(false), answer(false)])
    expect(s.accuracy).toBe(0)
    expect(s.score).toBe(0)
  })

  it('문항이 없으면 0으로 나누지 않고 0%', () => {
    expect(summarize([])).toEqual({ total: 0, correctCount: 0, accuracy: 0, score: 0, stars: 0 })
  })

  it('힌트를 써도 점수가 깎이지 않는다', () => {
    expect(summarize([{ ...answer(true), usedHint: true }]).score).toBe(10)
  })
})

describe('getPlayableQuizzes', () => {
  const all = [quiz({ id: 'a' }), quiz({ id: 'b', reviewStatus: 'draft' }), quiz({ id: 'c', reviewStatus: 'needs-review' })]

  it('기본 플레이에서는 approved 문항만 출제한다', () => {
    expect(getPlayableQuizzes(all, false).map((q) => q.id)).toEqual(['a'])
  })

  it('미리보기 모드에서는 모든 문항을 출제한다', () => {
    expect(getPlayableQuizzes(all, true).map((q) => q.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('shuffle / prepareMission', () => {
  it('원소를 잃지 않고 원본을 바꾸지 않는다', () => {
    const original = [1, 2, 3, 4, 5]
    const result = shuffle(original)
    expect([...result].sort()).toEqual(original)
    expect(original).toEqual([1, 2, 3, 4, 5])
  })

  it('보기만 섞고 문항 순서와 정답은 유지한다', () => {
    const quizzes = [quiz({ id: 'a' }), quiz({ id: 'b' })]
    const reversed = prepareMission(quizzes, () => 0)
    expect(reversed.map((q) => q.id)).toEqual(['a', 'b'])
    expect(reversed[0].options).not.toEqual(quizzes[0].options)
    expect(reversed[0].options).toContain(reversed[0].correctAnswer)
  })
})
