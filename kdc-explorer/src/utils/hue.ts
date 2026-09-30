import type { CSSProperties } from 'react'

/** 분류번호 첫 자리에 맞는 주류 색상을 CSS 변수 --hue로 지정한다. 하위 분류도 같은 색을 쓴다. */
export function hueStyle(code: string): CSSProperties {
  return { '--hue': `var(--c${code.charAt(0)})` } as CSSProperties
}
