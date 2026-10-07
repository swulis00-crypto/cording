import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../src/app/AppRoutes'
import { getMissionQuizzes, mainClasses } from '../src/data'
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

function saved(): Progress {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
}

/** 000 → 900 순서의 20문제 */
const route = mainClasses.flatMap((c) => getMissionQuizzes(c.id, true))

type User = ReturnType<typeof userEvent.setup>

async function solve(user: User, option: string) {
  await user.click(screen.getByRole('radio', { name: option }))
  await user.click(screen.getByRole('button', { name: '제출하기' }))
}

describe('게임 1단계: 20문제 구역 탐험', () => {
  it('기본 플레이에서는 검토 전 문항이 없어 아직 열리지 않았다고 안내한다', () => {
    renderAt('/journey')
    expect(screen.getByRole('heading', { name: '아직 열리지 않은 탐험이에요' })).toBeInTheDocument()
  })

  it('000 구역부터 시작하고, 구역을 마치면 지도로 돌아가지 않고 다음 구역 문제로 바로 넘어간다', async () => {
    const user = userEvent.setup()
    renderAt('/journey', { preview: true })
    expect(route).toHaveLength(20)
    expect(screen.getByText('문제 1 / 20')).toBeInTheDocument()
    expect(screen.getByText(/000 총류 구역/)).toBeInTheDocument()
    expect(screen.getByText(/구역 1 \/ 10/)).toBeInTheDocument()
    expect(screen.getByText('새 구역 도착!')).toBeInTheDocument()

    await solve(user, route[0].correctAnswer)
    await user.click(screen.getByRole('button', { name: '다음 문제' }))
    expect(screen.queryByText('새 구역 도착!')).not.toBeInTheDocument()
    await solve(user, route[1].correctAnswer)

    // 구역의 2문제를 마치면 바로 저장된다
    expect(saved().completedClassifications).toEqual(['kdc-000'])
    expect(saved().bestCorrect).toEqual({ 'kdc-000': 2 })

    await user.click(screen.getByRole('button', { name: '다음 문제' }))
    expect(screen.getByText('문제 3 / 20')).toBeInTheDocument()
    expect(screen.getByText(/100 철학 구역/)).toBeInTheDocument()
    expect(screen.getByText('새 구역 도착!')).toBeInTheDocument()
  })

  it('다시 들어오면 아직 마치지 않은 첫 구역부터 이어 간다', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...createEmptyProgress(), completedClassifications: ['kdc-000', 'kdc-100', 'kdc-200'] }),
    )
    renderAt('/journey', { preview: true })
    expect(screen.getByRole('status')).toHaveTextContent('지난번에 이어서 300 사회과학 구역부터 출발해요.')
    expect(screen.getByText('문제 1 / 14')).toBeInTheDocument()
    expect(screen.getByText(/구역 4 \/ 10/)).toBeInTheDocument()
  })

  it('20문제를 끝까지 풀면 결과를 보여 주고 게임 1단계가 완료된다', async () => {
    const user = userEvent.setup()
    renderAt('/journey', { preview: true })
    for (const [i, quiz] of route.entries()) {
      await solve(user, quiz.correctAnswer)
      await user.click(screen.getByRole('button', { name: i === route.length - 1 ? '결과 보기' : '다음 문제' }))
    }

    expect(screen.getByRole('heading', { name: /미션 완료!/ })).toBeInTheDocument()
    expect(screen.getByText(/10개 구역의 서가가 모두 깨끗하게 복구됐어요/)).toBeInTheDocument()
    expect(screen.getByText('전체 문항').closest('dl')).toHaveTextContent('점수200점')
    expect(saved().completedClassifications).toHaveLength(10)
    expect(saved().quizAttempts).toHaveLength(10)

    await user.click(screen.getByRole('link', { name: '탐험 지도로 돌아가기' }))
    expect(screen.getByRole('heading', { level: 1, name: '탐험 지도' })).toBeInTheDocument()
    expect(screen.getByText('✔ 완료')).toBeInTheDocument()
  }, 30000)
})
