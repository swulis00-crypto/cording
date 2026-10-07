import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../src/app/AppRoutes'
import { getAuthorQuizzes } from '../src/data'
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

function seedSteps(done: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...createEmptyProgress(), completedRules: done }))
}

const route = getAuthorQuizzes(true)
type User = ReturnType<typeof userEvent.setup>

/** 문제 유형에 맞게 정답을 입력하고 제출한다. */
async function solve(user: User, quiz: Quiz) {
  if (quiz.template) {
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

describe('게임 3단계: 저자기호 만들기', () => {
  it('기본 플레이에서는 검토 전 문항이 없어 아직 열리지 않았다고 안내한다', () => {
    renderAt('/level/3')
    expect(screen.getByRole('heading', { name: '아직 열리지 않은 단계예요' })).toBeInTheDocument()
  })

  it('첫 단계에서 저자기호의 네 부분(성·자음·모음·제목 초성)을 보여 준다', () => {
    renderAt('/level/3', { preview: true })
    expect(screen.getByText('문제 1 / 14')).toBeInTheDocument()
    expect(screen.getByText('저자기호의 생김새')).toBeInTheDocument()
    expect(screen.getByText(/단계 1 \/ 4/)).toBeInTheDocument()
    const parts = screen.getByRole('list', { name: '저자기호의 네 부분' })
    expect(parts).toHaveTextContent('① 작가의 성')
    expect(parts).toHaveTextContent('④ 제목 초성')
  })

  it('기호표를 보며 숫자 카드로 저자기호를 만든다 (손원평 『아몬드』 → 손66ㅇ)', async () => {
    const user = userEvent.setup()
    seedSteps(['author-1'])
    renderAt('/level/3', { preview: true })
    expect(screen.getByRole('list', { name: '자음 기호표' })).toHaveTextContent('ㄴ19')
    expect(screen.getByRole('list', { name: '모음 기호표' })).toHaveTextContent('ㅗ ㅘ ㅙ ㅚ ㅛ5 / ㅊ 4')
    expect(screen.getByText('🛠 저자기호 만들기')).toBeInTheDocument()
    expect(screen.getByText('만든 저자기호: 손 빈칸 빈칸 ㅇ')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '숫자 6' }))
    await user.click(screen.getByRole('button', { name: '숫자 6' }))
    await user.click(screen.getByRole('button', { name: '제출하기' }))
    expect(screen.getByRole('heading', { name: /정답이에요!/ })).toBeInTheDocument()
  })

  it('제목 초성은 글자 카드로 채운다 (김호연 『불편한 편의점』 → 김95ㅂ)', async () => {
    const user = userEvent.setup()
    seedSteps(['author-1'])
    renderAt('/level/3', { preview: true })
    for (const quiz of route.filter((q) => q.rule === 'author-2').slice(0, 2)) {
      await solve(user, quiz)
      await user.click(screen.getByRole('button', { name: '다음 문제' }))
    }
    expect(screen.getByText('만든 저자기호: 김 9 5 빈칸')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '글자 ㅍ' }))
    await user.click(screen.getByRole('button', { name: '제출하기' }))
    expect(screen.getByRole('heading', { name: /정답이 아니에요/ })).toBeInTheDocument()
    expect(screen.getByText('김95ㅂ', { selector: 'strong' })).toBeInTheDocument()
  })

  it('14문제를 끝까지 풀면 4개 단계가 완료된다', { timeout: 30000 }, async () => {
    const user = userEvent.setup()
    seedSteps(['rule-1', 'rule-2', 'rule-3', 'rule-4'])
    renderAt('/level/3', { preview: true })
    for (const [i, quiz] of route.entries()) {
      await solve(user, quiz)
      await user.click(screen.getByRole('button', { name: i === route.length - 1 ? '결과 보기' : '다음 문제' }))
    }
    expect(screen.getByText(/저자기호를 만들고 읽는 방법을 모두 익혔어요/)).toBeInTheDocument()
    expect(saved().completedRules).toEqual([
      'rule-1',
      'rule-2',
      'rule-3',
      'rule-4',
      'author-1',
      'author-2',
      'author-3',
      'author-4',
    ])
  })
})
