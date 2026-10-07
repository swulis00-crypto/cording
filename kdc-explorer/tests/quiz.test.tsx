import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../src/app/AppRoutes'
import { createEmptyProgress } from '../src/features/progress/progress'
import { STORAGE_KEY } from '../src/services/storage'

function renderAt(path: string, { preview = false } = {}) {
  window.history.replaceState(null, '', preview ? '/?preview=1' : '/')
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

type User = ReturnType<typeof userEvent.setup>

async function answer(user: User, option: string) {
  await user.click(screen.getByRole('radio', { name: option }))
  await user.click(screen.getByRole('button', { name: '제출하기' }))
}

// 1단계 여정의 첫 구역(000 총류): ① 하준이의 백과사전 → 000 총류  ② 서윤이의 코딩 책 → 000 총류
describe('미션 진행 (1단계 여정의 첫 구역)', () => {
  it('문제 번호·점수·서가 진행판과 문제 유형, 검토 전 표시를 보여 준다', () => {
    renderAt('/journey', { preview: true })
    expect(screen.getByText('문제 1 / 20')).toBeInTheDocument()
    expect(screen.getByText('점수 0점')).toBeInTheDocument()
    expect(screen.getByText('서가 복구 0 / 20')).toBeInTheDocument()
    expect(screen.getByText('📦 제자리 찾아 주기')).toBeInTheDocument()
    expect(screen.getByText('검토 전 문항 (미리보기)')).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(4)
  })

  it('답을 고르지 않고 제출하면 안내한다', async () => {
    renderAt('/journey', { preview: true })
    await userEvent.click(screen.getByRole('button', { name: '제출하기' }))
    expect(screen.getByRole('alert')).toHaveTextContent('답을 하나 골라 주세요.')
    expect(screen.getByText('문제 1 / 20')).toBeInTheDocument()
  })

  it('힌트를 볼 수 있고 힌트를 봐도 진행할 수 있다', async () => {
    const user = userEvent.setup()
    renderAt('/journey', { preview: true })
    await user.click(screen.getByRole('button', { name: '힌트 보기' }))
    expect(screen.getByText(/이 책은 한 가지 분야만 다룰까요/)).toBeInTheDocument()
    await answer(user, '000 총류')
    expect(screen.getByRole('heading', { name: /정답이에요!/ })).toBeInTheDocument()
  })

  it('손님의 부탁과 가상 예시 책 카드를 보여 주고, 맞히면 손님이 고마워한다', async () => {
    const user = userEvent.setup()
    renderAt('/journey', { preview: true })
    expect(screen.getByText(/이 백과사전 한 권이면 다 알 수 있겠죠/)).toBeInTheDocument()
    expect(screen.getByText('『세상의 모든 궁금증 백과사전』')).toBeInTheDocument()
    expect(screen.getByText('가상 예시')).toBeInTheDocument()
    await answer(user, '000 총류')
    expect(screen.getByText('찾았다! 오늘부터 우리 반 궁금증 해결사는 나야!')).toBeInTheDocument()
  })

  it('틀리면 손님이 엉뚱한 서가에 간 반응과 정답·해설을 보여 주고, 문제를 다시 볼 수 있다', async () => {
    const user = userEvent.setup()
    renderAt('/journey', { preview: true })
    await answer(user, '700 언어')

    expect(screen.getByRole('heading', { name: /정답이 아니에요/ })).toBeInTheDocument()
    expect(screen.getByText('어? 700 언어 서가에 와 보니 한국어 문법, 영어 회화 책뿐인데…?')).toBeInTheDocument()
    expect(screen.getByText('000 총류', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText(/백과사전은 과학, 역사, 예술 등 여러 분야/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '문제 다시 보기' }))
    expect(screen.getByText('하준이에게 어느 서가를 안내할까요?')).toBeInTheDocument()
    expect(screen.getByText('(내가 고른 답)')).toBeInTheDocument()
  })

  it('맞히면 서가에 책이 꽂히고, 연속으로 맞히면 연속 정답을 보여 준다', async () => {
    const user = userEvent.setup()
    renderAt('/journey', { preview: true })
    await answer(user, '000 총류')
    await user.click(screen.getByRole('button', { name: '다음 문제' }))
    expect(screen.getByText('서가 복구 1 / 20')).toBeInTheDocument()
    await answer(user, '000 총류')
    expect(screen.getByText('2연속 정답!')).toBeInTheDocument()
  })

  it('키보드만으로 답을 고르고 제출할 수 있다', async () => {
    const user = userEvent.setup()
    renderAt('/journey', { preview: true })
    screen.getAllByRole('radio')[0].focus()
    await user.keyboard(' ')
    expect(screen.getAllByRole('radio')[0]).toBeChecked()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: '다음 문제' })).toBeInTheDocument()
  })
})

describe('결과 화면 (오답 복습 2문제로 확인)', () => {
  function seedWrong() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...createEmptyProgress(), wrongQuestionIds: ['quiz-600-002', 'quiz-600-003'] }),
    )
  }

  async function playOneWrong(user: User) {
    await user.click(screen.getByRole('button', { name: '복습 시작 (2문제)' }))
    await answer(user, '500 기술과학')
    await user.click(screen.getByRole('button', { name: '다음 문제' }))
    await answer(user, '마법 학교의 비밀 (판타지 소설)')
    await user.click(screen.getByRole('button', { name: '결과 보기' }))
  }

  it('정답 수·정답률·점수·별을 정확히 보여 주고, 탐험 지도로 돌아갈 수 있다', async () => {
    const user = userEvent.setup()
    seedWrong()
    renderAt('/review', { preview: true })
    await playOneWrong(user)

    expect(screen.getByRole('heading', { name: /미션 완료!/ })).toBeInTheDocument()
    const stats = screen.getByText('전체 문항').closest('dl')!
    expect(stats).toHaveTextContent('전체 문항2문항')
    expect(stats).toHaveTextContent('맞힌 문항1문항')
    expect(stats).toHaveTextContent('정답률50%')
    expect(stats).toHaveTextContent('점수10점')
    expect(stats).toHaveTextContent('획득한 별⭐ 1개')

    await user.click(screen.getByRole('link', { name: '탐험 지도로 돌아가기' }))
    expect(screen.getByRole('heading', { level: 1, name: '탐험 지도' })).toBeInTheDocument()
  })

  it('헤매는 책(틀린 문제)만 다시 풀 수 있고, 다시 도전하면 처음부터 시작한다', async () => {
    const user = userEvent.setup()
    seedWrong()
    renderAt('/review', { preview: true })
    await playOneWrong(user)

    await user.click(screen.getByRole('button', { name: '헤매는 책 다시 찾아 주기 (1)' }))
    expect(screen.getByText('헤매는 책 다시 찾기')).toBeInTheDocument()
    expect(screen.getByText('문제 1 / 1')).toBeInTheDocument()
    expect(screen.getByText(/다음 주가 축구 결승전이에요/)).toBeInTheDocument()
    await answer(user, '600 예술')
    await user.click(screen.getByRole('button', { name: '결과 보기' }))
    expect(screen.getByText('정답률').closest('div')).toHaveTextContent('100%')

    await user.click(screen.getByRole('button', { name: '다시 도전' }))
    expect(screen.getByText('문제 1 / 2')).toBeInTheDocument()
    expect(screen.queryByText('헤매는 책 다시 찾기')).not.toBeInTheDocument()
  })
})
