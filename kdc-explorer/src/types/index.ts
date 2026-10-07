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
  /** 규칙으로 번호의 뜻 추리하기 (게임 2단계) */
  | 'rule-inference'
  /** 숫자 카드로 빈칸을 채워 번호 만들기 (게임 2단계) */
  | 'build-number'

export const QUIZ_TYPES: readonly QuizType[] = [
  'name-recall',
  'code-to-name',
  'topic-to-classification',
  'distinguish-similar',
  'rule-inference',
  'build-number',
]

/** 번호 조립 문제의 빈칸 표시 */
export const BLANK = '□'

/** 게임 2단계: 학생이 발견하는 분류기호 규칙 */
export interface NumberRule {
  id: string
  emoji: string
  title: string
  summary: string
  /** 숫자 해독표: 규칙이 다루는 자리의 숫자별 뜻 (예: 셋째 자리 1 시, 2 희곡 …) */
  key?: RuleKey
  reviewStatus: ReviewStatus
}

export interface RuleKey {
  /** 예: "셋째 자리" */
  position: string
  /** 그 자리를 □로 표시한 번호 모양 (예: "8□□") */
  pattern: string
  digits: { digit: string; label: string }[]
}

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
  /** 게임 2단계 문항이 속한 규칙 id */
  rule?: string
  /** 이 문제가 다루는 청구기호(분류번호). 규칙 안에서 이 번호 순서로 출제한다 */
  callNumber?: string
  /** 번호 조립 문제의 틀 (예: "7□0"). 보기는 숫자 카드, 정답은 완성된 번호 */
  template?: string
  /** 게임 2단계에서 문제 위에 보여 줄 구분표. 기본은 문항 영역의 10개 구분, 'main'이면 10개 주류 */
  table?: 'main'
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
  /** 게임 2단계 규칙 미션이면 그 규칙 id */
  ruleId?: string
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
  /** 게임 2단계에서 마친 규칙 */
  completedRules: string[]
  /** 영역별 최고 정답 수 = 그 영역에서 얻은 별 (재도전해도 중복 집계하지 않음) */
  bestCorrect: Record<string, number>
  wrongQuestionIds: string[]
  quizAttempts: MissionAttempt[]
  unlockedBadges: string[]
  settings: {
    soundEnabled: boolean
  }
}
