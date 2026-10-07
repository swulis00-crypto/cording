import { useState } from 'react'
import { Link } from 'react-router'
import { isPreviewMode } from '../app/preview.ts'
import { useProgress } from '../app/useProgress.ts'
import { getClassification, getRule, getRuleQuizzes, rules } from '../data/index.ts'
import type { Quiz } from '../types/index.ts'
import { DivisionTable } from './quiz/DivisionTable.tsx'
import { GroupBanner } from './quiz/GroupBanner.tsx'
import { RuleKeyCard } from './quiz/RuleKeyCard.tsx'
import { Mission, type MissionGroups } from './quiz/Mission.tsx'
import styles from './quiz/Quiz.module.css'

/** 규칙별로 묶기: 지금 규칙과 문제 영역의 10개 구분표를 보여 주고, 규칙의 문제를 마치면 그 규칙을 완료로 저장한다. */
const RULE_GROUPS: MissionGroups = {
  keyOf: (quiz: Quiz) => quiz.rule ?? '',
  toResult: (ruleId) => ({ classificationId: null, ruleId }),
  renderBanner: (quiz, isFirst) => {
    const rule = quiz.rule ? getRule(quiz.rule) : undefined
    if (!rule) return null
    return (
      <GroupBanner
        symbol={rule.emoji}
        title={rule.title}
        count={`규칙 ${rules.findIndex((r) => r.id === rule.id) + 1} / ${rules.length}`}
        newLabel={isFirst ? '새 규칙 발견!' : undefined}
      >
        <p className={styles.areaDesc}>{rule.summary}</p>
        {rule.key && <RuleKeyCard ruleKey={rule.key} />}
        <DivisionTable area={quiz.table === 'main' ? undefined : getClassification(quiz.classificationId)} />
      </GroupBanner>
    )
  },
}

/**
 * 게임 2단계: 번호 속 비밀 풀기.
 * 규칙 4개를 차례로 발견하며 문제를 이어서 푼다. 규칙을 마칠 때마다 저장되고, 다시 들어오면 마치지 않은 규칙부터 이어 간다.
 */
export function RulesScreen() {
  const { progress } = useProgress()
  const preview = isPreviewMode()

  const [plan] = useState(() => {
    const all = getRuleQuizzes(preview)
    const firstUndone = all.findIndex((q) => !progress.completedRules.includes(q.rule ?? ''))
    const start = firstUndone === -1 ? 0 : firstUndone
    return { pool: all.slice(start), resumed: start > 0 }
  })

  if (plan.pool.length === 0) {
    return (
      <section className={styles.card}>
        <h1 className={styles.heading}>아직 열리지 않은 단계예요</h1>
        <p className={styles.gap}>문항은 선생님 검토가 끝나면 열려요.</p>
        <p className={styles.gap}>
          <Link to="/map">탐험 지도로 돌아가기</Link>
        </p>
      </section>
    )
  }

  const first = plan.pool[0].rule ? getRule(plan.pool[0].rule) : undefined

  return (
    <>
      {plan.resumed && first && (
        <p className={styles.resumeNote} role="status">
          지난번에 이어서 '{first.title}' 규칙부터 시작해요.
        </p>
      )}
      <Mission
        groups={RULE_GROUPS}
        title="번호 속 비밀 풀기"
        symbol="🔐"
        pool={plan.pool}
        kind="mission"
        doneText="번호 속에 숨은 규칙을 모두 찾아냈어요."
      />
    </>
  )
}
