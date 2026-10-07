import { Navigate, Route, Routes } from 'react-router'
import { Layout } from '../components/Layout.tsx'
import { AuthorScreen } from '../screens/AuthorScreen.tsx'
import { ClassificationScreen } from '../screens/ClassificationScreen.tsx'
import { CodexScreen } from '../screens/CodexScreen.tsx'
import { HomeScreen } from '../screens/HomeScreen.tsx'
import { JourneyScreen } from '../screens/JourneyScreen.tsx'
import { LevelsScreen } from '../screens/LevelsScreen.tsx'
import { NotFoundScreen } from '../screens/NotFoundScreen.tsx'
import { ReviewScreen } from '../screens/ReviewScreen.tsx'
import { RulesScreen } from '../screens/RulesScreen.tsx'
import { SettingsScreen } from '../screens/SettingsScreen.tsx'
import { TutorialScreen } from '../screens/TutorialScreen.tsx'
import { ProgressProvider } from './ProgressContext.tsx'

export function AppRoutes() {
  return (
    <ProgressProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomeScreen />} />
          <Route path="tutorial" element={<TutorialScreen />} />
          {/* 탐험 지도 = 탐험 단계 고르기 */}
          <Route path="map" element={<LevelsScreen />} />
          <Route path="levels" element={<Navigate to="/map" replace />} />
          <Route path="journey" element={<JourneyScreen />} />
          <Route path="level/2" element={<RulesScreen />} />
          <Route path="level/3" element={<AuthorScreen />} />
          <Route path="classification/:id" element={<ClassificationScreen />} />
          <Route path="codex" element={<CodexScreen />} />
          <Route path="review" element={<ReviewScreen />} />
          <Route path="settings" element={<SettingsScreen />} />
          <Route path="*" element={<NotFoundScreen />} />
        </Route>
      </Routes>
    </ProgressProvider>
  )
}
