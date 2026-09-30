import { Link } from 'react-router'
import styles from './HomeScreen.module.css'

/** SCR-01 시작 화면 */
export function HomeScreen() {
  // 진행 저장(단계 3)을 붙이기 전까지는 이어할 기록이 없다.
  const hasSavedProgress = false

  return (
    <section className={styles.hero}>
      <p className={styles.keyIcon} aria-hidden="true">
        🗝️
      </p>
      <h1 className={styles.title}>KDC 탐험대</h1>
      <p className={styles.subtitle}>사라진 분류의 열쇠</p>
      <p className={styles.story}>
        도서관의 분류 열쇠가 사라져 책들이 제자리를 잃었어요. 탐험대원이 되어 10개 지식 영역을 돌아보고, 미션을 해결해
        열쇠를 되찾아 주세요!
      </p>

      <div className={styles.actions}>
        <Link to="/tutorial" className="btn btn-primary">
          새 탐험
        </Link>
        <button type="button" className="btn" disabled={!hasSavedProgress} aria-describedby="continue-note">
          이어하기
        </button>
        <Link to="/codex" className="btn">
          분류 도감
        </Link>
      </div>
      {!hasSavedProgress && (
        <p id="continue-note" className={styles.note}>
          아직 저장된 탐험 기록이 없어서 '이어하기'는 쓸 수 없어요.
        </p>
      )}
    </section>
  )
}
