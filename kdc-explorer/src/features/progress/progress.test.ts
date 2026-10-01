import { describe, expect, it } from 'vitest'
import type { AnswerRecord } from '../quiz/engine.ts'
import { isLevelCompleted, isLevelUnlocked } from './levels.ts'
import {
  createEmptyProgress,
  hasProgress,
  learningStatus,
  MAX_ATTEMPTS,
  recordMission,
  resetProgress,
  setSoundEnabled,
  totalStars,
  visitClassification,
  type MissionResult,
} from './progress.ts'

function answers(...results: [string, boolean][]): AnswerRecord[] {
  return results.map(([quizId, correct]) => ({ quizId, selected: 'x', correct, usedHint: false }))
}

function mission(overrides: Partial<MissionResult> = {}): MissionResult {
  return {
    kind: 'mission',
    classificationId: 'kdc-600',
    answers: answers(['a', true], ['b', false], ['c', true]),
    finishedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('visitClassification', () => {
  it('처음 열면 학습 중이 되고, 두 번 열어도 중복 기록하지 않는다', () => {
    const once = visitClassification(createEmptyProgress(), 'kdc-000')
    expect(learningStatus(once, 'kdc-000')).toBe('in-progress')
    expect(visitClassification(once, 'kdc-000')).toBe(once)
  })
})

describe('recordMission', () => {
  it('영역 미션을 끝내면 학습 완료, 별(최고 정답 수), 시도 기록, 오답을 남긴다', () => {
    const p = recordMission(createEmptyProgress(), mission())
    expect(learningStatus(p, 'kdc-600')).toBe('completed')
    expect(p.bestCorrect['kdc-600']).toBe(2)
    expect(totalStars(p)).toBe(2)
    expect(p.quizAttempts).toEqual([
      { kind: 'mission', classificationId: 'kdc-600', finishedAt: '2026-10-01T00:00:00.000Z', total: 3, correct: 2, score: 20 },
    ])
    expect(p.wrongQuestionIds).toEqual(['b'])
  })

  it('재도전 기록은 쌓되, 완료는 중복 집계하지 않고 별은 더 높을 때만 바뀐다', () => {
    let p = recordMission(createEmptyProgress(), mission())
    p = recordMission(p, mission({ answers: answers(['a', false], ['b', false], ['c', false]) }))
    expect(p.completedClassifications).toEqual(['kdc-600'])
    expect(p.bestCorrect['kdc-600']).toBe(2)
    expect(p.quizAttempts).toHaveLength(2)
    p = recordMission(p, mission({ answers: answers(['a', true], ['b', true], ['c', true]) }))
    expect(p.bestCorrect['kdc-600']).toBe(3)
  })

  it('다시 맞힌 문항은 오답 목록에서 빠진다', () => {
    let p = recordMission(createEmptyProgress(), mission())
    p = recordMission(p, mission({ kind: 'review', classificationId: null, answers: answers(['b', true]) }))
    expect(p.wrongQuestionIds).toEqual([])
  })

  it('틀린 문제만 다시 풀기(retry)와 오답 복습(review)은 완료·별을 바꾸지 않는다', () => {
    let p = recordMission(createEmptyProgress(), mission({ kind: 'retry', answers: answers(['b', true]) }))
    expect(p.completedClassifications).toEqual([])
    expect(p.bestCorrect).toEqual({})
    p = recordMission(p, mission({ kind: 'review', classificationId: null, answers: answers(['b', true]) }))
    expect(totalStars(p)).toBe(0)
  })

  it('시도 기록은 최근 것만 남긴다', () => {
    let p = createEmptyProgress()
    for (let i = 0; i < MAX_ATTEMPTS + 5; i++) p = recordMission(p, mission())
    expect(p.quizAttempts).toHaveLength(MAX_ATTEMPTS)
  })
})

describe('hasProgress / resetProgress', () => {
  it('설정만 바꾼 것은 이어할 기록이 아니다', () => {
    expect(hasProgress(setSoundEnabled(createEmptyProgress(), true))).toBe(false)
    expect(hasProgress(visitClassification(createEmptyProgress(), 'kdc-000'))).toBe(true)
  })

  it('초기화하면 학습 기록은 지우고 설정은 남긴다', () => {
    const p = setSoundEnabled(recordMission(createEmptyProgress(), mission()), true)
    const reset = resetProgress(p)
    expect(hasProgress(reset)).toBe(false)
    expect(reset.settings.soundEnabled).toBe(true)
  })
})

describe('게임 단계 열림', () => {
  const ids = ['kdc-000', 'kdc-100']

  it('1단계는 항상 열려 있고, 2단계는 1단계 미션을 모두 마쳐야 열린다', () => {
    let p = createEmptyProgress()
    expect(isLevelUnlocked(1, p, ids, false)).toBe(true)
    expect(isLevelUnlocked(2, p, ids, false)).toBe(false)
    p = recordMission(p, mission({ classificationId: 'kdc-000' }))
    expect(isLevelCompleted(1, p, ids)).toBe(false)
    p = recordMission(p, mission({ classificationId: 'kdc-100' }))
    expect(isLevelCompleted(1, p, ids)).toBe(true)
    expect(isLevelUnlocked(2, p, ids, false)).toBe(true)
  })

  it('미리보기 모드에서는 모든 단계가 열린다', () => {
    expect(isLevelUnlocked(4, createEmptyProgress(), ids, true)).toBe(true)
  })
})
