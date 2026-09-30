import { HashRouter } from 'react-router'
import { AppRoutes } from './app/AppRoutes.tsx'

// HashRouter: 정적 호스팅이나 파일로 열어도 새로고침·뒤로 가기가 동작한다.
function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  )
}

export default App
