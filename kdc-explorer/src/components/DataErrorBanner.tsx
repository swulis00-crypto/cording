import styles from './DataErrorBanner.module.css'

/** 학습 데이터에 오류가 있으면 화면 위쪽에 알린다. 오류가 없으면 아무것도 그리지 않는다. */
export function DataErrorBanner({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null

  return (
    <div className={styles.banner} role="alert">
      <p>
        <strong>⚠ 학습 데이터에 오류 {errors.length}건이 있어요.</strong> 선생님께 알려 주세요. 문제가 있는 항목은 화면에서
        빠질 수 있어요.
      </p>
      <details>
        <summary>오류 내용 보기</summary>
        <ul>
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </details>
    </div>
  )
}
