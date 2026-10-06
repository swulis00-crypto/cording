import { useState } from 'react'
import { Link } from 'react-router'
import { isPreviewMode } from '../app/preview.ts'
import { useProgress } from '../app/useProgress.ts'
import { getClassification, getMissionQuizzes, mainClasses } from '../data/index.ts'
import { Mission } from './quiz/Mission.tsx'
import styles from './quiz/Quiz.module.css'

/**
 * 게임 1단계: 000부터 900까지 구역을 차례로 돌며 영역마다 2문제씩, 20문제를 이어서 푼다.
 * 영역을 마칠 때마다 저장되므로, 다시 들어오면 아직 마치지 않은 첫 구역부터 이어 간다.
 */
export function JourneyScreen() {
  const { progress } = useProgress()
  const preview = isPreviewMode()

  // 들어온 순간의 출발점을 고정한다 (푸는 동안 저장돼도 문제 목록이 바뀌지 않게).
  const [plan] = useState(() => {
    const all = mainClasses.flatMap((c) => getMissionQuizzes(c.id, preview))
    const firstUndone = all.findIndex((q) => !progress.completedClassifications.includes(q.classificationId))
    const start = firstUndone === -1 ? 0 : firstUndone
    return { pool: all.slice(start), resumed: start > 0 }
  })

  if (plan.pool.length === 0) {
    return (
      <section className={styles.card}>
        <h1 className={styles.heading}>아직 열리지 않은 탐험이에요</h1>
        <p className={styles.gap}>문항은 선생님 검토가 끝나면 열려요.</p>
        <p className={styles.gap}>
          <Link to="/map">탐험 지도 보기</Link>
        </p>
      </section>
    )
  }

  const first = getClassification(plan.pool[0].classificationId)

  return (
    <>
      {plan.resumed && first && (
        <p className={styles.resumeNote} role="status">
          지난번에 이어서 {first.code} {first.name} 구역부터 출발해요.
        </p>
      )}
      <Mission
        journey
        title="지식 구역 탐험"
        symbol="🧭"
        pool={plan.pool}
        kind="mission"
        doneText="10개 구역의 서가가 모두 깨끗하게 복구됐어요."
        extraActions={
          <Link to="/levels" className="btn">
            게임 단계로
          </Link>
        }
      />
    </>
  )
}
