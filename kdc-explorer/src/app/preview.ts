/**
 * 미리보기 모드: 주소에 `?preview=1`을 붙이면 검토 전(draft·needs-review) 문항도 출제한다.
 * 예) http://localhost:5173/?preview=1#/map
 * 선생님이 문항을 검토하거나 개발 중 확인할 때만 사용한다.
 */
export function isPreviewMode(search: string = typeof window !== 'undefined' ? window.location.search : ''): boolean {
  if (new URLSearchParams(search).get('preview') === '1') return true
  if (typeof window !== 'undefined' && window.location.hash) {
    const hashQuery = window.location.hash.split('?')[1]
    if (hashQuery && new URLSearchParams(hashQuery).get('preview') === '1') return true
  }
  return false
}
