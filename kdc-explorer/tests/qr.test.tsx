import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../src/app/AppRoutes'
import { phoneUrl, PUBLIC_URL } from '../src/utils/phoneUrl'

const at = (href: string) => {
  const u = new URL(href)
  return { hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash }
}

describe('phoneUrl', () => {
  it('온라인 주소에서는 지금 주소를 그대로 쓴다', () => {
    expect(phoneUrl(at('https://example.org/cording/?preview=1#/level/2'))).toBe(
      'https://example.org/cording/?preview=1#/level/2',
    )
  })

  it('로컬(localhost)에서는 휴대폰이 열 수 있는 온라인 주소로 바꾸고, 미리보기와 화면 위치는 유지한다', () => {
    expect(phoneUrl(at('http://localhost:5173/?preview=1#/level/3'))).toBe(`${PUBLIC_URL}?preview=1#/level/3`)
  })
})

describe('📱 QR 버튼', () => {
  it('설정 옆의 QR 버튼으로 QR 코드를 열고 닫는다', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/map']}>
        <AppRoutes />
      </MemoryRouter>,
    )
    const button = screen.getByRole('button', { name: /QR/ })
    expect(button).toHaveAttribute('aria-expanded', 'false')

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog', { name: /휴대폰으로 보기/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '휴대폰으로 이 화면을 여는 QR 코드' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
