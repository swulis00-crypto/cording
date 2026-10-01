import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  recordMission as recordMissionRule,
  resetProgress,
  setSoundEnabled,
  visitClassification,
  type MissionResult,
} from '../features/progress/progress.ts'
import { loadProgress, saveProgress } from '../services/storage.ts'
import type { Progress } from '../types/index.ts'
import { ProgressContext, type ProgressValue } from './useProgress.ts'

/** 학습 진행 상태를 화면 전체에 제공하고, 바뀔 때마다 브라우저에 저장한다. */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadProgress)
  const [progress, setProgress] = useState(initial.progress)
  const [recoveredNotice, setRecoveredNotice] = useState(initial.recovered)
  const loaded = useRef(initial.progress)

  useEffect(() => {
    // 처음 불러온 상태는 다시 저장하지 않는다.
    if (progress === loaded.current) return
    saveProgress(progress)
  }, [progress])

  const update = useCallback((change: (p: Progress) => Progress) => setProgress(change), [])

  // 기록 함수는 진행 상태가 바뀌어도 같은 함수로 유지해, 화면의 effect가 반복 실행되지 않게 한다.
  const actions = useMemo(
    () => ({
      visit: (id: string) => update((p) => visitClassification(p, id)),
      recordMission: (result: MissionResult) => update((p) => recordMissionRule(p, result)),
      setSound: (enabled: boolean) => update((p) => setSoundEnabled(p, enabled)),
      reset: () => update(resetProgress),
      dismissRecoveredNotice: () => setRecoveredNotice(false),
    }),
    [update],
  )

  const value = useMemo<ProgressValue>(
    () => ({ progress, recoveredNotice, ...actions }),
    [progress, recoveredNotice, actions],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

