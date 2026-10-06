// 게임 단계 (docs/GAME_LEVELS.md)
import type { Progress } from '../../types/index.ts'

export interface GameLevel {
  number: number
  title: string
  summary: string
  /** 이 단계의 첫 화면 */
  path: string
  /** 아직 만들지 않은 단계는 false */
  ready: boolean
}

export const GAME_LEVELS: GameLevel[] = [
  {
    number: 1,
    title: '지식 구역 탐험',
    summary: '000부터 900까지 10개 구역을 차례로 돌며, 손님이 찾는 책을 제자리에 돌려놓아요.',
    path: '/journey',
    ready: true,
  },
  {
    number: 2,
    title: '번호 속 비밀 풀기',
    summary: '813은 왜 한국 소설일까? 번호 둘째·셋째 자리의 규칙을 풀어요.',
    path: '/level/2',
    ready: true,
  },
  {
    number: 3,
    title: '저자기호 만들기',
    summary: '이15ㄷ은 무슨 뜻일까? 저자기호를 직접 만들어 봐요.',
    path: '/level/3',
    ready: false,
  },
  {
    number: 4,
    title: '책 주소 완성하기',
    summary: '분류기호와 저자기호를 합쳐 책이 사는 주소(청구기호)를 완성해요.',
    path: '/level/4',
    ready: false,
  },
]

/** 단계별 완료 조건에 쓰는 콘텐츠 목록 */
export interface LevelContent {
  mainClassIds: string[]
  ruleIds: string[]
}

/**
 * 게임 1단계 완료 = 주류 10개 구역을 모두 마침
 * 게임 2단계 완료 = 규칙을 모두 마침
 */
export function isLevelCompleted(level: number, progress: Progress, content: LevelContent): boolean {
  const all = (ids: string[], done: string[]) => ids.length > 0 && ids.every((id) => done.includes(id))
  if (level === 1) return all(content.mainClassIds, progress.completedClassifications)
  if (level === 2) return all(content.ruleIds, progress.completedRules)
  return false
}

/** 1단계는 항상 열려 있고, 그다음은 이전 단계를 마치면 열린다. 미리보기 모드에서는 모두 열린다. */
export function isLevelUnlocked(level: number, progress: Progress, content: LevelContent, preview: boolean): boolean {
  return level === 1 || preview || isLevelCompleted(level - 1, progress, content)
}
