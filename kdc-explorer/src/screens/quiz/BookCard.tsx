import type { QuizBook } from '../../types/index.ts'
import styles from './Quiz.module.css'

/** 문제 속 책을 표지 카드로 보여 준다. 가상 예시는 반드시 표시한다. */
export function BookCard({ book, fictional, compact = false }: { book: QuizBook; fictional: boolean; compact?: boolean }) {
  return (
    <figure className={`${styles.book} ${compact ? styles.bookCompact : ''}`}>
      <span className={styles.bookEmoji} aria-hidden="true">
        {book.emoji}
      </span>
      <figcaption>
        <span className="visually-hidden">책 제목: </span>
        <span className={styles.bookTitle}>『{book.title}』</span>
        {fictional && <span className={styles.fictionalTag}>가상 예시</span>}
      </figcaption>
    </figure>
  )
}
