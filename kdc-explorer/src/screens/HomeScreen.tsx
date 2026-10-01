import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useProgress } from '../app/useProgress.ts'
import { ConfirmPanel } from '../components/ConfirmPanel.tsx'
import { hasProgress } from '../features/progress/progress.ts'
import styles from './HomeScreen.module.css'

/** SCR-01 시작 화면 */
export function HomeScreen() {
  const { progress, reset } = useProgress()
  const navigate = useNavigate()
  const hasSaved = hasProgress(progress)
  const [confirmingNew, setConfirmingNew] = useState(false)

  const startNew = () => {
    // 공용 PC: 이전 사람의 기록이 있으면 이어할지 지울지 먼저 묻는다. (PRD 8.4)
    if (hasSaved) setConfirmingNew(true)
    else navigate('/tutorial')
  }

  return (
    <section className={styles.hero}>
      <p className={styles.keyIcon} aria-hidden="true">
        🗝️
      </p>
      <h1 className={styles.title}>KDC 탐험대</h1>
      <p className={styles.subtitle}>사라진 분류의 열쇠</p>
      <p className={styles.story}>
        도서관의 분류 열쇠가 사라져 책들이 제자리를 잃었어요. 탐험대원이 되어 지식 구역을 돌아보고, 미션을 해결해
        열쇠를 되찾아 주세요!
      </p>

      <div className={styles.actions}>
        <button type="button" className="btn btn-primary" onClick={startNew}>
          새 탐험
        </button>
        <button
          type="button"
          className="btn"
          disabled={!hasSaved}
          aria-describedby={hasSaved ? undefined : 'continue-note'}
          onClick={() => navigate('/levels')}
        >
          이어하기
        </button>
        <Link to="/codex" className="btn">
          분류 도감
        </Link>
      </div>
      {!hasSaved && (
        <p id="continue-note" className={styles.note}>
          아직 저장된 탐험 기록이 없어서 '이어하기'는 쓸 수 없어요.
        </p>
      )}

      {confirmingNew && (
        <ConfirmPanel
          title="이 컴퓨터에 이전 탐험 기록이 있어요"
          confirmLabel="기록 지우고 새로 시작"
          onCancel={() => setConfirmingNew(false)}
          onConfirm={() => {
            reset()
            navigate('/tutorial')
          }}
        >
          <p>내 기록이라면 '취소'를 누르고 '이어하기'로 계속하세요.</p>
          <p>다른 사람의 기록이거나 처음부터 하고 싶다면, 기록을 지우고 새로 시작할 수 있어요. 지운 기록은 되돌릴 수 없어요.</p>
        </ConfirmPanel>
      )}
    </section>
  )
}
