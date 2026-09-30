import type { ReactNode } from 'react'
import styles from './Quiz.module.css'

/** 도서관 손님의 말풍선 */
export function SpeechBubble({ emoji, name, children }: { emoji: string; name: string; children: ReactNode }) {
  return (
    <div className={styles.speaker}>
      <span className={styles.speakerFace} aria-hidden="true">
        {emoji}
      </span>
      <p className={styles.bubble}>
        <strong className={styles.speakerName}>{name}</strong>
        <span className="visually-hidden">: </span>
        {children}
      </p>
    </div>
  )
}
