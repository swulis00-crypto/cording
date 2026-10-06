import { useState } from 'react'
import { BLANK } from '../../types/index.ts'
import styles from './Quiz.module.css'

interface Props {
  /** 예: "7□0" */
  template: string
  /** 숫자 카드 (같은 카드를 여러 번 쓸 수 있다) */
  cards: string[]
  /** 빈칸을 모두 채우면 완성된 번호, 하나라도 비면 null */
  onChange: (value: string | null) => void
}

/** 🔐 번호 조립: 숫자 카드를 눌러 틀의 빈칸을 왼쪽부터 채운다. */
export function NumberBuilder({ template, cards, onChange }: Props) {
  const chars = [...template]
  const blankCount = chars.filter((c) => c === BLANK).length
  const [filled, setFilled] = useState<string[]>([])

  const update = (next: string[]) => {
    setFilled(next)
    let i = 0
    const value = chars.map((c) => (c === BLANK ? next[i++] : c)).join('')
    onChange(next.length === blankCount ? value : null)
  }

  // 빈칸마다 몇 번째 빈칸인지(order)를 붙여 둔다. 다음에 채울 칸은 order === filled.length
  let order = 0
  const slots = chars.map((c) =>
    c === BLANK ? { blank: true, order: order, value: filled[order++] } : { blank: false, order: -1, value: c },
  )
  const spoken = slots.map((s) => s.value ?? '빈칸').join(' ')

  return (
    <div className={styles.builder}>
      <p className={styles.builderSlots} aria-hidden="true">
        {slots.map((slot, i) => (
          <span
            key={i}
            className={
              slot.blank ? `${styles.builderBlank} ${slot.order === filled.length ? styles.builderNext : ''}` : styles.builderFixed
            }
          >
            {slot.value ?? ''}
          </span>
        ))}
      </p>
      <p className="visually-hidden" aria-live="polite">
        만든 번호: {spoken}
      </p>

      <div className={styles.builderCards} role="group" aria-label="숫자 카드">
        {cards.map((card) => (
          <button
            key={card}
            type="button"
            className={styles.builderCard}
            aria-label={`숫자 ${card}`}
            disabled={filled.length >= blankCount}
            onClick={() => update([...filled, card])}
          >
            {card}
          </button>
        ))}
        <button type="button" className="btn" disabled={filled.length === 0} onClick={() => update(filled.slice(0, -1))}>
          ⌫ 지우기
        </button>
      </div>
    </div>
  )
}
