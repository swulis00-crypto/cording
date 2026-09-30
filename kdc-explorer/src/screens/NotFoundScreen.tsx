import { Link } from 'react-router'

export function NotFoundScreen() {
  return (
    <section>
      <h1>길을 잃었어요</h1>
      <p style={{ marginTop: 12 }}>
        <Link to="/">시작 화면으로 돌아가기</Link>
      </p>
    </section>
  )
}
