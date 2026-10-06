import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../src/app/AppRoutes'
import { getRuleQuizzes } from '../src/data'
import { createEmptyProgress } from '../src/features/progress/progress'
import { STORAGE_KEY } from '../src/services/storage'
import type { Progress, Quiz } from '../src/types'

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

const route = getRuleQuizzes(true)

type User = ReturnType<typeof userEvent.setup>

/** 문제 유형에 맞게 정답을 입력하고 제출한다. */
async function solve(user: User, quiz: Quiz) {
  if (quiz.type === 'build-number' && quiz.template) {
    const chars = [...quiz.correctAnswer]
    for (const [i, t] of [...quiz.template].entries()) {
      if (t === '□') await user.click(screen.getByRole('button', { name: `숫자 ${chars[i]}` }))
    }
  } else {
    await user.click(screen.getByRole('radio', { name: quiz.correctAnswer }))
  }
  await user.click(screen.getByRole('button', { name: '제출하기' }))
}

describe('게임 2단계: 번호 속 비밀 풀기', () => {
  it('기본 플레이에서는 검토 전 문항이 없어 아직 열리지 않았다고 안내한다', () => {
    renderAt('/level/2')
    expect(screen.getByRole('heading', { name: '아직 열리지 않은 단계예요' })).toBeInTheDocument()
  })

  it('첫 규칙 카드를 보여 주고, 규칙의 문제를 마치면 저장한 뒤 다음 규칙으로 바로 넘어간다', async () => {
    const user = userEvent.setup()
    renderAt('/level/2', { preview: true })
    expect(route).toHaveLength(16)
    expect(screen.getByText('문제 1 / 16')).toBeInTheDocument()
    expect(screen.getByText('둘째 자리는 더 좁은 주제')).toBeInTheDocument()
    expect(screen.getByText(/규칙 1 \/ 4/)).toBeInTheDocument()
    expect(screen.getByText('새 규칙 발견!')).toBeInTheDocument()
    expect(screen.getByText('440 천문학')).toBeInTheDocument()

    for (const quiz of route.slice(0, 4)) {
      await solve(user, quiz)
      await user.click(screen.getByRole('button', { name: '다음 문제' }))
    }
    expect(saved().completedRules).toEqual(['rule-1'])
    expect(screen.getByText('문제 5 / 16')).toBeInTheDocument()
    expect(screen.getByText('언어와 문학은 나라 순서가 같아요')).toBeInTheDocument()
    expect(screen.getByText('새 규칙 발견!')).toBeInTheDocument()
  })

  it('번호 조립: 숫자 카드로 빈칸을 채우고, 지우기로 고칠 수 있다', async () => {
    const user = userEvent.setup()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...createEmptyProgress(), completedRules: ['rule-1'] }))
    renderAt('/level/2', { preview: true })

    // 규칙 2의 첫 문제: 일본어 회화 책 → 7□0 (정답 730)
    expect(screen.getByText('🔐 번호 조립')).toBeInTheDocument()
    expect(screen.getByText('만든 번호: 7 빈칸 0')).toBeInTheDocument()

    // 빈칸을 채우지 않고 제출하면 안내한다
    await user.click(screen.getByRole('button', { name: '제출하기' }))
    expect(screen.getByRole('alert')).toHaveTextContent('숫자 카드로 빈칸을 모두 채워 주세요.')

    await user.click(screen.getByRole('button', { name: '숫자 4' }))
    expect(screen.getByText('만든 번호: 7 4 0')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '숫자 3' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '⌫ 지우기' }))
    expect(screen.getByText('만든 번호: 7 빈칸 0')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '숫자 3' }))
    await user.click(screen.getByRole('button', { name: '제출하기' }))

    expect(screen.getByRole('heading', { name: /정답이에요!/ })).toBeInTheDocument()
    expect(screen.getByText('730')).toBeInTheDocument()
  })

  it('번호 조립에서 틀리면 정답 번호와 해설을 보여 준다', async () => {
    const user = userEvent.setup()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...createEmptyProgress(), completedRules: ['rule-1'] }))
    renderAt('/level/2', { preview: true })
    await user.click(screen.getByRole('button', { name: '숫자 1' }))
    await user.click(screen.getByRole('button', { name: '제출하기' }))
    expect(screen.getByRole('heading', { name: /정답이 아니에요/ })).toBeInTheDocument()
    expect(screen.getByText('730', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByText(/둘째 자리 3은 일본이에요/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '문제 다시 보기' }))
    expect(screen.getByText('7□0')).toBeInTheDocument()
  })

  it('다시 들어오면 마치지 않은 규칙부터 이어 간다', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...createEmptyProgress(), completedRules: ['rule-1', 'rule-2'] }))
    renderAt('/level/2', { preview: true })
    expect(screen.getByRole('status')).toHaveTextContent("지난번에 이어서 '문학의 셋째 자리는 글의 형식' 규칙부터 시작해요.")
    expect(screen.getByText('문제 1 / 8')).toBeInTheDocument()
    expect(screen.getByText(/규칙 3 \/ 4/)).toBeInTheDocument()
  })

  it('16문제를 끝까지 풀면 4개 규칙이 모두 완료되고, 틀린 문제는 오답 복습에 모인다', async () => {
    const user = userEvent.setup()
    renderAt('/level/2', { preview: true })
    for (const [i, quiz] of route.entries()) {
      if (i === 1) {
        // 은호의 별자리 책: 일부러 틀린다
        await user.click(screen.getByRole('radio', { name: '410 수학' }))
        await user.click(screen.getByRole('button', { name: '제출하기' }))
      } else {
        await solve(user, quiz)
      }
      await user.click(screen.getByRole('button', { name: i === route.length - 1 ? '결과 보기' : '다음 문제' }))
    }
    expect(screen.getByRole('heading', { name: /미션 완료!/ })).toBeInTheDocument()
    expect(saved().completedRules).toEqual(['rule-1', 'rule-2', 'rule-3', 'rule-4'])
    expect(saved().wrongQuestionIds).toEqual(['l2-rule1-002'])
  }, 30000)
})
