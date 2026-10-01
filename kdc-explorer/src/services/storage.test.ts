import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEmptyProgress, recordMission } from '../features/progress/progress.ts'
import { loadProgress, parseProgress, saveProgress, STORAGE_KEY } from './storage.ts'

const sample = recordMission(createEmptyProgress(), {
  kind: 'mission',
  classificationId: 'kdc-600',
  answers: [
    { quizId: 'a', selected: 'x', correct: true, usedHint: false },
    { quizId: 'b', selected: 'y', correct: false, usedHint: true },
  ],
  finishedAt: '2026-10-01T00:00:00.000Z',
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('저장과 복원', () => {
  it('기록이 없으면 빈 진행 상태로 시작한다 (손상 안내 없음)', () => {
    expect(loadProgress()).toEqual({ progress: createEmptyProgress(), recovered: false })
  })

  it('저장한 기록을 그대로 복원한다', () => {
    expect(saveProgress(sample)).toBe(true)
    expect(loadProgress()).toEqual({ progress: sample, recovered: false })
  })

  it('JSON이 깨져 있으면 새로 시작하고 손상을 알린다', () => {
    localStorage.setItem(STORAGE_KEY, '{broken')
    expect(loadProgress()).toEqual({ progress: createEmptyProgress(), recovered: true })
  })

  it('버전이 다르면 새로 시작하고 손상을 알린다', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...sample, version: 99 }))
    expect(loadProgress().recovered).toBe(true)
  })

  it('저장소를 쓸 수 없어도 앱이 멈추지 않는다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(loadProgress()).toEqual({ progress: createEmptyProgress(), recovered: false })
    expect(saveProgress(sample)).toBe(false)
  })
})

describe('parseProgress', () => {
  it('잘못된 필드는 버리고 쓸 수 있는 값만 남긴다', () => {
    const parsed = parseProgress({
      version: 1,
      visitedClassifications: ['kdc-000', 3, 'kdc-000'],
      completedClassifications: 'kdc-100',
      bestCorrect: { 'kdc-000': 2, 'kdc-100': -1, 'kdc-200': 'x' },
      wrongQuestionIds: ['q1'],
      quizAttempts: [{ kind: 'mission', classificationId: 'kdc-000', finishedAt: 't', total: 3, correct: 2, score: 20 }, { kind: '?' }],
      settings: { soundEnabled: 'yes' },
    })
    expect(parsed).toEqual({
      ...createEmptyProgress(),
      visitedClassifications: ['kdc-000'],
      bestCorrect: { 'kdc-000': 2 },
      wrongQuestionIds: ['q1'],
      quizAttempts: [{ kind: 'mission', classificationId: 'kdc-000', finishedAt: 't', total: 3, correct: 2, score: 20 }],
    })
  })

  it('객체가 아니면 null', () => {
    expect(parseProgress(null)).toBeNull()
    expect(parseProgress([])).toBeNull()
  })
})
