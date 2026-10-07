import { BLANK, type RuleKey } from '../../types/index.ts'
import styles from './Quiz.module.css'

/** 🔑 숫자 해독표: 규칙이 다루는 자리(□)의 숫자별 뜻을 크게 보여 준다. */
export function RuleKeyCard({ ruleKey }: { ruleKey: RuleKey }) {
  return (
    <div className={styles.ruleKey}>
      <p className={styles.ruleKeyTitle}>
        <span aria-hidden="true">🔑 </span>
        {ruleKey.position} 해독표
        <span className={styles.ruleKeyPattern} aria-label={`번호 모양 ${ruleKey.pattern}`}>
          {[...ruleKey.pattern].map((ch, i) =>
            ch === BLANK ? (
              <span key={i} className={styles.ruleKeyBlank} aria-hidden="true">
                □
              </span>
            ) : (
              <span key={i} aria-hidden="true">
                {ch}
              </span>
            ),
          )}
        </span>
      </p>
      <ol className={styles.ruleKeyDigits} aria-label={`${ruleKey.position} 숫자의 뜻`}>
        {ruleKey.digits.map((d) => (
          <li key={d.digit}>
            <span className={styles.ruleKeyDigit}>{d.digit}</span>
            <span className={styles.ruleKeyLabel}>{d.label}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
