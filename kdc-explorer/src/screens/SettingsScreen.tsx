import { useState } from 'react'
import { useProgress } from '../app/useProgress.ts'
import { ConfirmPanel } from '../components/ConfirmPanel.tsx'
import { hasProgress } from '../features/progress/progress.ts'
import styles from './Pages.module.css'

/** SCR-10 설정 */
export function SettingsScreen() {
  const { progress, setSound, reset } = useProgress()
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState('')

  return (
    <section aria-labelledby="settings-title">
      <h1 id="settings-title" className={styles.title}>
        설정
      </h1>

      <div className={styles.card}>
        <h2 className={styles.subtitle}>소리</h2>
        <label className={styles.switch}>
          <input
            type="checkbox"
            checked={progress.settings.soundEnabled}
            onChange={(event) => setSound(event.target.checked)}
          />
          <span>효과음 켜기</span>
        </label>
        <p className={styles.help}>효과음이 없어도 모든 기능을 쓸 수 있어요. (효과음은 다음 업데이트에서 들려요.)</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.subtitle}>진행 기록 초기화</h2>
        <p className={styles.help}>
          탐험 기록은 이 컴퓨터의 브라우저에만 저장돼요. 여러 사람이 같은 컴퓨터를 쓴다면, 다 쓴 뒤 기록을 지워 주세요.
        </p>
        <button
          type="button"
          className="btn"
          disabled={!hasProgress(progress)}
          onClick={() => {
            setMessage('')
            setConfirming(true)
          }}
        >
          기록 지우기
        </button>
        {!hasProgress(progress) && !message && <p className={styles.help}>지울 기록이 없어요.</p>}
        <p role="status" className={styles.done}>
          {message}
        </p>

        {confirming && (
          <ConfirmPanel
            title="정말 기록을 지울까요?"
            confirmLabel="기록 지우기"
            onCancel={() => setConfirming(false)}
            onConfirm={() => {
              reset()
              setConfirming(false)
              setMessage('기록을 지웠어요. 처음부터 탐험할 수 있어요.')
            }}
          >
            <p>이 컴퓨터에 저장된 다음 기록이 지워져요.</p>
            <ul>
              <li>탐험한 영역과 완료한 미션</li>
              <li>모은 별</li>
              <li>오답 복습 목록</li>
              <li>지금까지의 미션 기록</li>
            </ul>
            <p>효과음 설정은 그대로 남아요. 지운 기록은 되돌릴 수 없어요.</p>
          </ConfirmPanel>
        )}
      </div>
    </section>
  )
}
