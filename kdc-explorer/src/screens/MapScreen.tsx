import { Link } from 'react-router'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { mainClasses } from '../data/index.ts'
import { getLearningStatus } from '../features/progress/status.ts'
import { hueStyle } from '../utils/hue.ts'
import styles from './MapScreen.module.css'

/** SCR-03 탐험 지도 */
export function MapScreen() {
  return (
    <section aria-labelledby="map-title">
      <h1 id="map-title" className={styles.title}>
        탐험 지도
      </h1>
      <p className={styles.intro}>가고 싶은 지식 영역을 골라 보세요. 10개 영역 모두 자유롭게 탐험할 수 있어요.</p>

      <ol className={styles.grid}>
        {mainClasses.map((c) => (
          <li key={c.id}>
            <Link to={`/classification/${c.id}`} className={styles.tile} style={hueStyle(c.code)}>
              <span className={styles.symbol} aria-hidden="true">
                {c.symbol}
              </span>
              <span className={styles.code}>{c.code}</span>
              <span className={styles.name}>{c.name}</span>
              <StatusBadge status={getLearningStatus(c.id)} />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
