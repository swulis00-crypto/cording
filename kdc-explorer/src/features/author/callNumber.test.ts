import { describe, expect, it } from 'vitest'
import { compareCallNumbers, parseCallNumber } from './callNumber.ts'

describe('parseCallNumber', () => {
  it('분류기호·저자기호·권차·복본을 나눈다', () => {
    expect(parseCallNumber('813.7 박54ㅂ v.2 c.3')).toEqual({ classNumber: 813.7, authorMark: '박54ㅂ', volume: 2, copy: 3 })
    expect(parseCallNumber('811.7 박45ㅅ')).toEqual({ classNumber: 811.7, authorMark: '박45ㅅ', volume: 0, copy: 0 })
  })

  it('형식이 아니면 오류', () => {
    expect(() => parseCallNumber('김84ㅇ')).toThrow()
  })
})

describe('compareCallNumbers', () => {
  const sort = (labels: string[]) => [...labels].sort(compareCallNumbers)

  it('분류기호가 먼저: 저자기호가 앞서도 분류기호가 크면 뒤에 온다', () => {
    expect(sort(['814.7 김52ㅅ', '813.7 최67ㅂ', '811.7 박45ㅅ', '813.7 김95ㅂ'])).toEqual([
      '811.7 박45ㅅ',
      '813.7 김95ㅂ',
      '813.7 최67ㅂ',
      '814.7 김52ㅅ',
    ])
  })

  it('분류기호가 같으면 저자기호: 성 가나다 → 숫자는 소수로', () => {
    expect(sort(['813.7 손66ㅇ', '813.7 김95ㅂ', '813.7 김84ㅇ'])).toEqual(['813.7 김84ㅇ', '813.7 김95ㅂ', '813.7 손66ㅇ'])
    expect(sort(['813.7 최6', '813.7 최52', '813.7 최5', '813.7 최19'])).toEqual([
      '813.7 최19',
      '813.7 최5',
      '813.7 최52',
      '813.7 최6',
    ])
  })

  it('저자기호까지 같으면 권차, 그다음 복본', () => {
    expect(sort(['813.7 박54ㅂ v.2', '813.7 박54ㅂ v.3', '813.7 박54ㅂ v.1'])).toEqual([
      '813.7 박54ㅂ v.1',
      '813.7 박54ㅂ v.2',
      '813.7 박54ㅂ v.3',
    ])
    expect(sort(['813.7 손66ㅇ c.3', '813.7 손66ㅇ c.1'])).toEqual(['813.7 손66ㅇ c.1', '813.7 손66ㅇ c.3'])
  })
})
