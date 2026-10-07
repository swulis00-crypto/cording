// 저자기호 (이재철 한글순도서기호법 제5표). docs/GAME_LEVELS.md 게임 3단계
// 저자기호 = 작가의 성 + 이름 두 번째 글자의 자음 기호 + 모음 기호 + 책 제목 첫 글자의 초성

const INITIALS = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
const MEDIALS = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']

/** 자음 기호표: 이름 두 번째 글자의 초성 */
export const CONSONANT_TABLE: { letters: string[]; code: string }[] = [
  { letters: ['ㄱ', 'ㄲ'], code: '1' },
  { letters: ['ㄴ'], code: '19' },
  { letters: ['ㄷ', 'ㄸ'], code: '2' },
  { letters: ['ㄹ'], code: '29' },
  { letters: ['ㅁ'], code: '3' },
  { letters: ['ㅂ', 'ㅃ'], code: '4' },
  { letters: ['ㅅ', 'ㅆ'], code: '5' },
  { letters: ['ㅇ'], code: '6' },
  { letters: ['ㅈ', 'ㅉ'], code: '7' },
  { letters: ['ㅊ'], code: '8' },
  { letters: ['ㅋ'], code: '87' },
  { letters: ['ㅌ'], code: '88' },
  { letters: ['ㅍ'], code: '89' },
  { letters: ['ㅎ'], code: '9' },
]

/** 모음 기호표: 이름 두 번째 글자의 중성. 초성이 ㅊ이면 오른쪽 칸(chieut)을 쓴다. */
export const VOWEL_TABLE: { letters: string[]; code: string; chieut: string }[] = [
  { letters: ['ㅏ'], code: '2', chieut: '2' },
  { letters: ['ㅐ', 'ㅑ', 'ㅒ'], code: '3', chieut: '2' },
  { letters: ['ㅓ', 'ㅔ', 'ㅕ', 'ㅖ'], code: '4', chieut: '3' },
  { letters: ['ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ'], code: '5', chieut: '4' },
  { letters: ['ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ'], code: '6', chieut: '5' },
  { letters: ['ㅡ', 'ㅢ'], code: '7', chieut: '5' },
  { letters: ['ㅣ'], code: '8', chieut: '6' },
]

/** 한글 음절을 초성·중성으로 나눈다. 한글이 아니면 null */
export function splitSyllable(ch: string): { initial: string; medial: string } | null {
  const code = ch.charCodeAt(0) - 0xac00
  if (ch.length !== 1 || code < 0 || code > 11171) return null
  return { initial: INITIALS[Math.floor(code / 588)], medial: MEDIALS[Math.floor((code % 588) / 28)] }
}

export function consonantCode(initial: string): string {
  const row = CONSONANT_TABLE.find((r) => r.letters.includes(initial))
  if (!row) throw new Error(`자음 기호표에 없는 자음: ${initial}`)
  return row.code
}

export function vowelCode(medial: string, initialIsChieut: boolean): string {
  const row = VOWEL_TABLE.find((r) => r.letters.includes(medial))
  if (!row) throw new Error(`모음 기호표에 없는 모음: ${medial}`)
  return initialIsChieut ? row.chieut : row.code
}

/**
 * 저자기호를 만든다. 한 글자 성의 한국인 작가만 다룬다 (두 글자 성·외국인 작가는 1차 범위 밖).
 * 예: authorMark('최은영', '밝은 밤') === '최67ㅂ'
 */
export function authorMark(authorName: string, title: string): string {
  const name = [...authorName.trim()]
  const second = splitSyllable(name[1] ?? '')
  const titleFirst = splitSyllable([...title.trim()][0] ?? '')
  if (name.length < 2 || !second || !titleFirst) throw new Error(`저자기호를 만들 수 없음: ${authorName} / ${title}`)
  const isChieut = second.initial === 'ㅊ'
  return name[0] + consonantCode(second.initial) + vowelCode(second.medial, isChieut) + titleFirst.initial
}

/** 초성 순서 (제목 초성으로 줄 세울 때) */
const INITIAL_ORDER = INITIALS

/**
 * 같은 성 안에서 저자기호 순서를 비교한다: 숫자는 소수처럼 읽고, 같으면 제목 초성 순서.
 * 예: 최5 < 최52 < 최6
 */
export function compareAuthorMarks(a: string, b: string): number {
  const parse = (mark: string) => {
    const m = /^(\D)(\d+)(\D?)$/.exec(mark)
    if (!m) throw new Error(`저자기호 형식이 아님: ${mark}`)
    return { surname: m[1], digits: m[2], initial: m[3] }
  }
  const x = parse(a)
  const y = parse(b)
  if (x.surname !== y.surname) return x.surname.localeCompare(y.surname, 'ko')
  const dx = Number(`0.${x.digits}`)
  const dy = Number(`0.${y.digits}`)
  if (dx !== dy) return dx - dy
  return INITIAL_ORDER.indexOf(x.initial) - INITIAL_ORDER.indexOf(y.initial)
}
