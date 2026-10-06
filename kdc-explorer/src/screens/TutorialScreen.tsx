import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import styles from './TutorialScreen.module.css'

interface Step {
  title: string
  body: ReactNode
}

const STEPS: Step[] = [
  {
    title: 'KDC는 무엇일까요?',
    body: (
      <>
        <p>
          <strong>KDC(한국십진분류법)</strong>는 도서관의 책을 주제에 따라 나누는 약속이에요.
        </p>
        <p>같은 주제의 책이 한곳에 모여 있어서, 원하는 책을 쉽게 찾을 수 있어요.</p>
      </>
    ),
  },
  {
    title: '번호가 주제를 알려 줘요',
    body: (
      <>
        <p>KDC는 지식을 10개의 큰 영역(주류)으로 나누고 000부터 900까지 번호를 붙였어요.</p>
        <ul className={styles.examples}>
          <li>
            별과 행성의 원리를 설명하는 책 → <strong>400 자연과학</strong>
          </li>
          <li>
            작가가 지은 시와 소설 → <strong>800 문학</strong>
          </li>
          <li>
            나라와 사람들이 지나온 과거 이야기 → <strong>900 역사</strong>
          </li>
        </ul>
      </>
    ),
  },
  {
    title: '이렇게 탐험해요',
    body: (
      <>
        <ol className={styles.howTo}>
          <li>000 총류부터 900 역사까지 10개 구역을 차례로 돌아요.</li>
          <li>구역마다 손님 2명이 찾는 책을 제자리 서가로 안내해요.</li>
          <li>책을 제자리에 꽂아 서가를 복구해요.</li>
        </ol>
        <p>틀려도 괜찮아요. 해설을 읽고 다시 도전하면 돼요!</p>
      </>
    ),
  },
]

/** SCR-02 튜토리얼 */
export function TutorialScreen() {
  const [index, setIndex] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const shownIndex = useRef(index)
  const navigate = useNavigate()
  const step = STEPS[index]
  const isLast = index === STEPS.length - 1

  // 단계를 넘기면 제목으로 초점을 옮겨 화면 읽기 프로그램이 새 내용을 읽게 한다.
  // (처음 열 때는 옮기지 않는다)
  useEffect(() => {
    if (shownIndex.current === index) return
    shownIndex.current = index
    headingRef.current?.focus()
  }, [index])

  return (
    <section className={styles.card} aria-labelledby="tutorial-title">
      <div className={styles.top}>
        <p className={styles.counter}>
          안내 {index + 1} / {STEPS.length}
        </p>
        <Link to="/journey" className={styles.skip}>
          건너뛰기
        </Link>
      </div>

      <h1 id="tutorial-title" ref={headingRef} tabIndex={-1} className={styles.title}>
        {step.title}
      </h1>
      <div className={styles.body}>{step.body}</div>

      <div className={styles.actions}>
        <button type="button" className="btn" onClick={() => setIndex(index - 1)} disabled={index === 0}>
          이전
        </button>
        {isLast ? (
          <button type="button" className="btn btn-primary" onClick={() => navigate('/journey')}>
            탐험 시작
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => setIndex(index + 1)}>
            다음
          </button>
        )}
      </div>
    </section>
  )
}
