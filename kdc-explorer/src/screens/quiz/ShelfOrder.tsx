import { useState } from 'react'
import { SHELF_SEPARATOR } from '../../types/index.ts'
import styles from './Quiz.module.css'

interface Props {
  /** 꽂을 책들의 책 주소 (섞인 순서) */
  books: string[]
  /** 모두 꽂으면 꽂은 순서("A | B | C"), 하나라도 남으면 null */
  onChange: (value: string | null) => void
}

/** 📚 서가 정리: 책을 눌러 왼쪽부터 순서대로 서가에 꽂는다. 꽂은 책을 누르면 다시 뺀다. */
export function ShelfOrder({ books, onChange }: Props) {
  const [placed, setPlaced] = useState<string[]>([])
  const waiting = books.filter((b) => !placed.includes(b))

  const update = (next: string[]) => {
    setPlaced(next)
    onChange(next.length === books.length ? next.join(SHELF_SEPARATOR) : null)
  }

  return (
    <div className={styles.shelfGame}>
      <p className={styles.divisionsTitle}>꽂을 책 (눌러서 서가에 꽂기)</p>
      <ul className={styles.shelfBooks} aria-label="꽂을 책">
        {waiting.map((book) => (
          <li key={book}>
            <button type="button" className={styles.spine} onClick={() => update([...placed, book])} aria-label={`${book} 꽂기`}>
              {book.split(' ').map((part) => (
                <span key={part}>{part}</span>
              ))}
            </button>
          </li>
        ))}
        {waiting.length === 0 && <li className={styles.shelfDone}>모두 꽂았어요!</li>}
      </ul>

      <p className={styles.divisionsTitle}>서가 (왼쪽부터) · 꽂은 책을 누르면 다시 빼요</p>
      <ol className={styles.shelfRow} aria-label="서가에 꽂은 순서">
        {placed.map((book, i) => (
          <li key={book}>
            <button
              type="button"
              className={`${styles.spine} ${styles.spinePlaced}`}
              onClick={() => update(placed.filter((b) => b !== book))}
              aria-label={`${i + 1}번째 ${book}, 빼기`}
            >
              <span className={styles.spineOrder}>{i + 1}</span>
              {book.split(' ').map((part) => (
                <span key={part}>{part}</span>
              ))}
            </button>
          </li>
        ))}
        {Array.from({ length: books.length - placed.length }, (_, i) => (
          <li key={`empty-${i}`} className={styles.spineEmpty} aria-hidden="true" />
        ))}
      </ol>
      <p className="visually-hidden" aria-live="polite">
        서가에 꽂은 책 {placed.length}권 / {books.length}권
      </p>
    </div>
  )
}
