import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../src/app/AppRoutes'
import { getCallQuizzes } from '../src/data'
import { createEmptyProgress } from '../src/features/progress/progress'
import { STORAGE_KEY } from '../src/services/storage'
import { SHELF_SEPARATOR, type Progress, type Quiz } from '../src/types'

function renderAt(path: string, { preview = false } = {}) {
  window.history.replaceState(null, '', preview ? '/?preview=1' : '/')
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

function saved(): Progress {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
}

function seedSteps(done: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...createEmptyProgress(), completedRules: done }))
}

const route = getCallQuizzes(true)
type User = ReturnType<typeof userEvent.setup>

async function placeBooks(user: User, order: string[]) {
  for (const book of order) await user.click(screen.getByRole('button', { name: `${book} 꽂기` }))
}

/** 문제 유형에 맞게 정답을 입력하고 제출한다. */
async function solve(user: User, quiz: Quiz) {
  if (quiz.type === 'shelf-order') {
    await placeBooks(user, quiz.correctAnswer.split(SHELF_SEPARATOR))
  } else if (quiz.template) {
    const chars = [...quiz.correctAnswer]
    for (const [i, t] of [...quiz.template].entries()) {
      if (t !== '□') continue
      const label = /^\d$/.test(chars[i]) ? `숫자 ${chars[i]}` : `글자 ${chars[i]}`
      await user.click(screen.getByRole('button', { name: label }))
    }
  } else {
    await user.click(screen.getByRole('radio', { name: quiz.correctAnswer }))
  }
  await user.click(screen.getByRole('button', { name: '제출하기' }))
}

describe('게임 4단계: 책 주소 완성하기', () => {
  it('기본 플레이에서는 검토 전 문항이 없어 아직 열리지 않았다고 안내한다', () => {
    renderAt('/level/4')
    expect(screen.getByRole('heading', { name: '아직 열리지 않은 단계예요' })).toBeInTheDocument()
  })

  it('첫 단계에서 라벨의 다섯 부분(별치·분류·저자·권차·복본)을 보여 준다', () => {
    renderAt('/level/4', { preview: true })
    expect(screen.getByText('문제 1 / 15')).toBeInTheDocument()
    expect(screen.getByText('책 주소의 다섯 부분')).toBeInTheDocument()
    const legend = screen.getByRole('list', { name: '라벨 각 줄의 뜻' })
    for (const name of ['별치기호', '분류기호', '저자기호', '권차기호', '복본기호']) expect(legend).toHaveTextContent(name)
  })

  it('분류기호와 저자기호 빈칸을 카드로 채워 책 주소를 만든다 (813.7 이15ㄷ)', async () => {
    const user = userEvent.setup()
    seedSteps(['call-1'])
    renderAt('/level/4', { preview: true })
    expect(screen.getByText('만든 책 주소: 8 빈칸 빈칸 . 7 이 빈칸 빈칸 ㄷ')).toBeInTheDocument()
    for (const n of ['1', '3', '1', '5']) await user.click(screen.getByRole('button', { name: `숫자 ${n}` }))
    await user.click(screen.getByRole('button', { name: '제출하기' }))
    expect(screen.getByRole('heading', { name: /정답이에요!/ })).toBeInTheDocument()
  })

  it('서가 정리: 책을 눌러 꽂고, 꽂은 책을 눌러 다시 빼며, 모두 꽂아야 제출된다', async () => {
    const user = userEvent.setup()
    seedSteps(['call-1', 'call-2'])
    renderAt('/level/4', { preview: true })
    expect(screen.getByText('📚 서가 정리')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: '서가에 꽂는 순서' })).toHaveTextContent('성이 같으면 숫자를 소수로 비교')

    await user.click(screen.getByRole('button', { name: '813.7 손66ㅇ 꽂기' }))
    await user.click(screen.getByRole('button', { name: '제출하기' }))
    expect(screen.getByRole('alert')).toHaveTextContent('책을 모두 서가에 꽂아 주세요.')

    // 잘못 꽂은 책을 다시 뺀다
    await user.click(screen.getByRole('button', { name: '1번째 813.7 손66ㅇ, 빼기' }))
    expect(within(screen.getByRole('list', { name: '서가에 꽂는 순서' }))).toBeTruthy()
    await placeBooks(user, ['813.7 김84ㅇ', '813.7 김95ㅂ', '813.7 손66ㅇ'])
    await user.click(screen.getByRole('button', { name: '제출하기' }))
    expect(screen.getByRole('heading', { name: /정답이에요!/ })).toBeInTheDocument()
  })

  it('서가 정리에서 틀리면 내 순서와 정답 순서를 화살표로 보여 준다', async () => {
    const user = userEvent.setup()
    seedSteps(['call-1', 'call-2'])
    renderAt('/level/4', { preview: true })
    await placeBooks(user, ['813.7 손66ㅇ', '813.7 김95ㅂ', '813.7 김84ㅇ'])
    await user.click(screen.getByRole('button', { name: '제출하기' }))
    expect(screen.getByRole('heading', { name: /정답이 아니에요/ })).toBeInTheDocument()
    expect(screen.getByText('813.7 손66ㅇ → 813.7 김95ㅂ → 813.7 김84ㅇ')).toBeInTheDocument()
    expect(screen.getByText('813.7 김84ㅇ → 813.7 김95ㅂ → 813.7 손66ㅇ', { selector: 'strong' })).toBeInTheDocument()
  })

  it('15문제를 끝까지 풀면 4개 단계가 완료되고 탐험 지도에 4단계 완료가 보인다', { timeout: 40000 }, async () => {
    const user = userEvent.setup()
    seedSteps([])
    renderAt('/level/4', { preview: true })
    for (const [i, quiz] of route.entries()) {
      await solve(user, quiz)
      await user.click(screen.getByRole('button', { name: i === route.length - 1 ? '결과 보기' : '다음 문제' }))
    }
    expect(screen.getByText(/책 주소만 보면 도서관 어디에서든 책을 찾을 수 있어요/)).toBeInTheDocument()
    expect(saved().completedRules).toEqual(['call-1', 'call-2', 'call-3', 'call-4'])
  })
})
