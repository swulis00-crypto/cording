import { Link } from 'react-router'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { mainClasses } from '../data/index.ts'
import { getLearningStatus } from '../features/progress/status.ts'
import { hueStyle } from '../utils/hue.ts'
import styles from './CodexScreen.module.css'

/** SCR-08 분류 도감 */
export function CodexScreen() {
  const completed = mainClasses.filter((c) => getLearningStatus(c.id) === 'completed').length

  return (
    <section aria-labelledby="codex-title">
      <div className={styles.top}>
        <div>
          <h1 id="codex-title" className={styles.title}>
            분류 도감
          </h1>
          <p className={styles.summary}>
            학습 완료 {completed} / {mainClasses.length}
          </p>
        </div>
        <Link to="/tutorial" className="btn">
          튜토리얼 다시 보기
        </Link>
      </div>

      <ol className={styles.list}>
        {mainClasses.map((c) => (
          <li key={c.id} className={styles.entry} style={hueStyle(c.code)}>
            <span className={styles.symbol} aria-hidden="true">
              {c.symbol}
            </span>
            <div className={styles.text}>
              <h2 className={styles.heading}>
                <span className={styles.code}>{c.code}</span> {c.name}
              </h2>
              <p className={styles.desc}>{c.learnerDescription}</p>
            </div>
            <div className={styles.side}>
              <StatusBadge status={getLearningStatus(c.id)} />
              <Link to={`/classification/${c.id}`} className={styles.more}>
                자세히 보기<span className="visually-hidden">: {c.code} {c.name}</span>
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
