import { describe, expect, it } from 'vitest'
import type { Quiz } from '../../types/index.ts'
import { createMission, missionReducer, type MissionAction, type MissionState } from './mission.ts'

function quiz(id: string): Quiz {
  return {
    id,
    classificationId: 'kdc-000',
    type: 'code-to-name',
    difficulty: 1,
    question: `${id}?`,
    options: ['정답', '오답1', '오답2', '오답3'],
    correctAnswer: '정답',
    explanation: '해설',
    hint: '힌트',
    reviewStatus: 'approved',
  }
}

function run(state: MissionState, ...actions: MissionAction[]): MissionState {
  return actions.reduce(missionReducer, state)
}

const twoQuizzes = () => createMission([quiz('a'), quiz('b')])

describe('missionReducer', () => {
  it('답을 고르지 않고 제출하면 안내만 하고 넘어가지 않는다', () => {
    const s = run(twoQuizzes(), { type: 'submit' })
    expect(s.needsSelection).toBe(true)
    expect(s.phase).toBe('question')
    expect(s.answers).toEqual([])
  })

  it('제출 전에는 선택을 바꿀 수 있고, 마지막 선택으로 판정한다', () => {
    const s = run(twoQuizzes(), { type: 'select', option: '오답1' }, { type: 'select', option: '정답' }, { type: 'submit' })
    expect(s.phase).toBe('feedback')
    expect(s.answers).toEqual([{ quizId: 'a', selected: '정답', correct: true, usedHint: false }])
  })

  it('제출한 뒤에는 선택을 바꿀 수 없고 다시 제출해도 중복 기록되지 않는다', () => {
    const s = run(
      twoQuizzes(),
      { type: 'select', option: '오답1' },
      { type: 'submit' },
      { type: 'select', option: '정답' },
      { type: 'submit' },
    )
    expect(s.answers).toHaveLength(1)
    expect(s.answers[0].correct).toBe(false)
  })

  it('힌트 사용 여부를 기록한다', () => {
    const s = run(twoQuizzes(), { type: 'showHint' }, { type: 'select', option: '정답' }, { type: 'submit' })
    expect(s.answers[0].usedHint).toBe(true)
  })

  it('다음 문제로 가면 선택과 힌트가 초기화된다', () => {
    const s = run(twoQuizzes(), { type: 'showHint' }, { type: 'select', option: '정답' }, { type: 'submit' }, { type: 'next' })
    expect(s.index).toBe(1)
    expect(s.phase).toBe('question')
    expect(s.selected).toBeNull()
    expect(s.hintShown).toBe(false)
  })

  it('마지막 문항 다음에는 결과 화면으로 간다', () => {
    const s = run(
      twoQuizzes(),
      { type: 'select', option: '정답' },
      { type: 'submit' },
      { type: 'next' },
      { type: 'select', option: '오답2' },
      { type: 'submit' },
      { type: 'next' },
    )
    expect(s.phase).toBe('result')
    expect(s.answers.map((a) => a.correct)).toEqual([true, false])
  })

  it('다시 시작하면 처음 상태로 돌아간다', () => {
    const s = run(twoQuizzes(), { type: 'select', option: '정답' }, { type: 'submit' }, { type: 'restart', quizzes: [quiz('b')] })
    expect(s).toEqual(createMission([quiz('b')]))
  })
})
