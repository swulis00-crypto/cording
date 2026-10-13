// 청구기호(책 주소) 서가 순서. docs/GAME_LEVELS.md 게임 4단계
// 순서: 분류기호(작은 수부터) → 저자기호(성 가나다 → 숫자는 소수 → 제목 초성) → 권차(v.) → 복본(c.)
import { compareAuthorMarks } from './authorMark.ts'

interface CallNumber {
  classNumber: number
  authorMark: string
  volume: number
  copy: number
}

/** "813.7 김84ㅇ v.2 c.3" 형식을 나눈다 (별치기호가 붙은 라벨은 다루지 않는다). */
export function parseCallNumber(label: string): CallNumber {
  const parts = label.trim().split(/\s+/)
  const [classPart, authorPart] = parts
  if (!classPart || !/^\d{3}(\.\d+)?$/.test(classPart) || !authorPart) throw new Error(`청구기호 형식이 아님: ${label}`)
  const pick = (prefix: string) => {
    const found = parts.find((p) => p.startsWith(prefix))
    return found ? Number(found.slice(prefix.length)) : 0
  }
  return { classNumber: Number(classPart), authorMark: authorPart, volume: pick('v.'), copy: pick('c.') }
}

/** 서가에 꽂는 순서로 두 청구기호를 비교한다. */
export function compareCallNumbers(a: string, b: string): number {
  const x = parseCallNumber(a)
  const y = parseCallNumber(b)
  return (
    x.classNumber - y.classNumber ||
    compareAuthorMarks(x.authorMark, y.authorMark) ||
    x.volume - y.volume ||
    x.copy - y.copy
  )
}
