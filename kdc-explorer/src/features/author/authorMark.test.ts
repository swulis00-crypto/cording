import { describe, expect, it } from 'vitest'
import { authorMark, compareAuthorMarks, consonantCode, splitSyllable, vowelCode } from './authorMark.ts'

describe('splitSyllable', () => {
  it('한글 음절을 초성·중성으로 나눈다', () => {
    expect(splitSyllable('꽃')).toEqual({ initial: 'ㄲ', medial: 'ㅗ' })
    expect(splitSyllable('희')).toEqual({ initial: 'ㅎ', medial: 'ㅢ' })
    expect(splitSyllable('A')).toBeNull()
  })
})

describe('기호표 (이재철 제5표)', () => {
  it('자음 기호: 겹자음은 기본 자음과 같다', () => {
    expect(['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'].map(consonantCode)).toEqual(
      ['1', '1', '19', '2', '2', '29', '3', '4', '5', '6', '7', '8', '87', '88', '89', '9'],
    )
  })

  it('모음 기호: 초성이 ㅊ이면 다른 칸을 쓴다', () => {
    expect(['ㅏ', 'ㅐ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅣ'].map((v) => vowelCode(v, false))).toEqual(['2', '3', '4', '5', '6', '7', '8'])
    expect(['ㅏ', 'ㅐ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅣ'].map((v) => vowelCode(v, true))).toEqual(['2', '2', '3', '4', '5', '5', '6'])
  })

  it('자음 기호를 소수로 읽으면 가나다 순서가 그대로 유지된다', () => {
    const codes = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'].map((c) => Number(`0.${consonantCode(c)}`))
    expect([...codes].sort((a, b) => a - b)).toEqual(codes)
  })
})

describe('authorMark', () => {
  it('학습지·문서의 예시와 같은 저자기호를 만든다', () => {
    expect(authorMark('최은영', '밝은 밤')).toBe('최67ㅂ')
    expect(authorMark('이꽃님', '당연하게도 나는 너를')).toBe('이15ㄷ')
    expect(authorMark('이미예', '달러구트 꿈 백화점')).toBe('이38ㄷ')
    expect(authorMark('이희영', '페인트')).toBe('이97ㅍ')
    expect(authorMark('한강', '소년이 온다')).toBe('한12ㅅ')
    expect(authorMark('손원평', '아몬드')).toBe('손66ㅇ')
    expect(authorMark('김초엽', '우리가 빛의 속도로 갈 수 없다면')).toBe('김84ㅇ')
    expect(authorMark('김호연', '불편한 편의점')).toBe('김95ㅂ')
    expect(authorMark('황영미', '체리새우: 비밀글입니다')).toBe('황64ㅊ')
    expect(authorMark('백온유', '유원')).toBe('백65ㅇ')
  })
})

describe('compareAuthorMarks', () => {
  it('숫자는 소수처럼 비교한다: 최5 → 최52 → 최6', () => {
    expect(['최6', '최52', '최5'].sort(compareAuthorMarks)).toEqual(['최5', '최52', '최6'])
  })

  it('숫자가 같으면 제목 초성 순서로 줄 선다', () => {
    expect(['이15ㅇ', '이15ㄷ', '이15ㅅ'].sort(compareAuthorMarks)).toEqual(['이15ㄷ', '이15ㅅ', '이15ㅇ'])
  })

  it('저자기호 순서 = 작가 이름 가나다순', () => {
    const marks = ['이97ㅍ', '이15ㄷ', '이38ㄷ'] // 이희영, 이꽃님, 이미예
    expect(marks.sort(compareAuthorMarks)).toEqual(['이15ㄷ', '이38ㄷ', '이97ㅍ'])
  })
})
