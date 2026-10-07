import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../src/app/AppRoutes'
import { DataErrorBanner } from '../src/components/DataErrorBanner'

function renderAt(path: string, { preview = false } = {}) {
  window.history.replaceState(null, '', preview ? '/?preview=1' : '/')
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('SCR-01 시작 화면', () => {
  it('저장 기록이 없으면 이어하기가 비활성화되고 안내가 나온다', () => {
    renderAt('/')
    expect(screen.getByRole('button', { name: '이어하기' })).toBeDisabled()
    expect(screen.getByText(/저장된 탐험 기록이 없어서/)).toBeInTheDocument()
  })

  it('새 탐험을 누르면 튜토리얼로 이동한다', async () => {
    renderAt('/')
    await userEvent.click(screen.getByRole('button', { name: '새 탐험' }))
    expect(screen.getByRole('heading', { name: 'KDC는 무엇일까요?' })).toBeInTheDocument()
  })
})

describe('SCR-02 튜토리얼', () => {
  it('다음 버튼으로 끝까지 넘기고 구역 탐험으로 간다', async () => {
    renderAt('/tutorial')
    const user = userEvent.setup()
    expect(screen.getByRole('button', { name: '이전' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '다음' }))
    expect(screen.getByRole('heading', { name: '번호가 주제를 알려 줘요' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.click(screen.getByRole('button', { name: '탐험 시작' }))
    // 기본 플레이에서는 검토 전 문항이 없어 아직 열리지 않았다고 안내한다
    expect(screen.getByRole('heading', { name: '아직 열리지 않은 탐험이에요' })).toBeInTheDocument()
  })

  it('건너뛰기로 바로 구역 탐험에 갈 수 있다', async () => {
    renderAt('/tutorial')
    await userEvent.click(screen.getByRole('link', { name: '건너뛰기' }))
    expect(screen.getByRole('heading', { name: '아직 열리지 않은 탐험이에요' })).toBeInTheDocument()
  })
})

describe('탐험 지도', () => {
  it('상단 메뉴의 탐험 지도는 탐험 단계를 고르는 화면이다', async () => {
    renderAt('/codex')
    await userEvent.click(screen.getByRole('link', { name: '탐험 지도' }))
    expect(screen.getByRole('heading', { level: 1, name: '탐험 지도' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /지식 구역 탐험/ })).toBeInTheDocument()
  })

  it('예전 주소(/levels)로 들어와도 탐험 지도로 간다', () => {
    renderAt('/levels')
    expect(screen.getByRole('heading', { level: 1, name: '탐험 지도' })).toBeInTheDocument()
  })
})

describe('SCR-04 주류 소개 (분류 도감 상세)', () => {
  it('번호·분류명·설명과 대표 주제로 10개 구분을 모두 보여 준다', () => {
    renderAt('/classification/kdc-600')
    expect(screen.getByRole('heading', { level: 1, name: '예술' })).toBeInTheDocument()
    expect(screen.getByText(/아름다움을 표현하고/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '대표 주제 · 10개 구분' })).toBeInTheDocument()
    const table = screen.getByRole('list', { name: '600 예술 구역의 10개 구분' })
    expect(within(table).getAllByRole('listitem')).toHaveLength(10)
    expect(table).toHaveTextContent('670음악')
    expect(screen.getByText(/주류 \(10개의 큰 영역 중 하나\)/)).toBeInTheDocument()
    expect(screen.getByText('선생님 검토 중인 내용')).toBeInTheDocument()
  })

  it('설명만 하고 문제는 탐험 지도에서 풀도록 안내한다', async () => {
    renderAt('/classification/kdc-600', { preview: true })
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: /탐험 지도에서 문제 풀기/ }))
    expect(screen.getByRole('heading', { level: 1, name: '탐험 지도' })).toBeInTheDocument()
  })

  it('헷갈리기 쉬운 영역으로 이동할 수 있다', async () => {
    renderAt('/classification/kdc-700')
    await userEvent.click(screen.getByRole('link', { name: '800 문학' }))
    expect(screen.getByRole('heading', { level: 1, name: '문학' })).toBeInTheDocument()
  })

  it('없는 영역이면 안내와 돌아가기 링크를 보여 준다', () => {
    renderAt('/classification/kdc-999')
    expect(screen.getByRole('heading', { name: '영역을 찾을 수 없어요' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '분류 도감으로 돌아가기' })).toBeInTheDocument()
  })
})

describe('SCR-08 분류 도감', () => {
  it('10개 주류를 번호순으로 보여 주고 상세 화면으로 이동한다', async () => {
    renderAt('/codex')
    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings).toHaveLength(10)
    expect(headings[0]).toHaveTextContent('000 총류')
    expect(headings[9]).toHaveTextContent('900 역사')
    expect(screen.getByText('학습 완료 0 / 10')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: '자세히 보기: 200 종교' }))
    expect(screen.getByRole('heading', { level: 1, name: '종교' })).toBeInTheDocument()
  })

  it('튜토리얼을 다시 볼 수 있다', async () => {
    renderAt('/codex')
    await userEvent.click(screen.getByRole('link', { name: '튜토리얼 다시 보기' }))
    expect(screen.getByRole('heading', { name: 'KDC는 무엇일까요?' })).toBeInTheDocument()
  })
})

describe('데이터 오류 안내', () => {
  it('오류가 있으면 건수와 내용을 보여 준다', () => {
    render(<DataErrorBanner errors={['분류 "kdc-000": id가 중복되었습니다.']} />)
    expect(screen.getByRole('alert')).toHaveTextContent('오류 1건')
    expect(screen.getByText(/id가 중복되었습니다/)).toBeInTheDocument()
  })

  it('오류가 없으면 아무것도 표시하지 않는다', () => {
    const { container } = render(<DataErrorBanner errors={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
