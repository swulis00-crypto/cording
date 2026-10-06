// 학습 진행 상태를 브라우저 localStorage에 저장한다.
// 저장소를 쓸 수 없거나 데이터가 손상돼도 앱이 멈추지 않고 새 기록으로 시작한다. (PRD 8.3)
import { createEmptyProgress, MAX_ATTEMPTS, PROGRESS_VERSION } from '../features/progress/progress.ts'
import type { MissionAttempt, MissionKind, Progress } from '../types/index.ts'

export const STORAGE_KEY = 'kdc-explorer:progress'

export interface LoadResult {
  progress: Progress
  /** 저장된 기록이 손상돼 새로 시작했으면 true */
  recovered: boolean
}

function getStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((v): v is string => typeof v === 'string'))] : []
}

const KINDS: MissionKind[] = ['mission', 'retry', 'review']

function attemptList(value: unknown): MissionAttempt[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (a): a is MissionAttempt =>
        isRecord(a) &&
        KINDS.includes(a.kind as MissionKind) &&
        (a.classificationId === null || typeof a.classificationId === 'string') &&
        (a.ruleId === undefined || typeof a.ruleId === 'string') &&
        typeof a.finishedAt === 'string' &&
        [a.total, a.correct, a.score].every((n) => typeof n === 'number' && n >= 0),
    )
    .slice(-MAX_ATTEMPTS)
}

/** 저장된 값을 검사해 안전한 Progress로 바꾼다. 형식이 맞지 않으면 null. */
export function parseProgress(raw: unknown): Progress | null {
  if (!isRecord(raw) || raw.version !== PROGRESS_VERSION) return null

  const bestCorrect: Record<string, number> = {}
  if (isRecord(raw.bestCorrect)) {
    for (const [id, n] of Object.entries(raw.bestCorrect)) {
      if (typeof n === 'number' && Number.isInteger(n) && n >= 0) bestCorrect[id] = n
    }
  }
  const settings = isRecord(raw.settings) ? raw.settings : {}

  return {
    version: PROGRESS_VERSION,
    visitedClassifications: stringList(raw.visitedClassifications),
    completedClassifications: stringList(raw.completedClassifications),
    // 게임 2단계 이전에 저장된 기록에는 없으므로 빈 목록으로 시작한다.
    completedRules: stringList(raw.completedRules),
    bestCorrect,
    wrongQuestionIds: stringList(raw.wrongQuestionIds),
    quizAttempts: attemptList(raw.quizAttempts),
    unlockedBadges: stringList(raw.unlockedBadges),
    settings: { soundEnabled: settings.soundEnabled === true },
  }
}

export function loadProgress(): LoadResult {
  const storage = getStorage()
  let text: string | null = null
  try {
    text = storage?.getItem(STORAGE_KEY) ?? null
  } catch {
    text = null
  }
  if (text === null) return { progress: createEmptyProgress(), recovered: false }

  try {
    const progress = parseProgress(JSON.parse(text))
    if (progress) return { progress, recovered: false }
  } catch {
    // JSON이 깨진 경우 아래에서 새로 시작한다.
  }
  return { progress: createEmptyProgress(), recovered: true }
}

/** 저장에 성공하면 true (저장 공간 부족, 사용 금지 등은 false) */
export function saveProgress(progress: Progress): boolean {
  try {
    const storage = getStorage()
    if (!storage) return false
    storage.setItem(STORAGE_KEY, JSON.stringify(progress))
    return true
  } catch {
    return false
  }
}
