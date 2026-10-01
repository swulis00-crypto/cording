import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { isPreviewMode } from '../../app/preview.ts'
import { getClassification, getMissionQuizzes } from '../../data/index.ts'
import { Mission } from './Mission.tsx'
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
  return (
    <Mission
      key={classification.id}
      classification={classification}
      title={`${classification.code} ${classification.name} 미션`}
      symbol={classification.symbol}
      pool={pool}
      kind="mission"
    />
  )
}
