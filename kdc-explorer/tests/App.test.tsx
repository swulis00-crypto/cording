import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../src/App'

describe('App', () => {
  it('게임 제목을 표시한다', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'KDC 탐험대' })).toBeInTheDocument()
  })
})
