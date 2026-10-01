/** 검수 상태. `approved`만 기본 플레이에 노출한다. (docs/DATA_POLICY.md) */
export type ReviewStatus = 'draft' | 'needs-review' | 'approved'

export const REVIEW_STATUSES: readonly ReviewStatus[] = ['draft', 'needs-review', 'approved']

/** KDC 분류 항목. 1차 시제품은 주류(level 1)만 사용하고, 100구분은 parentId로 연결한다. */
export interface Classification {
  id: string
  /** 분류번호. 앞자리 0을 지키기 위해 문자열로 저장한다. */
  code: string
  /** 공식 분류명 */
  name: string
  parentId: string | null
  level: number
  /** 중학생용 쉬운 설명 */
  learnerDescription: string
  exampleTopics: string[]
  /** 주제 판단을 돕는 힌트 */
  hint: string
  /** 혼동하기 쉬운 다른 분류의 id */
  confusedWith: string[]
  /** 화면에 함께 보여 줄 장식용 기호 (의미는 항상 텍스트로도 전달) */
  symbol: string
  sourceEdition: string
  reviewStatus: ReviewStatus
}

export type QuizType =
  | 'name-recall'
  | 'code-to-name'
  | 'topic-to-classification'
  | 'distinguish-similar'

export const QUIZ_TYPES: readonly QuizType[] = [
  'name-recall',
  'code-to-name',
  'topic-to-classification',
  'distinguish-similar',
]

/** 문제에 등장하는 책 (표지 카드로 보여 준다) */
export interface QuizBook {
  title: string
  emoji: string
}

/** 책을 찾으러 온 도서관 손님 (가상 인물) */
export interface QuizCharacter {
  name: string
  emoji: string
  /** 손님의 부탁 */
  line: string
  /** 제자리를 찾아 주었을 때 손님의 한마디 */
  thanks: string
}

export interface Quiz {
  id: string
  classificationId: string
  type: QuizType
  difficulty: number
  question: string
  character?: QuizCharacter
  book?: QuizBook
  options: string[]
  correctAnswer: string
  explanation: string
  hint: string
  /** 문제 속 책이 임의로 만든 '가상 예시'인지 (PRD 5.3) */
  fictional: boolean
  reviewStatus: ReviewStatus
}

export type LearningStatus = 'not-started' | 'in-progress' | 'completed'

/** mission: 영역 미션 전체, retry: 미션 안에서 틀린 문제만 다시, review: 오답 복습 */
export type MissionKind = 'mission' | 'retry' | 'review'

export interface MissionAttempt {
  kind: MissionKind
  classificationId: string | null
  finishedAt: string
  total: number
  correct: number
  score: number
}

/** 브라우저에 저장하는 학습 진행 상태 (PRD 9.4). 개인 식별 정보는 저장하지 않는다. */
export interface Progress {
  version: 1
  /** 소개를 열어 본 영역 (학습 중) */
  visitedClassifications: string[]
  /** 미션을 끝까지 푼 영역 (학습 완료) */
  completedClassifications: string[]
  /** 영역별 최고 정답 수 = 그 영역에서 얻은 별 (재도전해도 중복 집계하지 않음) */
  bestCorrect: Record<string, number>
  wrongQuestionIds: string[]
  quizAttempts: MissionAttempt[]
  unlockedBadges: string[]
  settings: {
    soundEnabled: boolean
  }
}
