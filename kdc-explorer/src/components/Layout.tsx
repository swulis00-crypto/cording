import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { isPreviewMode } from '../app/preview.ts'
import { useProgress } from '../app/useProgress.ts'
import { dataErrors } from '../data/index.ts'
import { DataErrorBanner } from './DataErrorBanner.tsx'
import styles from './Layout.module.css'

export function Layout() {
  const { pathname } = useLocation()
  const { recoveredNotice, dismissRecoveredNotice } = useProgress()

  // 다른 화면으로 이동하면 맨 위부터 보여 준다.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand}>
            <span aria-hidden="true">🗝️</span> KDC 탐험대
          </Link>
          <nav aria-label="주요 메뉴">
            <ul className={styles.nav}>
              <li>
                <NavLink to="/levels">게임 단계</NavLink>
              </li>
              <li>
                <NavLink to="/map">탐험 지도</NavLink>
              </li>
              <li>
                <NavLink to="/codex">분류 도감</NavLink>
              </li>
              <li>
                <NavLink to="/review">오답 복습</NavLink>
              </li>
              <li>
                <NavLink to="/settings">설정</NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <div className={styles.gutter}>
        <DataErrorBanner errors={dataErrors} />
        {recoveredNotice && (
          <div className={styles.notice} role="alert">
            <p>
              <strong>저장된 탐험 기록을 읽을 수 없어서 새로 시작해요.</strong> 기록이 손상되었을 수 있어요.
            </p>
            <button type="button" className="btn" onClick={dismissRecoveredNotice}>
              확인
            </button>
          </div>
        )}
        {isPreviewMode() && (
          <p className={styles.preview} role="note">
            <strong>미리보기 모드</strong> · 선생님 검토 전 문항도 함께 보여요. 학생에게는 주소에서 <code>?preview=1</code>을
            뺀 화면을 안내해 주세요.
          </p>
        )}
      </div>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
