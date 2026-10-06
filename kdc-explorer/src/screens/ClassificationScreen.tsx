import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { isPreviewMode } from '../app/preview.ts'
import { useProgress } from '../app/useProgress.ts'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { getClassification, getMissionQuizzes } from '../data/index.ts'
import { learningStatus } from '../features/progress/progress.ts'
import { hueStyle } from '../utils/hue.ts'
import styles from './ClassificationScreen.module.css'

/** SCR-04 주류 소개 */
export function ClassificationScreen() {
  const { id = '' } = useParams()
  const classification = getClassification(id)
  const { progress, visit } = useProgress()

  // 소개를 열면 '학습 중'으로 기록한다.
  useEffect(() => {
    if (classification) visit(classification.id)
  }, [classification, visit])

  if (!classification) {
    return (
      <section className={styles.card}>
        <h1 className={styles.name}>영역을 찾을 수 없어요</h1>
        <p className={styles.section}>주소가 잘못되었거나 아직 준비되지 않은 영역이에요.</p>
        <p className={styles.section}>
          <Link to="/map">탐험 지도로 돌아가기</Link>
        </p>
      </section>
    )
  }

  const missionCount = getMissionQuizzes(classification.id, isPreviewMode()).length
  const confused = classification.confusedWith
    .map((cid) => getClassification(cid))
    .filter((c) => c !== undefined)

  return (
    <article className={styles.card} style={hueStyle(classification.code)} aria-labelledby="classification-title">
      <p className={styles.back}>
        <Link to="/map">← 탐험 지도</Link>
      </p>

      <header className={styles.header}>
        <span className={styles.symbol} aria-hidden="true">
          {classification.symbol}
        </span>
        <div>
          <p className={styles.code}>{classification.code}</p>
          <h1 id="classification-title" className={styles.name}>
            {classification.name}
          </h1>
        </div>
      </header>

      <div className={styles.tags}>
        <StatusBadge status={learningStatus(progress, classification.id)} />
        {classification.level === 1 && <span className={styles.tag}>주류 (10개의 큰 영역 중 하나)</span>}
        {classification.reviewStatus !== 'approved' && (
          <span className={`${styles.tag} ${styles.reviewTag}`}>선생님 검토 중인 내용</span>
        )}
      </div>

      <section className={styles.section} aria-labelledby="desc-title">
        <h2 id="desc-title">어떤 영역일까요?</h2>
        <p>{classification.learnerDescription}</p>
      </section>

      {classification.exampleTopics.length > 0 && (
        <section className={styles.section} aria-labelledby="topics-title">
          <h2 id="topics-title">대표 주제</h2>
          <ul className={styles.topics}>
            {classification.exampleTopics.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        </section>
      )}

      {classification.hint && (
        <section className={`${styles.section} ${styles.hint}`} aria-labelledby="hint-title">
          <h2 id="hint-title">
            <span aria-hidden="true">💡</span> 판단 힌트
          </h2>
          <p>{classification.hint}</p>
        </section>
      )}

      {confused.length > 0 && (
        <section className={styles.section} aria-labelledby="confused-title">
          <h2 id="confused-title">헷갈리기 쉬운 영역</h2>
          <ul className={styles.confused}>
            {confused.map((c) => (
              <li key={c.id}>
                <Link to={`/classification/${c.id}`}>
                  {c.code} {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className={styles.scope}>
        지금은 10개의 큰 영역(주류)만 배워요. 더 자세한 분류는 다음 탐험에서 열려요.
      </p>

      <div className={styles.actions}>
        {missionCount > 0 ? (
          <Link to={`/mission/${classification.id}`} className="btn btn-primary">
            이 구역 문제 풀기 ({missionCount}문제)
          </Link>
        ) : (
          <>
            <button type="button" className="btn btn-primary" disabled aria-describedby="mission-note">
              미션 시작
            </button>
            <p id="mission-note" className={styles.note}>
              아직 공개된 문항이 없어요. 선생님 검토가 끝나면 미션이 열려요.
            </p>
          </>
        )}
      </div>
    </article>
  )
}
