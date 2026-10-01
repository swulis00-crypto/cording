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
    summary: '000부터 900까지, KDC의 10개 큰 영역을 탐험해요.',
    path: '/map',
    ready: true,
  },
  {
    number: 2,
    title: '번호 속 비밀 풀기',
    summary: '813은 왜 한국 소설일까? 번호 둘째·셋째 자리의 규칙을 풀어요.',
    path: '/level/2',
    ready: false,
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

/** 게임 1단계 완료 = 주류 10개 미션을 모두 끝냄 */
export function isLevelCompleted(level: number, progress: Progress, mainClassIds: string[]): boolean {
  if (level === 1) return mainClassIds.length > 0 && mainClassIds.every((id) => progress.completedClassifications.includes(id))
  return false
}

/** 1단계는 항상 열려 있고, 그다음은 이전 단계를 마치면 열린다. 미리보기 모드에서는 모두 열린다. */
export function isLevelUnlocked(level: number, progress: Progress, mainClassIds: string[], preview: boolean): boolean {
  return level === 1 || preview || isLevelCompleted(level - 1, progress, mainClassIds)
}
