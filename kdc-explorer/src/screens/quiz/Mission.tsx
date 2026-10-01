import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { useProgress } from '../../app/useProgress.ts'
import { currentStreak, prepareMission, summarize } from '../../features/quiz/engine.ts'
import { createMission, currentQuiz, missionReducer } from '../../features/quiz/mission.ts'
import type { Classification, MissionKind, Quiz } from '../../types/index.ts'
import { hueStyle } from '../../utils/hue.ts'
import { FeedbackView } from './FeedbackView.tsx'
import { QuestionView } from './QuestionView.tsx'
import { ResultView } from './ResultView.tsx'
import { ShelfTracker } from './ShelfTracker.tsx'
import styles from './Quiz.module.css'

interface Props {
  /** 영역 미션이면 그 영역, 오답 복습이면 없음 */
  classification?: Classification
  title: string
  symbol: string
  pool: Quiz[]
  kind: Extract<MissionKind, 'mission' | 'review'>
  /** 결과 화면에 덧붙일 버튼 */
  extraActions?: ReactNode
}

/** 문제 → 피드백 → 결과 진행. 결과가 나오면 한 번만 진행 기록에 남긴다. */
export function Mission({ classification, title, symbol, pool, kind, extraActions }: Props) {
  const { recordMission } = useProgress()
  const [state, dispatch] = useReducer(missionReducer, pool, (quizzes) => createMission(prepareMission(quizzes)))
  const [run, setRun] = useState({ id: 0, kind: kind as MissionKind })
  const recordedRun = useRef(-1)
  const quiz = currentQuiz(state)
  const total = state.quizzes.length
  const score = summarize(state.answers).score
  const streak = currentStreak(state.answers)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [state.phase, state.index])

  useEffect(() => {
    if (state.phase !== 'result' || recordedRun.current === run.id) return
    recordedRun.current = run.id
    recordMission({
      kind: run.kind,
      classificationId: classification?.id ?? null,
      answers: state.answers,
      finishedAt: new Date().toISOString(),
    })
  }, [state.phase, state.answers, run, classification, recordMission])

  const restart = (quizzes: Quiz[], wrongOnly: boolean) => {
    setRun((r) => ({ id: r.id + 1, kind: wrongOnly ? 'retry' : kind }))
    dispatch({ type: 'restart', quizzes: prepareMission(quizzes) })
  }

  return (
    <div className={styles.mission} style={classification ? hueStyle(classification.code) : undefined}>
      <header className={styles.missionHeader}>
        <p className={styles.missionTitle}>
          <span aria-hidden="true">{symbol} </span>
          {title}
          {run.kind === 'retry' && <span className={styles.modeTag}>헤매는 책 다시 찾기</span>}
        </p>
        {state.phase !== 'result' && (
          <>
            <div className={styles.status}>
              <span>
                문제 {state.index + 1} / {total}
              </span>
              {streak >= 2 && (
                <span className={styles.streak}>
                  <span aria-hidden="true">🔥 </span>
                  {streak}연속 정답!
                </span>
              )}
              <span>점수 {score}점</span>
            </div>
            <ShelfTracker quizzes={state.quizzes} answers={state.answers} />
          </>
        )}
      </header>

      {state.phase === 'question' && quiz && (
        <QuestionView
          key={quiz.id}
          quiz={quiz}
          selected={state.selected}
          hintShown={state.hintShown}
          needsSelection={state.needsSelection}
          onSelect={(option) => dispatch({ type: 'select', option })}
          onHint={() => dispatch({ type: 'showHint' })}
          onSubmit={() => dispatch({ type: 'submit' })}
        />
      )}

      {state.phase === 'feedback' && quiz && (
        <FeedbackView
          key={quiz.id}
          quiz={quiz}
          answer={state.answers[state.answers.length - 1]}
          isLast={state.index === total - 1}
          onNext={() => dispatch({ type: 'next' })}
        />
      )}

      {state.phase === 'result' && (
        <ResultView
          classification={classification}
          quizzes={state.quizzes}
          answers={state.answers}
          onRetry={() => restart(pool, false)}
          onRetryWrong={(wrong) => restart(wrong, true)}
          extraActions={extraActions}
        />
      )}
    </div>
  )
}
