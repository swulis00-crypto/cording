import styles from './Quiz.module.css'

/** 청구기호(책 주소) 라벨 구성도: 학습지의 예시 라벨 순서 */
export function CallNumberParts() {
  const lines = [
    { value: 'R', name: '별치기호', note: '따로 모아 둔 서가 (참고자료 등)' },
    { value: '813.7', name: '분류기호', note: '책의 주제 (2단계)' },
    { value: '최67ㅂ', name: '저자기호', note: '책을 쓴 사람 (3단계)' },
    { value: 'v.1', name: '권차기호', note: '시리즈·전집의 몇 권' },
    { value: 'c.2', name: '복본기호', note: '같은 책의 몇 번째' },
  ]
  return (
    <div className={styles.callParts}>
      <p className={styles.divisionsTitle}>
        <span aria-hidden="true">🏷️ </span>책등 라벨 = 책 주소 (위에서부터 읽어요)
      </p>
      <div className={styles.callPartsBody}>
        <ol className={styles.callLabel} aria-label="라벨 예시">
          {lines.map((l) => (
            <li key={l.name}>{l.value}</li>
          ))}
        </ol>
        <ol className={styles.callLegend} aria-label="라벨 각 줄의 뜻">
          {lines.map((l) => (
            <li key={l.name}>
              <span className={styles.authorCode}>{l.value}</span>
              <span className={styles.divisionName}>{l.name}</span>
              <span className={styles.authorPartNote}>{l.note}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

/** 서가에 꽂는 순서 */
export function ShelfRules() {
  const rules = [
    { step: '1', text: '분류기호가 작은 것부터', example: '811.7 → 813.7 → 814.7' },
    { step: '2', text: '분류기호가 같으면 저자 성의 가나다순', example: '김 → 손 → 최' },
    { step: '3', text: '성이 같으면 숫자를 소수로 비교', example: '최19 → 최5 → 최52 → 최6' },
    { step: '4', text: '숫자까지 같으면 제목 초성 순서', example: '이15ㄷ → 이15ㅅ' },
    { step: '5', text: '그다음 권차(v.), 복본(c.) 순서', example: 'v.1 → v.2 → v.3' },
  ]
  return (
    <div className={styles.authorTable}>
      <p className={styles.divisionsTitle}>
        <span aria-hidden="true">📚 </span>서가에 꽂는 순서
      </p>
      <ol className={styles.shelfRuleList} aria-label="서가에 꽂는 순서">
        {rules.map((r) => (
          <li key={r.step}>
            <span className={styles.authorCode}>{r.step}</span>
            <span className={styles.divisionName}>{r.text}</span>
            <span className={styles.authorPartNote}>{r.example}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
