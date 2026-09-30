import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom은 스크롤을 구현하지 않는다.
window.scrollTo = () => {}

afterEach(() => {
  cleanup()
  localStorage.clear()
})
