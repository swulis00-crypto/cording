import { useEffect, useRef } from 'react'
import type { AnswerRecord } from '../../features/quiz/engine.ts'
import { isBuildQuiz, type Quiz } from '../../types/index.ts'
import { BookCard } from './BookCard.tsx'
import { OptionMark } from './FeedbackView.tsx'
import styles from './Quiz.module.css'

interface Props {
  quiz: Quiz
  answer: AnswerRecord
  /** 몇 번째 문제였는지 (1부터) */
  number: number
  canGoEarlier: boolean
  canGoLater: boolean
  onEarlier: () => void
  onLater: () => void
  onBack: () => void
}

/** 이미 푼 문제를 다시 보는 화면. 답을 바꿀 수는 없고, 문제·내 답·해설만 보여 준다. */
export function PastQuestionView({ quiz, answer, number, canGoEarlier, canGoLater, onEarlier, onLater, onBack }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [quiz.id])

  return (
    <section className={`${styles.card} ${styles.pastCard}`} aria-labelledby="past-title">
      <h1 id="past-title" ref={headingRef} tabIndex={-1} className={styles.pastTitle}>
        <span aria-hidden="true">🔙 </span>지난 문제 {number}
        <span className={answer.correct ? styles.pastCorrect : styles.pastWrong}>
          {answer.correct ? '✔ 맞힘' : '✖ 틀림'}
        </span>
      </h1>

      {quiz.character && <p className={styles.reviewQuestionText}>{`${quiz.character.name}: "${quiz.character.line}"`}</p>}
      {quiz.book && <BookCard book={quiz.book} fictional={quiz.fictional} compact />}
      <p className={styles.reviewQuestionText}>{quiz.question}</p>

      {isBuildQuiz(quiz) && quiz.template ? (
        <p>
          틀: <strong>{quiz.template}</strong> · 내가 만든 답: {answer.selected} · 정답: <strong>{quiz.correctAnswer}</strong>
        </p>
      ) : (
        <ul className={styles.reviewOptions}>
          {quiz.options.map((option) => (
            <li key={option}>
              <OptionMark option={option} quiz={quiz} answer={answer} />
            </li>
          ))}
        </ul>
      )}

      {quiz.explanation && (
        <div className={styles.explanation}>
          <h2>해설</h2>
          <p>{quiz.explanation}</p>
        </div>
      )}

      <div className={styles.actions}>
        <div className={styles.pastSteps}>
          <button type="button" className="btn" onClick={onEarlier} disabled={!canGoEarlier}>
            ◀ 이전
          </button>
          <button type="button" className="btn" onClick={onLater} disabled={!canGoLater}>
            다음 ▶
          </button>
        </div>
        <button type="button" className="btn btn-primary" onClick={onBack}>
          지금 문제로 돌아가기
        </button>
      </div>
    </section>
  )
}
