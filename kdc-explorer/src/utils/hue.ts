import type { CSSProperties } from 'react'

/**
 * 분류번호 첫 자리에 맞는 주류 라벨 색상을 CSS 변수로 지정한다. 하위 분류도 같은 색을 쓴다.
 * --hue: 라벨 색, --hue-ink: 밝은 바탕 위 글자색, --hue-on: 라벨 색 위 글자색
 */
export function hueStyle(code: string): CSSProperties {
  const n = code.charAt(0)
  return {
    '--hue': `var(--c${n})`,
    '--hue-ink': `var(--c${n}-ink)`,
    '--hue-on': `var(--c${n}-on)`,
  } as CSSProperties
}
