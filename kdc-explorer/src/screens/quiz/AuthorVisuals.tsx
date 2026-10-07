import { CONSONANT_TABLE, VOWEL_TABLE } from '../../features/author/authorMark.ts'
import styles from './Quiz.module.css'

/** 저자기호 구성도: 최은영 『밝은 밤』 → 최 + 6 + 7 + ㅂ */
export function AuthorMarkParts() {
  const parts = [
    { value: '최', label: '① 작가의 성', note: '최은영' },
    { value: '6', label: '② 자음 기호', note: '은 → ㅇ' },
    { value: '7', label: '③ 모음 기호', note: '은 → ㅡ' },
    { value: 'ㅂ', label: '④ 제목 초성', note: '『밝은 밤』' },
  ]
  return (
    <div className={styles.authorParts}>
      <p className={styles.divisionsTitle}>
        <span aria-hidden="true">🏷️ </span>저자기호의 생김새 · 예: 최은영 『밝은 밤』 → 최67ㅂ
      </p>
      <ol className={styles.authorPartList} aria-label="저자기호의 네 부분">
        {parts.map((p) => (
          <li key={p.label}>
            <span className={styles.authorPartValue}>{p.value}</span>
            <span className={styles.divisionName}>{p.label}</span>
            <span className={styles.authorPartNote}>{p.note}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** 저자기호 기호표 (이재철 한글순도서기호법 제5표) */
export function AuthorCodeTable() {
  return (
    <div className={styles.authorTable}>
      <p className={styles.divisionsTitle}>
        <span aria-hidden="true">📋 </span>자음 기호 (이름 두 번째 글자의 초성)
      </p>
      <ol className={styles.authorGrid} aria-label="자음 기호표">
        {CONSONANT_TABLE.map((row) => (
          <li key={row.code}>
            <span className={styles.divisionName}>{row.letters.join(' ')}</span>
            <span className={styles.authorCode}>{row.code}</span>
          </li>
        ))}
      </ol>
      <p className={styles.divisionsTitle}>
        <span aria-hidden="true">📋 </span>모음 기호 (이름 두 번째 글자의 중성) · 초성이 ㅊ이면 오른쪽 숫자
      </p>
      <ol className={styles.authorGrid} aria-label="모음 기호표">
        {VOWEL_TABLE.map((row) => (
          <li key={row.letters[0]}>
            <span className={styles.divisionName}>{row.letters.join(' ')}</span>
            <span className={styles.authorCode}>
              {row.code}
              <span className={styles.authorChieut}> / ㅊ {row.chieut}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
