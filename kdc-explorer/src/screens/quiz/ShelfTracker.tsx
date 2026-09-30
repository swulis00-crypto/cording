import type { AnswerRecord } from '../../features/quiz/engine.ts'
import type { Quiz } from '../../types/index.ts'
import styles from './Quiz.module.css'

/** 서가 복구 진행판: 맞힌 문항마다 책 한 권이 제자리에 꽂힌다. */
export function ShelfTracker({ quizzes, answers }: { quizzes: Quiz[]; answers: AnswerRecord[] }) {
  const restored = answers.filter((a) => a.correct).length

  return (
    <div className={styles.shelf}>
      <p className={styles.shelfLabel}>
        서가 복구 {restored} / {quizzes.length}
      </p>
      <ol className={styles.shelfSlots}>
        {quizzes.map((quiz, i) => {
          const answer = answers[i]
          const state = !answer ? (i === answers.length ? 'current' : 'empty') : answer.correct ? 'restored' : 'missed'
          return (
            <li key={quiz.id} className={`${styles.slot} ${styles[state]}`}>
              <span aria-hidden="true">{state === 'restored' ? (quiz.book?.emoji ?? '📘') : state === 'missed' ? '?' : ''}</span>
              <span className="visually-hidden">
                {i + 1}번 책: {state === 'restored' ? '제자리 복구' : state === 'missed' ? '다른 서가로 감' : state === 'current' ? '지금 푸는 문제' : '남음'}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
