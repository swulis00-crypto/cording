import type { LearningStatus } from '../../types/index.ts'

export const STATUS_LABELS: Record<LearningStatus, string> = {
  'not-started': '학습 전',
  'in-progress': '학습 중',
  completed: '학습 완료',
}
