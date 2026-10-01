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
      <p className={styles.intro}>가고 싶은 지식 영역을 골라 보세요. 10개 영역 모두 자유롭게 탐험할 수 있어요.</p>
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
