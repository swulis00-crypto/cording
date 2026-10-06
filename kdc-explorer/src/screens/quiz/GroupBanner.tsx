import type { ReactNode } from 'react'
import styles from './Quiz.module.css'

interface Props {
  symbol: string
  title: string
  /** 예: "구역 3 / 10" */
  count: string
  /** 묶음의 첫 문제에 붙이는 표시 (예: "새 구역 도착!") */
  newLabel?: string
  children: ReactNode
}

/** 이어 풀기에서 지금 어떤 묶음(구역·규칙)을 풀고 있는지 알려 주는 안내 */
export function GroupBanner({ symbol, title, count, newLabel, children }: Props) {
  return (
    <div className={styles.areaBanner}>
      <span className={styles.areaSymbol} aria-hidden="true">
        {symbol}
      </span>
      <div>
        <p className={styles.areaName}>
          {title}
          <span className={styles.areaCount}> · {count}</span>
          {newLabel && <span className={styles.newArea}>{newLabel}</span>}
        </p>
        {children}
      </div>
    </div>
  )
}
