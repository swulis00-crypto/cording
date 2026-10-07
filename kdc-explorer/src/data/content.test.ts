// 실제 학습 데이터 파일 검사
import { describe, expect, it } from 'vitest'
import { authorMark } from '../features/author/authorMark.ts'
import { allQuizzes, authorSteps, dataErrors, level2Quizzes, level3Quizzes, mainClasses, quizzes, rules } from './index.ts'

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

  it('퀴즈는 주류당 2문항(손님 부탁 1 + 도전 1), 총 20문항이다', () => {
    expect(quizzes).toHaveLength(20)
    for (const c of mainClasses) {
      const types = quizzes.filter((q) => q.classificationId === c.id).map((q) => q.type)
      expect(types, c.id).toEqual(['topic-to-classification', 'distinguish-similar'])
    }
  })

  it('모든 문항이 보기 4개, 해설, 힌트를 가진다', () => {
    for (const q of quizzes) {
      expect(q.options, q.id).toHaveLength(4)
      expect(q.explanation, q.id).not.toBe('')
      expect(q.hint, q.id).not.toBe('')
    }
  })

  it('한 문항에서 두 가지를 묻지 않는다 ("A / B" 형태 보기 없음)', () => {
    for (const q of quizzes) {
      for (const option of q.options) expect(option, q.id).not.toContain(' / ')
    }
  })

  it('책이나 손님이 나오는 문항은 가상 예시로 표시된다', () => {
    for (const q of quizzes.filter((q) => q.book || q.character)) {
      expect(q.fictional, q.id).toBe(true)
    }
  })

  it('게임 2단계: 규칙 4개(6·3·3·3문항, 사회과학 포함)이고 규칙마다 번호 조립 문항을 포함한다', () => {
    expect(rules.map((r) => r.id)).toEqual(['rule-1', 'rule-2', 'rule-3', 'rule-4'])
    for (const r of rules) {
      const qs = level2Quizzes.filter((q) => q.rule === r.id)
      expect(qs.length, r.id).toBe(r.id === 'rule-1' ? 6 : 3)
      expect(qs.some((q) => q.type === 'build-number'), r.id).toBe(true)
    }
    expect(level2Quizzes.filter((q) => q.classificationId === 'kdc-300').length).toBeGreaterThanOrEqual(2)
  })

  it('모든 게임 단계의 문항 id가 겹치지 않고, 2단계 문항도 해설과 힌트를 가진다', () => {
    const ids = allQuizzes.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const q of level2Quizzes) {
      expect(q.explanation, q.id).not.toBe('')
      expect(q.hint, q.id).not.toBe('')
      if (q.book || q.character) expect(q.fictional, q.id).toBe(true)
    }
  })

  it('게임 3단계: 단계 4개, 모든 단계에 문항이 있고 저자기호 만들기 문항을 포함한다', () => {
    expect(authorSteps.map((s) => s.id)).toEqual(['author-1', 'author-2', 'author-3', 'author-4'])
    for (const s of authorSteps) expect(level3Quizzes.some((q) => q.rule === s.id), s.id).toBe(true)
    expect(level3Quizzes.some((q) => q.type === 'build-author')).toBe(true)
  })

  it('게임 3단계: 책이 나오는 문항의 정답 저자기호가 기호표 계산과 같다', () => {
    // 책 → 작가 짝 (작가 이름은 문항 문장 속에 있으므로 여기서 짝을 정해 검사한다)
    const authors: Record<string, string> = {
      아몬드: '손원평',
      페인트: '이희영',
      '불편한 편의점': '김호연',
      '우리가 빛의 속도로 갈 수 없다면': '김초엽',
      '소년이 온다': '한강',
    }
    const withBook = level3Quizzes.filter((q) => q.book)
    expect(withBook.length).toBeGreaterThan(0)
    for (const q of withBook) {
      const author = authors[q.book!.title]
      expect(author, q.id).toBeDefined()
      expect(q.correctAnswer, q.id).toBe(authorMark(author, q.book!.title))
    }
  })

  it('모든 주류에 쉬운 설명·대표 주제·힌트가 있다', () => {
    for (const c of mainClasses) {
      expect(c.learnerDescription).not.toBe('')
      expect(c.exampleTopics.length).toBeGreaterThan(0)
      expect(c.hint).not.toBe('')
    }
  })
})
