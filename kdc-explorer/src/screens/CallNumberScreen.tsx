import { useState } from 'react'
import { isPreviewMode } from '../app/preview.ts'
import { callSteps, getCallQuizzes } from '../data/index.ts'
import { CallNumberParts, ShelfRules } from './quiz/CallVisuals.tsx'
import { StepJourney } from './quiz/StepJourney.tsx'

/** 게임 4단계: 책 주소 완성하기. 분류기호와 저자기호를 합쳐 청구기호를 만들고, 서가에 줄 세운다. */
export function CallNumberScreen() {
  const [quizzes] = useState(() => getCallQuizzes(isPreviewMode()))

  return (
    <StepJourney
      title="책 주소 완성하기"
      symbol="🏠"
      steps={callSteps}
      quizzes={quizzes}
      stepNoun="단계"
      doneText="이제 책 주소만 보면 도서관 어디에서든 책을 찾을 수 있어요."
      renderExtra={(step) =>
        step.visual === 'call-parts' ? <CallNumberParts /> : step.visual === 'shelf-rules' ? <ShelfRules /> : null
      }
    />
  )
}
