import { createContext, useContext } from 'react'
import type { MissionResult } from '../features/progress/progress.ts'
import type { Progress } from '../types/index.ts'

export interface ProgressValue {
  progress: Progress
  visit: (classificationId: string) => void
  recordMission: (result: MissionResult) => void
  setSound: (enabled: boolean) => void
  /** 학습 기록을 지운다 (설정은 유지) */
  reset: () => void
  /** 저장된 기록이 손상돼 새로 시작했음을 알릴지 */
  recoveredNotice: boolean
  dismissRecoveredNotice: () => void
}

export const ProgressContext = createContext<ProgressValue | null>(null)

export function useProgress(): ProgressValue {
  const value = useContext(ProgressContext)
  if (!value) throw new Error('useProgress는 ProgressProvider 안에서만 쓸 수 있습니다.')
  return value
}
