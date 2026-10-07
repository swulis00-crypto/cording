import { useState } from 'react'
import { isPreviewMode } from '../app/preview.ts'
import { authorSteps, getAuthorQuizzes } from '../data/index.ts'
import { AuthorCodeTable, AuthorMarkParts } from './quiz/AuthorVisuals.tsx'
import { StepJourney } from './quiz/StepJourney.tsx'

/** 게임 3단계: 저자기호 만들기. 저자기호의 구성도와 기호표(이재철 제5표)를 보여 준다. */
export function AuthorScreen() {
  const [quizzes] = useState(() => getAuthorQuizzes(isPreviewMode()))

  return (
    <StepJourney
      title="저자기호 만들기"
      symbol="🏷️"
      steps={authorSteps}
      quizzes={quizzes}
      stepNoun="단계"
      doneText="저자기호를 만들고 읽는 방법을 모두 익혔어요."
      renderExtra={(step) =>
        step.visual === 'author-parts' ? <AuthorMarkParts /> : step.visual === 'author-table' ? <AuthorCodeTable /> : null
      }
    />
  )
}
