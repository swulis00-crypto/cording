import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useProgress } from '../../app/useProgress.ts'
import { getRule } from '../../data/index.ts'
import type { NumberRule, Quiz } from '../../types/index.ts'
import { GroupBanner } from './GroupBanner.tsx'
import { Mission, type MissionGroups } from './Mission.tsx'
import styles from './Quiz.module.css'

interface Props {
  title: string
  symbol: string
  /** 단계(규칙) 순서 */
  steps: NumberRule[]
  /** 단계 순서 → 단계 안에서는 청구기호 순서로 정렬된 문항 */
  quizzes: Quiz[]
  /** 단계를 부르는 말 (규칙 / 단계) */
  stepNoun: string
  doneText: string
  /** 단계 안내 아래에 덧붙일 내용 (구분표, 기호표 등) */
  renderExtra: (step: NumberRule, quiz: Quiz) => ReactNode
}

/**
 * 게임 2·3단계 공통: 단계(규칙)를 차례로 거치며 문제를 이어서 푼다.
 * 단계를 마칠 때마다 저장되고, 다시 들어오면 마치지 않은 단계부터 이어 간다.
 */
export function StepJourney({ title, symbol, steps, quizzes, stepNoun, doneText, renderExtra }: Props) {
  const { progress } = useProgress()

  // 들어온 순간의 출발점을 고정한다 (푸는 동안 저장돼도 문제 목록이 바뀌지 않게).
  const [plan] = useState(() => {
    const firstUndone = quizzes.findIndex((q) => !progress.completedRules.includes(q.rule ?? ''))
    const start = firstUndone === -1 ? 0 : firstUndone
    return { pool: quizzes.slice(start), resumed: start > 0 }
  })

  // 단계별로 묶기: 지금 단계 안내를 보여 주고, 단계의 문제를 마치면 그 단계를 완료로 저장한다.
  const [groups] = useState<MissionGroups>(() => ({
    keyOf: (quiz) => quiz.rule ?? '',
    toResult: (ruleId) => ({ classificationId: null, ruleId }),
    renderBanner: (quiz, isFirst) => {
      const step = quiz.rule ? getRule(quiz.rule) : undefined
      if (!step) return null
      return (
        <GroupBanner
          symbol={step.emoji}
          title={step.title}
          count={`${stepNoun} ${steps.findIndex((s) => s.id === step.id) + 1} / ${steps.length}`}
          newLabel={isFirst ? `새 ${stepNoun} 발견!` : undefined}
        >
          <p className={styles.areaDesc}>{step.summary}</p>
          {renderExtra(step, quiz)}
        </GroupBanner>
      )
    },
  }))

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
          지난번에 이어서 '{first.title}' {stepNoun}부터 시작해요.
        </p>
      )}
      <Mission groups={groups} title={title} symbol={symbol} pool={plan.pool} kind="mission" doneText={doneText} />
    </>
  )
}
