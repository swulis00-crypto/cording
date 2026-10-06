import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../src/app/AppRoutes'
import { createEmptyProgress } from '../src/features/progress/progress'
import { STORAGE_KEY } from '../src/services/storage'
import type { Progress } from '../src/types'

function renderAt(path: string, { preview = false } = {}) {
  window.history.replaceState(null, '', preview ? '/?preview=1' : '/')
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

function seed(changes: Partial<Progress>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...createEmptyProgress(), ...changes }))
}

function saved(): Progress {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
}

type User = ReturnType<typeof userEvent.setup>

async function answer(user: User, option: string, next: string) {
  await user.click(screen.getByRole('radio', { name: option }))
  await user.click(screen.getByRole('button', { name: '제출하기' }))
  await user.click(screen.getByRole('button', { name: next }))
}

/** kdc-600 미션(2문제)을 첫 문제만 틀리고 끝낸다. */
async function playArtMission(user: User) {
  await answer(user, '500 기술과학', '다음 문제')
  await answer(user, '마법 학교의 비밀 (판타지 소설)', '결과 보기')
}

describe('진행 저장', () => {
  it('미션을 마치면 지도에 학습 완료와 별이 표시되고, 다시 열어도 유지된다', async () => {
    const user = userEvent.setup()
    const { unmount } = renderAt('/mission/kdc-600', { preview: true })
    await playArtMission(user)
    expect(screen.getByRole('heading', { name: /미션 완료!/ })).toBeInTheDocument()

    expect(saved().completedClassifications).toEqual(['kdc-600'])
    expect(saved().bestCorrect).toEqual({ 'kdc-600': 1 })
    expect(saved().quizAttempts).toHaveLength(1)
    expect(saved().wrongQuestionIds).toEqual(['quiz-600-002'])

    // 새로고침처럼 앱을 다시 띄운다
    unmount()
    renderAt('/map', { preview: true })
    const tile = screen.getByRole('link', { name: /600\s*예술/ })
    expect(within(tile).getByText('학습 완료')).toBeInTheDocument()
    expect(within(tile).getByText('1개')).toBeInTheDocument()
    expect(screen.getByText('미션 완료 1 / 10')).toBeInTheDocument()
    expect(screen.getByText(/모은 별 1개/)).toBeInTheDocument()
  })

  it('결과 화면에서 다시 도전해도 완료는 한 번만 집계된다', async () => {
    const user = userEvent.setup()
    renderAt('/mission/kdc-600', { preview: true })
    await playArtMission(user)
    await user.click(screen.getByRole('button', { name: '다시 도전' }))
    await playArtMission(user)
    expect(saved().completedClassifications).toEqual(['kdc-600'])
    expect(saved().quizAttempts).toHaveLength(2)
  })

  it('영역 소개를 열면 학습 중으로 기록된다', () => {
    renderAt('/classification/kdc-300')
    expect(screen.getByText('학습 중')).toBeInTheDocument()
    expect(saved().visitedClassifications).toEqual(['kdc-300'])
  })

  it('저장된 기록이 손상돼 있으면 멈추지 않고 안내한 뒤 새로 시작한다', async () => {
    localStorage.setItem(STORAGE_KEY, '{broken')
    renderAt('/')
    expect(screen.getByRole('alert')).toHaveTextContent('저장된 탐험 기록을 읽을 수 없어서 새로 시작해요.')
    expect(screen.getByRole('button', { name: '이어하기' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('시작 화면', () => {
  it('기록이 있으면 이어하기로 게임 단계 화면에 간다', async () => {
    seed({ visitedClassifications: ['kdc-000'] })
    renderAt('/')
    await userEvent.click(screen.getByRole('button', { name: '이어하기' }))
    expect(screen.getByRole('heading', { level: 1, name: '게임 단계' })).toBeInTheDocument()
  })

  it('기록이 있는데 새 탐험을 누르면 먼저 확인하고, 지우면 튜토리얼로 간다', async () => {
    const user = userEvent.setup()
    seed({ completedClassifications: ['kdc-000'], bestCorrect: { 'kdc-000': 3 } })
    renderAt('/')
    await user.click(screen.getByRole('button', { name: '새 탐험' }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('이 컴퓨터에 이전 탐험 기록이 있어요')

    await user.click(screen.getByRole('button', { name: '취소' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(saved().completedClassifications).toEqual(['kdc-000'])

    await user.click(screen.getByRole('button', { name: '새 탐험' }))
    await user.click(screen.getByRole('button', { name: '기록 지우고 새로 시작' }))
    expect(screen.getByRole('heading', { name: 'KDC는 무엇일까요?' })).toBeInTheDocument()
    expect(saved().completedClassifications).toEqual([])
  })
})

describe('SCR-09 오답 복습', () => {
  it('오답이 없으면 안내를 보여 준다', () => {
    renderAt('/review', { preview: true })
    expect(screen.getByText(/지금은 복습할 문항이 없어요/)).toBeInTheDocument()
  })

  it('저장된 오답을 다시 풀고, 맞히면 목록에서 빠진다', async () => {
    const user = userEvent.setup()
    seed({ wrongQuestionIds: ['quiz-600-002', 'quiz-900-002'] })
    renderAt('/review', { preview: true })
    expect(screen.getByText('『하루 10분 축구 드리블 특훈』')).toBeInTheDocument()
    expect(screen.getByText('『배낭 하나 메고 떠나는 유럽 여행』')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '복습 시작 (2문제)' }))
    expect(screen.getByText('문제 1 / 2')).toBeInTheDocument()
    await answer(user, '600 예술', '다음 문제')
    await answer(user, '400 자연과학', '결과 보기')

    expect(saved().wrongQuestionIds).toEqual(['quiz-900-002'])
    expect(saved().completedClassifications).toEqual([])

    await user.click(screen.getByRole('button', { name: '복습 목록으로' }))
    expect(screen.getByText('『배낭 하나 메고 떠나는 유럽 여행』')).toBeInTheDocument()
    expect(screen.queryByText('『하루 10분 축구 드리블 특훈』')).not.toBeInTheDocument()
  })

  it('기본 플레이에서는 검토 전 문항을 복습에도 내지 않는다', () => {
    seed({ wrongQuestionIds: ['quiz-600-002'] })
    renderAt('/review')
    expect(screen.getByText(/지금은 복습할 문항이 없어요/)).toBeInTheDocument()
  })
})

describe('SCR-10 설정', () => {
  it('효과음 설정이 저장된다', async () => {
    renderAt('/settings')
    await userEvent.click(screen.getByRole('checkbox', { name: '효과음 켜기' }))
    expect(saved().settings.soundEnabled).toBe(true)
  })

  it('기록 초기화 전에 지워지는 내용을 안내하고, 확인하면 기록만 지운다', async () => {
    const user = userEvent.setup()
    seed({ completedClassifications: ['kdc-000'], wrongQuestionIds: ['quiz-000-002'], settings: { soundEnabled: true } })
    renderAt('/settings')

    await user.click(screen.getByRole('button', { name: '기록 지우기' }))
    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toHaveTextContent('탐험한 영역과 완료한 미션')
    expect(dialog).toHaveTextContent('오답 복습 목록')
    expect(dialog).toHaveTextContent('효과음 설정은 그대로 남아요')

    await user.click(within(dialog).getByRole('button', { name: '기록 지우기' }))
    expect(screen.getByRole('status')).toHaveTextContent('기록을 지웠어요.')
    expect(saved().completedClassifications).toEqual([])
    expect(saved().wrongQuestionIds).toEqual([])
    expect(saved().settings.soundEnabled).toBe(true)
  })

  it('Esc로 확인 창을 닫을 수 있다', async () => {
    const user = userEvent.setup()
    seed({ visitedClassifications: ['kdc-000'] })
    renderAt('/settings')
    await user.click(screen.getByRole('button', { name: '기록 지우기' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(saved().visitedClassifications).toEqual(['kdc-000'])
  })
})

describe('게임 단계', () => {
  it('1단계만 열려 있고 2~4단계는 잠겨 있다', () => {
    renderAt('/levels')
    expect(screen.getByRole('link', { name: '시작하기: 지식 구역 탐험' })).toBeInTheDocument()
    expect(screen.getByText('진행 중 · 미션 0 / 10')).toBeInTheDocument()
    expect(screen.getByText('🔒 1단계를 마치면 열려요')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /저자기호 만들기/ })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /시작하기/ })).toHaveLength(1)
  })

  it('1단계를 모두 마치면 완료로 표시되고 2단계가 열린다 (지금은 준비 중)', () => {
    const all = ['000', '100', '200', '300', '400', '500', '600', '700', '800', '900'].map((c) => `kdc-${c}`)
    seed({ completedClassifications: all })
    renderAt('/levels')
    expect(screen.getByText('✔ 완료')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '다시 하기: 지식 구역 탐험' })).toBeInTheDocument()
    expect(screen.getByText('🛠 준비 중이에요')).toBeInTheDocument()
  })
})
