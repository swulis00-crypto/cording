// 퀴즈 규칙 (PRD 10.1). 화면과 분리한 순수 함수.
import type { Quiz, QuizType } from '../../types/index.ts'

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

/**
 * 미션용 문항: 문항 순서는 데이터 순서(쉬운 문항부터)를 지키고, 보기 순서만 섞는다.
 * 번호 조립의 숫자 카드는 찾기 쉽게 데이터 순서 그대로 둔다.
 */
export function prepareMission(quizzes: Quiz[], random: () => number = Math.random): Quiz[] {
  return quizzes.map((q) => (q.type === 'build-number' ? q : { ...q, options: shuffle(q.options, random) }))
}

export const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
  'name-recall': '🔢 번호 맞히기',
  'code-to-name': '🏷️ 이름표 찾기',
  'topic-to-classification': '📦 제자리 찾아 주기',
  'distinguish-similar': '🧠 도전 문제',
  'rule-inference': '🧩 규칙 추리',
  'build-number': '🔐 번호 조립',
}

const CORRECT_REACTIONS = ['책이 제자리를 찾았어요! 📚', '서가가 한결 깔끔해졌어요! ✨', '탐험대원다운 판단이에요! 🧭']
const WRONG_REACTIONS = [
  '앗, 책이 다른 서가로 갈 뻔했어요!',
  '헷갈리기 쉬운 문제였어요. 해설을 차근차근 읽어 봐요.',
  '괜찮아요! 틀린 문제가 제일 오래 기억에 남아요.',
]

/** 피드백 한마디. 같은 문항에는 늘 같은 문구가 나온다. */
export function reactionFor(quiz: Quiz, correct: boolean): string {
  const lines = correct ? CORRECT_REACTIONS : WRONG_REACTIONS
  const seed = [...quiz.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return lines[seed % lines.length]
}

/** 지금까지 연속으로 맞힌 문항 수 */
export function currentStreak(answers: AnswerRecord[]): number {
  let streak = 0
  for (let i = answers.length - 1; i >= 0 && answers[i].correct; i--) streak++
  return streak
}

/** "500 기술과학"처럼 번호로 시작하는 보기에서 분류번호를 꺼낸다. 책 제목 보기면 null. */
export function codeFromOption(option: string): string | null {
  return /^(\d{3})\s/.exec(option)?.[1] ?? null
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
