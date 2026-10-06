import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { useProgress } from '../../app/useProgress.ts'
import { getClassification, mainClasses } from '../../data/index.ts'
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
  /** 한 영역 미션이면 그 영역. 여러 영역을 이어 풀거나 오답 복습이면 없음 */
  classification?: Classification
  /** true면 여러 영역을 차례로 이어 푼다: 문제마다 지금 영역을 보여 주고, 영역을 마칠 때마다 저장한다. */
  journey?: boolean
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
export function Mission({ classification, journey = false, title, symbol, pool, kind, doneText, extraActions }: Props) {
  const { recordMission } = useProgress()
  const [state, dispatch] = useReducer(missionReducer, pool, (quizzes) => createMission(prepareMission(quizzes)))
  const [run, setRun] = useState({ id: 0, kind: kind as MissionKind })
  const recordedRun = useRef(-1)
  /** 이번 판에서 이미 저장한 영역 (이어 풀기) */
  const recordedAreas = useRef(new Set<string>())
  const quiz = currentQuiz(state)
  const total = state.quizzes.length
  const score = summarize(state.answers).score
  const streak = currentStreak(state.answers)
  const recordPerArea = journey && run.kind === 'mission'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [state.phase, state.index])

  // 이어 풀기: 한 영역의 문제를 모두 답하면 바로 그 영역을 완료로 저장한다 (중간에 그만둬도 남도록).
  useEffect(() => {
    if (!recordPerArea || state.answers.length === 0) return
    const areaId = state.quizzes[state.answers.length - 1].classificationId
    if (recordedAreas.current.has(areaId)) return
    const areaQuizIds = state.quizzes.filter((q) => q.classificationId === areaId).map((q) => q.id)
    const areaAnswers = state.answers.filter((a) => areaQuizIds.includes(a.quizId))
    if (areaAnswers.length < areaQuizIds.length) return
    recordedAreas.current.add(areaId)
    recordMission({ kind: 'mission', classificationId: areaId, answers: areaAnswers, finishedAt: new Date().toISOString() })
  }, [recordPerArea, state.answers, state.quizzes, recordMission])

  // 그 밖에는 결과가 나올 때 한 번 저장한다.
  useEffect(() => {
    if (state.phase !== 'result' || recordPerArea || recordedRun.current === run.id) return
    recordedRun.current = run.id
    recordMission({
      kind: run.kind,
      classificationId: classification?.id ?? null,
      answers: state.answers,
      finishedAt: new Date().toISOString(),
    })
  }, [state.phase, state.answers, run, classification, recordPerArea, recordMission])

  const restart = (quizzes: Quiz[], wrongOnly: boolean) => {
    recordedAreas.current = new Set()
    setRun((r) => ({ id: r.id + 1, kind: wrongOnly ? 'retry' : kind }))
    dispatch({ type: 'restart', quizzes: prepareMission(quizzes) })
  }

  // 이어 풀기에서는 지금 문제의 영역을 보여 준다.
  const area = journey && quiz && state.phase !== 'result' ? getClassification(quiz.classificationId) : classification
  const isNewArea =
    journey && state.phase === 'question' && quiz !== undefined && state.quizzes.findIndex((q) => q.classificationId === quiz.classificationId) === state.index

  return (
    <div className={styles.mission} style={area ? hueStyle(area.code) : undefined}>
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
        {journey && area && state.phase !== 'result' && (
          <div className={styles.areaBanner}>
            <span className={styles.areaSymbol} aria-hidden="true">
              {area.symbol}
            </span>
            <div>
              <p className={styles.areaName}>
                {area.code} {area.name} 구역
                <span className={styles.areaCount}>
                  {' '}
                  · 구역 {mainClasses.findIndex((c) => c.id === area.id) + 1} / {mainClasses.length}
                </span>
                {isNewArea && <span className={styles.newArea}>새 구역 도착!</span>}
              </p>
              <p className={styles.areaDesc}>{area.learnerDescription}</p>
            </div>
          </div>
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
          doneText={doneText}
          onRetry={() => restart(pool, false)}
          onRetryWrong={(wrong) => restart(wrong, true)}
          extraActions={extraActions}
        />
      )}
    </div>
  )
}
