import type { ReactNode } from 'react'
import styles from './Quiz.module.css'

interface Props {
  /** 제목 앞에 작게 붙이는 그림 (없으면 생략). 휴대폰에서도 폭을 다 쓰도록 따로 칸을 두지 않는다. */
  symbol?: string
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
      <p className={styles.areaName}>
        {symbol && <span aria-hidden="true">{symbol} </span>}
        {title}
        <span className={styles.areaCount}> · {count}</span>
        {newLabel && <span className={styles.newArea}>{newLabel}</span>}
      </p>
      {children}
    </div>
  )
}
