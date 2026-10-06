import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { useProgress } from '../../app/useProgress.ts'
import { getClassification } from '../../data/index.ts'
import type { MissionResult } from '../../features/progress/progress.ts'
import { currentStreak, prepareMission, summarize } from '../../features/quiz/engine.ts'
import { createMission, currentQuiz, missionReducer } from '../../features/quiz/mission.ts'
import type { Classification, MissionKind, Quiz } from '../../types/index.ts'
import { hueStyle } from '../../utils/hue.ts'
import { FeedbackView } from './FeedbackView.tsx'
import { QuestionView } from './QuestionView.tsx'
import { ResultView } from './ResultView.tsx'
import { ShelfTracker } from './ShelfTracker.tsx'
import styles from './Quiz.module.css'

/** 여러 묶음(구역, 규칙 …)을 이어 풀 때의 설정 */
export interface MissionGroups {
  /** 문제가 속한 묶음 */
  keyOf: (quiz: Quiz) => string
  /** 문제 위에 보여 줄 묶음 안내. 묶음의 첫 문제면 isFirst가 true */
  renderBanner: (quiz: Quiz, isFirst: boolean) => ReactNode
  /** 묶음을 다 풀었을 때 무엇을 마친 것으로 저장할지 */
  toResult: (key: string) => Pick<MissionResult, 'classificationId' | 'ruleId'>
}

interface Props {
  /** 한 영역 미션이면 그 영역. 여러 묶음을 이어 풀거나 오답 복습이면 없음 */
  classification?: Classification
  /** 여러 묶음을 이어 풀기: 문제마다 묶음 안내를 보여 주고, 묶음을 마칠 때마다 저장한다. */
  groups?: MissionGroups
  title: string
  symbol: string
  pool: Quiz[]
  kind: Extract<MissionKind, 'mission' | 'review'>
  /** 결과 화면의 완료 문구 */
  doneText?: string
  /** 결과 화면에 덧붙일 버튼 */
  extraActions?: ReactNode
}

/** 문제 → 피드백 → (다음 문제 …) → 결과 진행과 진행 기록 저장 */
export function Mission({ classification, groups, title, symbol, pool, kind, doneText, extraActions }: Props) {
  const { recordMission } = useProgress()
  const [state, dispatch] = useReducer(missionReducer, pool, (quizzes) => createMission(prepareMission(quizzes)))
  const [run, setRun] = useState({ id: 0, kind: kind as MissionKind })
  const recordedRun = useRef(-1)
  /** 이번 판에서 이미 저장한 묶음 */
  const recordedGroups = useRef(new Set<string>())
  const quiz = currentQuiz(state)
  const total = state.quizzes.length
  const score = summarize(state.answers).score
  const streak = currentStreak(state.answers)
  const recordPerGroup = groups !== undefined && run.kind === 'mission'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [state.phase, state.index])

  // 이어 풀기: 한 묶음의 문제를 모두 답하면 바로 저장한다 (중간에 그만둬도 남도록).
  useEffect(() => {
    if (!recordPerGroup || !groups || state.answers.length === 0) return
    const key = groups.keyOf(state.quizzes[state.answers.length - 1])
    if (recordedGroups.current.has(key)) return
    const groupQuizIds = state.quizzes.filter((q) => groups.keyOf(q) === key).map((q) => q.id)
    const groupAnswers = state.answers.filter((a) => groupQuizIds.includes(a.quizId))
    if (groupAnswers.length < groupQuizIds.length) return
    recordedGroups.current.add(key)
    recordMission({ kind: 'mission', ...groups.toResult(key), answers: groupAnswers, finishedAt: new Date().toISOString() })
  }, [recordPerGroup, groups, state.answers, state.quizzes, recordMission])

  // 그 밖에는 결과가 나올 때 한 번 저장한다.
  useEffect(() => {
    if (state.phase !== 'result' || recordPerGroup || recordedRun.current === run.id) return
    recordedRun.current = run.id
    recordMission({
      kind: run.kind,
      classificationId: classification?.id ?? null,
      answers: state.answers,
      finishedAt: new Date().toISOString(),
    })
  }, [state.phase, state.answers, run, classification, recordPerGroup, recordMission])

  const restart = (quizzes: Quiz[], wrongOnly: boolean) => {
    recordedGroups.current = new Set()
    setRun((r) => ({ id: r.id + 1, kind: wrongOnly ? 'retry' : kind }))
    dispatch({ type: 'restart', quizzes: prepareMission(quizzes) })
  }

  // 지금 문제의 영역 색을 쓴다.
  const inPlay = state.phase !== 'result' && quiz !== undefined
  const hueCode = (inPlay ? getClassification(quiz.classificationId)?.code : undefined) ?? classification?.code
  const isFirstOfGroup =
    groups !== undefined &&
    inPlay &&
    state.phase === 'question' &&
    state.quizzes.findIndex((q) => groups.keyOf(q) === groups.keyOf(quiz)) === state.index

  return (
    <div className={styles.mission} style={hueCode ? hueStyle(hueCode) : undefined}>
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
            <ShelfTracker quizzes={state.quizzes} answers={state.answers} groupOf={groups?.keyOf} />
          </>
        )}
        {groups && inPlay && groups.renderBanner(quiz, isFirstOfGroup)}
      </header>

      {state.phase === 'question' && quiz && (
        <QuestionView
          key={quiz.id}
          quiz={quiz}
          selected={state.selected}
          hintShown={state.hintShown}
          needsSelection={state.needsSelection}
          onSelect={(option) => dispatch({ type: 'select', option })}
          onClear={() => dispatch({ type: 'deselect' })}
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
          doneText={doneText}
          onRetry={() => restart(pool, false)}
          onRetryWrong={(wrong) => restart(wrong, true)}
          extraActions={extraActions}
        />
      )}
    </div>
  )
}
