import { getClassification } from '../../data/index.ts'
import type { AnswerRecord } from '../../features/quiz/engine.ts'
import type { Quiz } from '../../types/index.ts'
import { hueStyle } from '../../utils/hue.ts'
import styles from './Quiz.module.css'

/** 서가 복구 진행판: 맞힌 문항마다 그 영역 색의 책 한 권이 제자리에 꽂힌다. */
export function ShelfTracker({ quizzes, answers }: { quizzes: Quiz[]; answers: AnswerRecord[] }) {
  const restored = answers.filter((a) => a.correct).length
  const compact = quizzes.length > 10

  return (
    <div className={styles.shelf}>
      <p className={styles.shelfLabel}>
        서가 복구 {restored} / {quizzes.length}
      </p>
      <ol className={`${styles.shelfSlots} ${compact ? styles.shelfCompact : ''}`}>
        {quizzes.map((quiz, i) => {
          const answer = answers[i]
          const state = !answer ? (i === answers.length ? 'current' : 'empty') : answer.correct ? 'restored' : 'missed'
          const code = getClassification(quiz.classificationId)?.code
          const groupStart = i > 0 && quizzes[i - 1].classificationId !== quiz.classificationId
          return (
            <li
              key={quiz.id}
              className={`${styles.slot} ${styles[state]} ${groupStart ? styles.groupStart : ''}`}
              style={code ? hueStyle(code) : undefined}
            >
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
