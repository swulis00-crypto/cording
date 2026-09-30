// 퀴즈 규칙 (PRD 10.1). 화면과 분리한 순수 함수.
import type { Quiz } from '../../types/index.ts'

export const POINTS_PER_CORRECT = 10

export interface AnswerRecord {
  quizId: string
  selected: string
  correct: boolean
  usedHint: boolean
}

export interface MissionSummary {
  total: number
  correctCount: number
  /** 정답률(%) — 소수점은 반올림 */
  accuracy: number
  score: number
  /** 맞힌 문항 1개당 별 1개 */
  stars: number
}

/** 기본 플레이에서는 approved 문항만, 미리보기 모드에서는 모든 문항을 출제한다. */
export function getPlayableQuizzes(quizzes: Quiz[], preview: boolean): Quiz[] {
  return preview ? quizzes : quizzes.filter((q) => q.reviewStatus === 'approved')
}

export function checkAnswer(quiz: Quiz, selected: string): boolean {
  return selected === quiz.correctAnswer
}

/** 원본을 바꾸지 않고 섞은 새 배열을 돌려준다. (Fisher–Yates) */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** 미션용 문항: 문항 순서는 데이터 순서(쉬운 문항부터)를 지키고, 보기 순서만 섞는다. */
export function prepareMission(quizzes: Quiz[], random: () => number = Math.random): Quiz[] {
  return quizzes.map((q) => ({ ...q, options: shuffle(q.options, random) }))
}

export function summarize(answers: AnswerRecord[]): MissionSummary {
  const total = answers.length
  const correctCount = answers.filter((a) => a.correct).length
  return {
    total,
    correctCount,
    accuracy: total === 0 ? 0 : Math.round((correctCount / total) * 100),
    score: correctCount * POINTS_PER_CORRECT,
    stars: correctCount,
  }
}
