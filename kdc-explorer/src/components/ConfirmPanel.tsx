import { useEffect, useRef, type ReactNode } from 'react'
import styles from './ConfirmPanel.module.css'

interface Props {
  title: string
  children: ReactNode
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/** 되돌릴 수 없는 동작 전에 보여 주는 확인 패널. 열리면 제목으로 초점을 옮기고 Esc로 닫는다. */
export function ConfirmPanel({ title, children, confirmLabel, cancelLabel = '취소', onConfirm, onCancel }: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  return (
    <div
      className={styles.panel}
      role="alertdialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-body"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel()
      }}
    >
      <h2 id="confirm-title" ref={titleRef} tabIndex={-1} className={styles.title}>
        <span aria-hidden="true">⚠️ </span>
        {title}
      </h2>
      <div id="confirm-body" className={styles.body}>
        {children}
      </div>
      <div className={styles.actions}>
        <button type="button" className="btn" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className={`btn ${styles.danger}`} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}
