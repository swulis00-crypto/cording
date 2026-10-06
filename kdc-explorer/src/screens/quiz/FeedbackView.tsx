import { useEffect, useRef, useState } from 'react'
import { getClassificationByCode } from '../../data/index.ts'
import { codeFromOption, reactionFor, type AnswerRecord } from '../../features/quiz/engine.ts'
import type { Quiz } from '../../types/index.ts'
import { BookCard } from './BookCard.tsx'
import { SpeechBubble } from './SpeechBubble.tsx'
import styles from './Quiz.module.css'

interface Props {
  quiz: Quiz
  answer: AnswerRecord
  isLast: boolean
  onNext: () => void
}

/** 손님이 엉뚱한 서가에 갔을 때의 반응. 서가 내용은 분류 데이터의 대표 주제에서 가져온다. */
function wrongShelfLine(selected: string): string | null {
  const code = codeFromOption(selected)
  const shelf = code ? getClassificationByCode(code) : undefined
  if (!shelf || shelf.exampleTopics.length === 0) return null
  return `어? ${shelf.code} ${shelf.name} 서가에 와 보니 ${shelf.exampleTopics.slice(0, 2).join(', ')} 책뿐인데…?`
}

/** SCR-06 정답/오답 피드백. 결과를 색상·아이콘·텍스트로 함께 보여 준다. */
export function FeedbackView({ quiz, answer, isLast, onNext }: Props) {
  const [showQuestion, setShowQuestion] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const character = quiz.character
  const characterLine = character && (answer.correct ? character.thanks : wrongShelfLine(answer.selected))

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <section className={`${styles.card} ${answer.correct ? styles.correct : styles.wrong}`} aria-labelledby="feedback-title">
      <h1 id="feedback-title" ref={headingRef} tabIndex={-1} className={styles.feedbackTitle}>
        <span className={styles.feedbackIcon} aria-hidden="true">
          {answer.correct ? '✔' : '✖'}
        </span>
        {answer.correct ? '정답이에요!' : '아쉬워요, 정답이 아니에요'}
      </h1>

      {character && characterLine ? (
        <SpeechBubble emoji={character.emoji} name={character.name}>
          {characterLine}
        </SpeechBubble>
      ) : (
        <p className={styles.reaction}>{reactionFor(quiz, answer.correct)}</p>
      )}

      <dl className={styles.answerLines}>
        <div>
          <dt>내가 고른 답</dt>
          <dd>{answer.selected}</dd>
        </div>
        {!answer.correct && (
          <div>
            <dt>정답</dt>
            <dd>
              <strong>{quiz.correctAnswer}</strong>
            </dd>
          </div>
        )}
      </dl>

      {quiz.explanation && (
        <div className={styles.explanation}>
          <h2>해설</h2>
          <p>{quiz.explanation}</p>
        </div>
      )}

      {showQuestion && (
        <div className={styles.reviewQuestion} id="feedback-question">
          {quiz.character && <p className={styles.reviewQuestionText}>{`${quiz.character.name}: "${quiz.character.line}"`}</p>}
          {quiz.book && <BookCard book={quiz.book} fictional={quiz.fictional} compact />}
          <p className={styles.reviewQuestionText}>{quiz.question}</p>
          {quiz.type === 'build-number' && quiz.template ? (
            <p>
              틀: <strong>{quiz.template}</strong> · 숫자 카드: {quiz.options.join(', ')}
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
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className="btn"
          aria-expanded={showQuestion}
          aria-controls="feedback-question"
          onClick={() => setShowQuestion(!showQuestion)}
        >
          {showQuestion ? '문제 접기' : '문제 다시 보기'}
        </button>
        <button type="button" className="btn btn-primary" onClick={onNext}>
          {isLast ? '결과 보기' : '다음 문제'}
        </button>
      </div>
    </section>
  )
}

function OptionMark({ option, quiz, answer }: { option: string; quiz: Quiz; answer: AnswerRecord }) {
  const isCorrect = option === quiz.correctAnswer
  const isMine = option === answer.selected
  return (
    <>
      <span aria-hidden="true" className={styles.mark}>
        {isCorrect ? '✔' : isMine ? '✖' : '·'}
      </span>
      {option}
      {isCorrect && <span className={styles.markLabel}> (정답)</span>}
      {isMine && !isCorrect && <span className={styles.markLabel}> (내가 고른 답)</span>}
    </>
  )
}
