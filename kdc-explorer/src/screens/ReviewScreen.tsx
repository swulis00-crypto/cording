import { useState } from 'react'
import { Link } from 'react-router'
import { isPreviewMode } from '../app/preview.ts'
import { useProgress } from '../app/useProgress.ts'
import { allQuizzes, getClassification, getRule } from '../data/index.ts'
import { getPlayableQuizzes } from '../features/quiz/engine.ts'
import type { Quiz } from '../types/index.ts'
import { Mission } from './quiz/Mission.tsx'
import styles from './Pages.module.css'

/** SCR-09 오답 복습: 저장된 오답 문항을 다시 푼다. 다시 맞히면 목록에서 빠진다. */
export function ReviewScreen() {
  const { progress } = useProgress()
  // 복습을 시작한 순간의 문항을 고정한다 (푸는 동안 목록이 바뀌어도 미션은 그대로).
  const [session, setSession] = useState<{ id: number; pool: Quiz[] } | null>(null)

  const wrongIds = new Set(progress.wrongQuestionIds)
  const wrongQuizzes = getPlayableQuizzes(allQuizzes, isPreviewMode()).filter((q) => wrongIds.has(q.id))

  if (session) {
    return (
      <Mission
        key={session.id}
        title="오답 복습"
        symbol="🔁"
        pool={session.pool}
        kind="review"
        extraActions={
          <button type="button" className="btn" onClick={() => setSession(null)}>
            복습 목록으로
          </button>
        }
      />
    )
  }

  return (
    <section aria-labelledby="review-title">
      <h1 id="review-title" className={styles.title}>
        오답 복습
      </h1>

      {wrongQuizzes.length === 0 ? (
        <div className={styles.card}>
          <p className={styles.bigIcon} aria-hidden="true">
            🎉
          </p>
          <p>지금은 복습할 문항이 없어요. 미션에서 틀린 문제가 생기면 여기에 모여요.</p>
          <p className={styles.gap}>
            <Link to="/map">탐험 지도로 가기</Link>
          </p>
        </div>
      ) : (
        <>
          <p className={styles.intro}>
            길을 헤매는 책이 <strong>{wrongQuizzes.length}권</strong> 있어요. 다시 맞히면 목록에서 빠져요.
          </p>
          <ul className={styles.reviewItems}>
            {wrongQuizzes.map((q) => {
              const c = getClassification(q.classificationId)
              const rule = q.rule ? getRule(q.rule) : undefined
              const where = rule ? rule.title : c ? `${c.code} ${c.name}` : ''
              return (
                <li key={q.id}>
                  <span className={styles.reviewArea}>{where}</span>
                  {q.book ? `『${q.book.title}』` : q.question}
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setSession((s) => ({ id: (s?.id ?? 0) + 1, pool: wrongQuizzes }))}
          >
            복습 시작 ({wrongQuizzes.length}문제)
          </button>
        </>
      )}
    </section>
  )
}
