import type { LearningStatus } from '../../types/index.ts'

export const STATUS_LABELS: Record<LearningStatus, string> = {
  'not-started': '학습 전',
  'in-progress': '학습 중',
  completed: '학습 완료',
}

/**
 * 분류의 학습 상태.
 * 진행 저장(단계 3)을 붙이기 전까지는 모든 분류가 '학습 전'이다.
 */
export function getLearningStatus(_classificationId: string): LearningStatus {
  return 'not-started'
}
