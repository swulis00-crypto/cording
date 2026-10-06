import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router'
import { summarize, type AnswerRecord } from '../../features/quiz/engine.ts'
import type { Classification, Quiz } from '../../types/index.ts'
import styles from './Quiz.module.css'

interface Props {
  /** 오답 복습처럼 여러 영역을 섞어 풀면 없음 */
  classification?: Classification
  quizzes: Quiz[]
  answers: AnswerRecord[]
  onRetry: () => void
  onRetryWrong: (wrong: Quiz[]) => void
  /** 모두 맞혔을 때의 완료 문구 */
  doneText?: string
  extraActions?: ReactNode
}

/** SCR-07 결과. 정답률로 평가하거나 순위를 매기지 않는다. */
export function ResultView({ classification, quizzes, answers, onRetry, onRetryWrong, doneText, extraActions }: Props) {
  const summary = summarize(answers)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const answerById = new Map(answers.map((a) => [a.quizId, a]))
  const wrong = quizzes.filter((q) => answerById.get(q.id)?.correct === false)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <section className={styles.card} aria-labelledby="result-title">
      <h1 id="result-title" ref={headingRef} tabIndex={-1} className={styles.heading}>
        <span aria-hidden="true">🏁 </span>미션 완료!
      </h1>
      <p className={styles.gap}>
        {wrong.length === 0
          ? `책 ${summary.total}권이 모두 제자리를 찾았어요! ${doneText ?? (classification ? `${classification.name} 서가가 깨끗하게 복구됐어요.` : '헤매던 책을 모두 찾아 주었어요.')}`
          : `책 ${summary.correctCount}권이 제자리를 찾았어요. 아직 ${wrong.length}권이 길을 헤매고 있어요. 해설을 읽고 다시 찾아 줄까요?`}
      </p>

      <dl className={styles.stats}>
        <div>
          <dt>전체 문항</dt>
          <dd>{summary.total}문항</dd>
        </div>
        <div>
          <dt>맞힌 문항</dt>
          <dd>{summary.correctCount}문항</dd>
        </div>
        <div>
          <dt>정답률</dt>
          <dd>{summary.accuracy}%</dd>
        </div>
        <div>
          <dt>점수</dt>
          <dd>{summary.score}점</dd>
        </div>
        <div>
          <dt>획득한 별</dt>
          <dd>
            <span aria-hidden="true">⭐ </span>
            {summary.stars}개
          </dd>
        </div>
      </dl>

      <h2 className={styles.subheading}>해설 다시 보기</h2>
      <ol className={styles.reviewList}>
        {quizzes.map((quiz) => {
          const answer = answerById.get(quiz.id)
          const correct = answer?.correct === true
          return (
            <li key={quiz.id} className={correct ? styles.reviewCorrect : styles.reviewWrong}>
              <details open={!correct}>
                <summary>
                  <span aria-hidden="true">{correct ? '✔ ' : '✖ '}</span>
                  <span className="visually-hidden">{correct ? '맞힘: ' : '틀림: '}</span>
                  {quiz.book ? `『${quiz.book.title}』` : quiz.question}
                </summary>
                <p>
                  내가 고른 답: {answer?.selected ?? '-'}
                  {!correct && (
                    <>
                      {' · '}정답: <strong>{quiz.correctAnswer}</strong>
                    </>
                  )}
                </p>
                {quiz.explanation && <p>{quiz.explanation}</p>}
              </details>
            </li>
          )
        })}
      </ol>

      <div className={styles.resultActions}>
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          다시 도전
        </button>
        {wrong.length > 0 && (
          <button type="button" className="btn" onClick={() => onRetryWrong(wrong)}>
            헤매는 책 다시 찾아 주기 ({wrong.length})
          </button>
        )}
        {extraActions}
        <Link to="/map" className="btn">
          탐험 지도로 돌아가기
        </Link>
      </div>
      {classification && (
        <p className={styles.small}>
          <Link to={`/classification/${classification.id}`}>
            {classification.code} {classification.name} 소개 다시 보기
          </Link>
        </p>
      )}
    </section>
  )
}
