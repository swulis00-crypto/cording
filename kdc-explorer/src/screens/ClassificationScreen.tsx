import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { useProgress } from '../app/useProgress.ts'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { getClassification } from '../data/index.ts'
import { learningStatus } from '../features/progress/progress.ts'
import { hueStyle } from '../utils/hue.ts'
import { DivisionTable } from './quiz/DivisionTable.tsx'
import styles from './ClassificationScreen.module.css'

/** SCR-04 주류 소개 (분류 도감 상세). 설명만 하고, 문제는 탐험 지도의 단계에서 푼다. */
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
          <Link to="/codex">분류 도감으로 돌아가기</Link>
        </p>
      </section>
    )
  }

  const confused = classification.confusedWith
    .map((cid) => getClassification(cid))
    .filter((c) => c !== undefined)

  return (
    <article className={styles.card} style={hueStyle(classification.code)} aria-labelledby="classification-title">
      <p className={styles.back}>
        <Link to="/codex">← 분류 도감</Link>
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

      <section className={styles.section} aria-labelledby="topics-title">
        <h2 id="topics-title">대표 주제 · 10개 구분</h2>
        <DivisionTable area={classification} />
      </section>

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

      <div className={styles.actions}>
        <Link to="/map" className="btn btn-primary">
          <span aria-hidden="true">🧭 </span>탐험 지도에서 문제 풀기
        </Link>
        <p className={styles.note}>문제는 탐험 지도의 단계에서 차례로 풀어요.</p>
      </div>
    </article>
  )
}
