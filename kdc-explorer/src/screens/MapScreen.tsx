import { Link } from 'react-router'
import { useProgress } from '../app/useProgress.ts'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { mainClasses } from '../data/index.ts'
import { learningStatus, totalStars } from '../features/progress/progress.ts'
import { hueStyle } from '../utils/hue.ts'
import styles from './MapScreen.module.css'

/** SCR-03 탐험 지도 */
export function MapScreen() {
  const { progress } = useProgress()
  const completed = mainClasses.filter((c) => learningStatus(progress, c.id) === 'completed').length

  return (
    <section aria-labelledby="map-title">
      <h1 id="map-title" className={styles.title}>
        탐험 지도
      </h1>
      <p className={styles.intro}>
        구역을 골라 설명을 다시 읽거나, 그 구역 문제만 다시 풀 수 있어요. 처음이라면 차례로 도는 탐험부터 시작해 보세요.
      </p>
      <p className={styles.journeyLink}>
        <Link to="/journey" className="btn btn-primary">
          <span aria-hidden="true">🧭 </span>10개 구역 차례로 탐험하기
        </Link>
      </p>
      <p className={styles.summary}>
        <span>
          미션 완료 {completed} / {mainClasses.length}
        </span>
        <span>
          <span aria-hidden="true">⭐ </span>모은 별 {totalStars(progress)}개
        </span>
      </p>

      <ol className={styles.grid}>
        {mainClasses.map((c) => (
          <li key={c.id}>
            <Link to={`/classification/${c.id}`} className={styles.tile} style={hueStyle(c.code)}>
              <span className={styles.symbol} aria-hidden="true">
                {c.symbol}
              </span>
              <span className={styles.code}>{c.code}</span>
              <span className={styles.name}>{c.name}</span>
              <StatusBadge status={learningStatus(progress, c.id)} />
              {progress.bestCorrect[c.id] !== undefined && (
                <span className={styles.stars}>
                  <span aria-hidden="true">⭐ </span>
                  {progress.bestCorrect[c.id]}개
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
