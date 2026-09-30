// 미션 진행 상태 (SCR-05 문제 → SCR-06 피드백 → SCR-07 결과)
import type { Quiz } from '../../types/index.ts'
import { checkAnswer, type AnswerRecord } from './engine.ts'

export type MissionPhase = 'question' | 'feedback' | 'result'

export interface MissionState {
  quizzes: Quiz[]
  index: number
  phase: MissionPhase
  /** 제출 전 고른 보기 (제출 전에는 바꿀 수 있다) */
  selected: string | null
  hintShown: boolean
  /** 고르지 않고 제출했을 때 안내 표시 */
  needsSelection: boolean
  answers: AnswerRecord[]
}

export type MissionAction =
  | { type: 'select'; option: string }
  | { type: 'showHint' }
  | { type: 'submit' }
  | { type: 'next' }
  | { type: 'restart'; quizzes: Quiz[] }

export function createMission(quizzes: Quiz[]): MissionState {
  return {
    quizzes,
    index: 0,
    phase: quizzes.length === 0 ? 'result' : 'question',
    selected: null,
    hintShown: false,
    needsSelection: false,
    answers: [],
  }
}

export function currentQuiz(state: MissionState): Quiz | undefined {
  return state.quizzes[state.index]
}

export function missionReducer(state: MissionState, action: MissionAction): MissionState {
  switch (action.type) {
    case 'select':
      if (state.phase !== 'question') return state
      return { ...state, selected: action.option, needsSelection: false }

    case 'showHint':
      if (state.phase !== 'question') return state
      return { ...state, hintShown: true }

    case 'submit': {
      const quiz = currentQuiz(state)
      if (state.phase !== 'question' || !quiz) return state
      if (state.selected === null) return { ...state, needsSelection: true }
      const record: AnswerRecord = {
        quizId: quiz.id,
        selected: state.selected,
        correct: checkAnswer(quiz, state.selected),
        usedHint: state.hintShown,
      }
      return { ...state, phase: 'feedback', answers: [...state.answers, record] }
    }

    case 'next':
      if (state.phase !== 'feedback') return state
      if (state.index >= state.quizzes.length - 1) return { ...state, phase: 'result' }
      return { ...state, index: state.index + 1, phase: 'question', selected: null, hintShown: false }

    case 'restart':
      return createMission(action.quizzes)
  }
}
