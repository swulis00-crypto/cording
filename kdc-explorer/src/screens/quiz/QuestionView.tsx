import type { FormEvent } from 'react'
import type { Quiz } from '../../types/index.ts'
import styles from './Quiz.module.css'

interface Props {
  quiz: Quiz
  selected: string | null
  hintShown: boolean
  needsSelection: boolean
  onSelect: (option: string) => void
  onHint: () => void
  onSubmit: () => void
}

/** SCR-05 문제 하나와 보기. 제출 전에는 선택을 바꿀 수 있다. */
export function QuestionView({ quiz, selected, hintShown, needsSelection, onSelect, onHint, onSubmit }: Props) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit} noValidate>
      {quiz.reviewStatus !== 'approved' && <p className={styles.draftTag}>검토 전 문항 (미리보기)</p>}

      <fieldset className={styles.fieldset}>
        <legend className={styles.question}>{quiz.question}</legend>
        <div className={styles.options}>
          {quiz.options.map((option) => (
            <label key={option} className={styles.option}>
              <input
                type="radio"
                name="answer"
                value={option}
                checked={selected === option}
                onChange={() => onSelect(option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {hintShown && (
        <p className={styles.hint}>
          <span aria-hidden="true">💡 </span>
          <strong>힌트:</strong> {quiz.hint}
        </p>
      )}

      {needsSelection && (
        <p className={styles.alert} role="alert">
          답을 하나 골라 주세요.
        </p>
      )}

      <div className={styles.actions}>
        {quiz.hint && !hintShown ? (
          <button type="button" className="btn" onClick={onHint}>
            힌트 보기
          </button>
        ) : (
          <span />
        )}
        <button type="submit" className="btn btn-primary">
          제출하기
        </button>
      </div>
    </form>
  )
}
