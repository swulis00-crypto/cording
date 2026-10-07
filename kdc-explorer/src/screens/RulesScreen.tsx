import { useState } from 'react'
import { isPreviewMode } from '../app/preview.ts'
import { getClassification, getRuleQuizzes, rules } from '../data/index.ts'
import { DivisionTable } from './quiz/DivisionTable.tsx'
import { RuleKeyCard } from './quiz/RuleKeyCard.tsx'
import { StepJourney } from './quiz/StepJourney.tsx'

/** 게임 2단계: 번호 속 비밀 풀기. 규칙 카드(해독표)와 문제 영역의 10개 구분표를 보여 준다. */
export function RulesScreen() {
  const [quizzes] = useState(() => getRuleQuizzes(isPreviewMode()))

  return (
    <StepJourney
      title="번호 속 비밀 풀기"
      symbol="🔐"
      steps={rules}
      quizzes={quizzes}
      stepNoun="규칙"
      doneText="번호 속에 숨은 규칙을 모두 찾아냈어요."
      renderExtra={(rule, quiz) => (
        <>
          {rule.key && <RuleKeyCard ruleKey={rule.key} />}
          <DivisionTable area={quiz.table === 'main' ? undefined : getClassification(quiz.classificationId)} />
        </>
      )}
    />
  )
}
