/** 휴대폰으로 열 온라인 주소. 로컬(localhost)에서 볼 때는 휴대폰이 열 수 없으므로 이 주소로 바꾼다. */
export const PUBLIC_URL: string = import.meta.env.VITE_PUBLIC_URL ?? 'https://swulis00-crypto.github.io/cording/'

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]']

/** 지금 보고 있는 화면을 휴대폰에서 열 주소 (미리보기 모드·화면 위치 유지) */
export function phoneUrl(location: Pick<Location, 'hostname' | 'origin' | 'pathname' | 'search' | 'hash'>): string {
  const base = LOCAL_HOSTS.includes(location.hostname) ? PUBLIC_URL : location.origin + location.pathname
  return base + location.search + location.hash
}
