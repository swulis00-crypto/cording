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

export interface Quiz {
  id: string
  classificationId: string
  type: QuizType
  difficulty: number
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  hint: string
  reviewStatus: ReviewStatus
}

export type LearningStatus = 'not-started' | 'in-progress' | 'completed'
