import { STATUS_LABELS } from '../features/progress/status.ts'
import type { LearningStatus } from '../types/index.ts'
import styles from './StatusBadge.module.css'

const ICONS: Record<LearningStatus, string> = {
  'not-started': '○',
  'in-progress': '◐',
  completed: '●',
}

/** 학습 상태를 아이콘과 텍스트로 함께 표시한다. (색상만으로 구별하지 않음) */
export function StatusBadge({ status }: { status: LearningStatus }) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      <span aria-hidden="true">{ICONS[status]}</span>
      {STATUS_LABELS[status]}
    </span>
  )
}
