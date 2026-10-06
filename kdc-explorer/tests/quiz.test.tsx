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

// kdc-600 구역 문제: ① 도윤이의 축구 책 → 600 예술  ② 잘못 꽂힌 책 → 판타지 소설
const Q2_ANSWER = '마법 학교의 비밀 (판타지 소설)'

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

describe('미리보기 모드: 한 구역 문제 풀기', () => {
  it('미리보기 안내와 구역 문제 풀기 버튼(문항 수)을 보여 준다', async () => {
    renderAt('/classification/kdc-600', { preview: true })
    expect(screen.getByText('미리보기 모드')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: '이 구역 문제 풀기 (2문제)' }))
    expect(screen.getByText('문제 1 / 2')).toBeInTheDocument()
    expect(screen.getByText('점수 0점')).toBeInTheDocument()
    expect(screen.getByText('서가 복구 0 / 2')).toBeInTheDocument()
    expect(screen.getByText('📦 제자리 찾아 주기')).toBeInTheDocument()
    expect(screen.getByText('검토 전 문항 (미리보기)')).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(4)
  })

  it('답을 고르지 않고 제출하면 안내한다', async () => {
    renderAt('/mission/kdc-600', { preview: true })
    await userEvent.click(screen.getByRole('button', { name: '제출하기' }))
    expect(screen.getByRole('alert')).toHaveTextContent('답을 하나 골라 주세요.')
    expect(screen.getByText('문제 1 / 2')).toBeInTheDocument()
  })

  it('힌트를 볼 수 있고 힌트를 봐도 진행할 수 있다', async () => {
    const user = userEvent.setup()
    renderAt('/mission/kdc-600', { preview: true })
    await user.click(screen.getByRole('button', { name: '힌트 보기' }))
    expect(screen.getByText(/운동도 '즐기는 활동'이에요/)).toBeInTheDocument()
    await answer(user, '600 예술')
    expect(screen.getByRole('heading', { name: /정답이에요!/ })).toBeInTheDocument()
  })

  it('손님의 부탁과 가상 예시 책 카드를 보여 주고, 맞히면 손님이 고마워한다', async () => {
    const user = userEvent.setup()
    renderAt('/mission/kdc-600', { preview: true })
    expect(screen.getByText(/다음 주가 축구 결승전이에요/)).toBeInTheDocument()
    expect(screen.getByText('『하루 10분 축구 드리블 특훈』')).toBeInTheDocument()
    expect(screen.getByText('가상 예시')).toBeInTheDocument()

    await answer(user, '600 예술')
    expect(screen.getByText('결승전 이기면 다 네 덕분이야! 꼭 응원 와!')).toBeInTheDocument()
  })

  it('틀리면 손님이 엉뚱한 서가에 간 반응과 정답·해설을 보여 준다', async () => {
    const user = userEvent.setup()
    renderAt('/mission/kdc-600', { preview: true })
    await answer(user, '500 기술과학')

    expect(screen.getByRole('heading', { name: /정답이 아니에요/ })).toBeInTheDocument()
    expect(screen.getByText('어? 500 기술과학 서가에 와 보니 의학과 건강, 농업 책뿐인데…?')).toBeInTheDocument()
    expect(screen.getByText('600 예술', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText(/스포츠와 오락은 600 예술에 속해요/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '문제 다시 보기' }))
    expect(screen.getByText('도윤이에게 어느 서가를 안내할까요?')).toBeInTheDocument()
    expect(screen.getByText('(내가 고른 답)')).toBeInTheDocument()
  })

  it('서가 복구 진행판과 연속 정답을 보여 주고, 결과(정답 수·정답률·점수·별)를 정확히 계산한다', async () => {
    const user = userEvent.setup()
    renderAt('/mission/kdc-600', { preview: true })

    await answer(user, '600 예술')
    await user.click(screen.getByRole('button', { name: '다음 문제' }))
    expect(screen.getByText('서가 복구 1 / 2')).toBeInTheDocument()
    expect(screen.getByText('📚 보기의 책 제목은 모두 가상 예시예요.')).toBeInTheDocument()

    await answer(user, Q2_ANSWER)
    expect(screen.getByText('2연속 정답!')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '결과 보기' }))

    expect(screen.getByRole('heading', { name: /미션 완료!/ })).toBeInTheDocument()
    const stats = screen.getByText('전체 문항').closest('dl')!
    expect(stats).toHaveTextContent('전체 문항2문항')
    expect(stats).toHaveTextContent('맞힌 문항2문항')
    expect(stats).toHaveTextContent('정답률100%')
    expect(stats).toHaveTextContent('점수20점')
    expect(stats).toHaveTextContent('획득한 별⭐ 2개')
  })

  it('헤매는 책(틀린 문제)만 다시 풀 수 있고, 다시 도전하면 처음부터 시작한다', async () => {
    const user = userEvent.setup()
    renderAt('/mission/kdc-600', { preview: true })
    await answer(user, '500 기술과학')
    await user.click(screen.getByRole('button', { name: '다음 문제' }))
    await answer(user, Q2_ANSWER)
    await user.click(screen.getByRole('button', { name: '결과 보기' }))
    expect(screen.getByText('전체 문항').closest('dl')).toHaveTextContent('정답률50%')

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
