import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../src/app/AppRoutes'

function renderAt(path: string, { preview = false } = {}) {
  window.history.replaceState(null, '', preview ? '/?preview=1' : '/')
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

// kdc-600 미션: 예술 → 스포츠(600 예술) → 희곡/공연(800 문학 / 600 예술)
async function answer(user: ReturnType<typeof userEvent.setup>, option: string) {
  await user.click(screen.getByRole('radio', { name: option }))
  await user.click(screen.getByRole('button', { name: '제출하기' }))
}

describe('기본 플레이 (검토 전 문항 숨김)', () => {
  it('approved 문항이 없으면 미션 시작이 비활성화되고 안내가 나온다', () => {
    renderAt('/classification/kdc-600')
    expect(screen.getByRole('button', { name: '미션 시작' })).toBeDisabled()
    expect(screen.getByText(/선생님 검토가 끝나면 미션이 열려요/)).toBeInTheDocument()
  })

  it('주소로 직접 들어와도 검토 전 문항은 출제하지 않는다', () => {
    renderAt('/mission/kdc-600')
    expect(screen.getByRole('heading', { name: '아직 열리지 않은 미션이에요' })).toBeInTheDocument()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })
})

describe('미리보기 모드 미션', () => {
  it('미리보기 안내와 미션 시작 버튼(문항 수)을 보여 준다', async () => {
    renderAt('/classification/kdc-600', { preview: true })
    expect(screen.getByText('미리보기 모드')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: '미션 시작 (3문제)' }))
    expect(screen.getByText('문제 1 / 3')).toBeInTheDocument()
    expect(screen.getByText('점수 0점')).toBeInTheDocument()
    expect(screen.getByText('검토 전 문항 (미리보기)')).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(4)
  })

  it('답을 고르지 않고 제출하면 안내한다', async () => {
    renderAt('/mission/kdc-600', { preview: true })
    await userEvent.click(screen.getByRole('button', { name: '제출하기' }))
    expect(screen.getByRole('alert')).toHaveTextContent('답을 하나 골라 주세요.')
    expect(screen.getByText('문제 1 / 3')).toBeInTheDocument()
  })

  it('힌트를 볼 수 있고 힌트를 봐도 진행할 수 있다', async () => {
    const user = userEvent.setup()
    renderAt('/mission/kdc-600', { preview: true })
    await user.click(screen.getByRole('button', { name: '힌트 보기' }))
    expect(screen.getByText(/그림과 음악을 떠올려 보세요/)).toBeInTheDocument()
    await answer(user, '예술')
    expect(screen.getByRole('heading', { name: /정답이에요!/ })).toBeInTheDocument()
  })

  it('세 문제를 풀고 결과(정답 수·정답률·점수·별)를 정확히 보여 준다', async () => {
    const user = userEvent.setup()
    renderAt('/mission/kdc-600', { preview: true })

    await answer(user, '예술')
    expect(screen.getByRole('heading', { name: /정답이에요!/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '다음 문제' }))
    expect(screen.getByText('점수 10점')).toBeInTheDocument()

    // 오답: 정답과 해설, 내가 고른 답을 보여 준다
    await answer(user, '500 기술과학')
    expect(screen.getByRole('heading', { name: /정답이 아니에요/ })).toBeInTheDocument()
    expect(screen.getByText('600 예술', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText(/스포츠와 오락은 600 예술에 속해요/)).toBeInTheDocument()

    // 문제 다시 보기
    await user.click(screen.getByRole('button', { name: '문제 다시 보기' }))
    expect(screen.getByText('축구 규칙과 경기 기술을 알려 주는 책은 어느 영역에 속할까요?')).toBeInTheDocument()
    expect(screen.getByText('(내가 고른 답)')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '다음 문제' }))

    await answer(user, '800 문학 / 600 예술')
    await user.click(screen.getByRole('button', { name: '결과 보기' }))

    expect(screen.getByRole('heading', { name: /미션 완료!/ })).toBeInTheDocument()
    const stats = screen.getByText('전체 문항').closest('dl')!
    expect(stats).toHaveTextContent('전체 문항3문항')
    expect(stats).toHaveTextContent('맞힌 문항2문항')
    expect(stats).toHaveTextContent('정답률67%')
    expect(stats).toHaveTextContent('점수20점')
    expect(stats).toHaveTextContent('획득한 별⭐ 2개')
  })

  it('틀린 문제만 다시 풀 수 있고, 다시 도전하면 처음부터 시작한다', async () => {
    const user = userEvent.setup()
    renderAt('/mission/kdc-600', { preview: true })
    await answer(user, '문학')
    await user.click(screen.getByRole('button', { name: '다음 문제' }))
    await answer(user, '600 예술')
    await user.click(screen.getByRole('button', { name: '다음 문제' }))
    await answer(user, '800 문학 / 600 예술')
    await user.click(screen.getByRole('button', { name: '결과 보기' }))

    await user.click(screen.getByRole('button', { name: '틀린 문제 다시 풀기 (1)' }))
    expect(screen.getByText('틀린 문제 다시 풀기')).toBeInTheDocument()
    expect(screen.getByText('문제 1 / 1')).toBeInTheDocument()
    expect(screen.getByText('KDC에서 600은 어떤 영역인가요?')).toBeInTheDocument()
    await answer(user, '예술')
    await user.click(screen.getByRole('button', { name: '결과 보기' }))
    expect(screen.getByText('정답률').closest('div')).toHaveTextContent('100%')

    await user.click(screen.getByRole('button', { name: '다시 도전' }))
    expect(screen.getByText('문제 1 / 3')).toBeInTheDocument()
    expect(screen.queryByText('틀린 문제 다시 풀기')).not.toBeInTheDocument()
  })

  it('키보드만으로 답을 고르고 제출할 수 있다', async () => {
    const user = userEvent.setup()
    renderAt('/mission/kdc-600', { preview: true })
    screen.getAllByRole('radio')[0].focus()
    await user.keyboard(' ')
    expect(screen.getAllByRole('radio')[0]).toBeChecked()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: '다음 문제' })).toBeInTheDocument()
  })
})
