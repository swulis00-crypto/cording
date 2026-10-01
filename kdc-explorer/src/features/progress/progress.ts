// 학습 진행 규칙 (PRD 10). 화면·저장소와 분리한 순수 함수.
import type { LearningStatus, MissionKind, Progress } from '../../types/index.ts'
import { summarize, type AnswerRecord } from '../quiz/engine.ts'

export const PROGRESS_VERSION = 1
/** 시도 기록은 최근 것만 남긴다. */
export const MAX_ATTEMPTS = 100

export function createEmptyProgress(): Progress {
  return {
    version: PROGRESS_VERSION,
    visitedClassifications: [],
    completedClassifications: [],
    bestCorrect: {},
    wrongQuestionIds: [],
    quizAttempts: [],
    unlockedBadges: [],
    settings: { soundEnabled: false },
  }
}

/** 이어할 학습 기록이 있는지 (설정만 바꾼 것은 기록으로 보지 않음) */
export function hasProgress(progress: Progress): boolean {
  return (
    progress.visitedClassifications.length > 0 ||
    progress.completedClassifications.length > 0 ||
    progress.quizAttempts.length > 0 ||
    progress.wrongQuestionIds.length > 0
  )
}

/** 학습 기록만 지우고 설정은 남긴다. */
export function resetProgress(progress: Progress): Progress {
  return { ...createEmptyProgress(), settings: { ...progress.settings } }
}

/** 영역 소개를 열면 '학습 중'이 된다. 이미 기록돼 있으면 같은 객체를 돌려준다. */
export function visitClassification(progress: Progress, classificationId: string): Progress {
  if (progress.visitedClassifications.includes(classificationId)) return progress
  return { ...progress, visitedClassifications: [...progress.visitedClassifications, classificationId] }
}

export interface MissionResult {
  kind: MissionKind
  classificationId: string | null
  answers: AnswerRecord[]
  finishedAt: string
}

/**
 * 끝난 미션을 기록한다.
 * - 시도 기록은 덮어쓰지 않고 쌓는다 (PRD 10.2).
 * - 영역 완료와 별(최고 정답 수)은 영역 미션 전체를 풀었을 때만 갱신하고, 중복 집계하지 않는다.
 * - 틀린 문항은 오답 목록에 넣고, 다시 맞힌 문항은 뺀다.
 */
export function recordMission(progress: Progress, result: MissionResult): Progress {
  const summary = summarize(result.answers)
  const attempt = {
    kind: result.kind,
    classificationId: result.classificationId,
    finishedAt: result.finishedAt,
    total: summary.total,
    correct: summary.correctCount,
    score: summary.score,
  }

  let { completedClassifications, bestCorrect } = progress
  const id = result.classificationId
  if (result.kind === 'mission' && id !== null) {
    if (!completedClassifications.includes(id)) completedClassifications = [...completedClassifications, id]
    if ((bestCorrect[id] ?? -1) < summary.correctCount) bestCorrect = { ...bestCorrect, [id]: summary.correctCount }
  }

  const wrong = new Set(progress.wrongQuestionIds)
  for (const answer of result.answers) {
    if (answer.correct) wrong.delete(answer.quizId)
    else wrong.add(answer.quizId)
  }

  const visited =
    id !== null && !progress.visitedClassifications.includes(id)
      ? [...progress.visitedClassifications, id]
      : progress.visitedClassifications

  return {
    ...progress,
    visitedClassifications: visited,
    completedClassifications,
    bestCorrect,
    wrongQuestionIds: [...wrong],
    quizAttempts: [...progress.quizAttempts, attempt].slice(-MAX_ATTEMPTS),
  }
}

export function learningStatus(progress: Progress, classificationId: string): LearningStatus {
  if (progress.completedClassifications.includes(classificationId)) return 'completed'
  if (progress.visitedClassifications.includes(classificationId)) return 'in-progress'
  return 'not-started'
}

/** 지금까지 모은 별 = 영역별 최고 정답 수의 합 */
export function totalStars(progress: Progress): number {
  return Object.values(progress.bestCorrect).reduce((sum, n) => sum + n, 0)
}

export function setSoundEnabled(progress: Progress, soundEnabled: boolean): Progress {
  return { ...progress, settings: { ...progress.settings, soundEnabled } }
}
