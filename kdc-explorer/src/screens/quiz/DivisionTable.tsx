import { getChildren, mainClasses } from '../../data/index.ts'
import type { Classification } from '../../types/index.ts'
import { hueStyle } from '../../utils/hue.ts'
import styles from './Quiz.module.css'

/**
 * 한 구역의 10개 구분표 (예: 600 예술 → 600, 610 … 690).
 * area가 없으면 KDC 10개 주류표(000 … 900)를 보여 준다.
 * 명칭을 확인하지 못한 번호는 추측하지 않고 '확인 필요'로 둔다.
 */
export function DivisionTable({ area }: { area?: Classification }) {
  const cells: { code: string; name: string | null }[] = area
    ? Array.from({ length: 10 }, (_, i) => {
        const code = String(Number(area.code) + i * 10).padStart(3, '0')
        if (i === 0) return { code, name: area.name }
        return { code, name: getChildren(area.id).find((c) => c.code === code)?.name ?? null }
      })
    : mainClasses.map((c) => ({ code: c.code, name: c.name }))

  const title = area ? `${area.code} ${area.name} 구역의 10개 구분` : 'KDC 10개 큰 구역'

  return (
    <div className={styles.divisions}>
      <p className={styles.divisionsTitle}>
        <span aria-hidden="true">📚 </span>
        {title}
      </p>
      <ol className={styles.divisionGrid} aria-label={title}>
        {cells.map((cell) => (
          <li key={cell.code} className={styles.divisionCell} style={hueStyle(cell.code)}>
            <span className={styles.divisionCode}>{cell.code}</span>
            <span className={cell.name ? styles.divisionName : styles.divisionUnknown}>{cell.name ?? '확인 필요'}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
