import { useEffect, useMemo, useReducer, useState } from 'react'
import { Link, useParams } from 'react-router'
import { isPreviewMode } from '../../app/preview.ts'
import { getClassification, getMissionQuizzes } from '../../data/index.ts'
import { prepareMission, summarize } from '../../features/quiz/engine.ts'
import { createMission, currentQuiz, missionReducer } from '../../features/quiz/mission.ts'
import type { Classification, Quiz } from '../../types/index.ts'
import { hueStyle } from '../../utils/hue.ts'
import { FeedbackView } from './FeedbackView.tsx'
import { QuestionView } from './QuestionView.tsx'
import { ResultView } from './ResultView.tsx'
import styles from './Quiz.module.css'

/** SCR-05 미션 · SCR-06 피드백 · SCR-07 결과 */
export function QuizScreen() {
  const { id = '' } = useParams()
  const classification = getClassification(id)
  const preview = isPreviewMode()
  const pool = useMemo(() => getMissionQuizzes(id, preview), [id, preview])

  if (!classification) {
    return (
      <section className={styles.card}>
        <h1 className={styles.heading}>영역을 찾을 수 없어요</h1>
        <p className={styles.gap}>
          <Link to="/map">탐험 지도로 돌아가기</Link>
        </p>
      </section>
    )
  }

  if (pool.length === 0) {
    return (
      <section className={styles.card}>
        <h1 className={styles.heading}>아직 열리지 않은 미션이에요</h1>
        <p className={styles.gap}>이 영역의 문항은 선생님 검토가 끝나면 열려요.</p>
        <p className={styles.gap}>
          <Link to={`/classification/${classification.id}`}>영역 소개로 돌아가기</Link>
        </p>
      </section>
    )
  }

  // 영역이 바뀌면 미션을 새로 시작한다.
  return <Mission key={classification.id} classification={classification} pool={pool} />
}

function Mission({ classification, pool }: { classification: Classification; pool: Quiz[] }) {
  const [state, dispatch] = useReducer(missionReducer, pool, (quizzes) => createMission(prepareMission(quizzes)))
  const [retryingWrong, setRetryingWrong] = useState(false)
  const quiz = currentQuiz(state)
  const total = state.quizzes.length
  const score = summarize(state.answers).score

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [state.phase, state.index])

  const restart = (quizzes: Quiz[], wrongOnly: boolean) => {
    setRetryingWrong(wrongOnly)
    dispatch({ type: 'restart', quizzes: prepareMission(quizzes) })
  }

  return (
    <div className={styles.mission} style={hueStyle(classification.code)}>
      <header className={styles.missionHeader}>
        <p className={styles.missionTitle}>
          <span aria-hidden="true">{classification.symbol} </span>
          {classification.code} {classification.name} 미션
          {retryingWrong && <span className={styles.modeTag}>틀린 문제 다시 풀기</span>}
        </p>
        {state.phase !== 'result' && (
          <div className={styles.status}>
            <span>
              문제 {state.index + 1} / {total}
            </span>
            <span>점수 {score}점</span>
          </div>
        )}
        {state.phase !== 'result' && (
          <progress
            className={styles.progress}
            value={state.answers.length}
            max={total}
            aria-label={`${total}문제 중 ${state.answers.length}문제 완료`}
          />
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
        />
      )}
    </div>
  )
}
