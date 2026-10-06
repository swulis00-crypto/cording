import { Route, Routes } from 'react-router'
import { Layout } from '../components/Layout.tsx'
import { ClassificationScreen } from '../screens/ClassificationScreen.tsx'
import { CodexScreen } from '../screens/CodexScreen.tsx'
import { HomeScreen } from '../screens/HomeScreen.tsx'
import { JourneyScreen } from '../screens/JourneyScreen.tsx'
import { LevelsScreen } from '../screens/LevelsScreen.tsx'
import { MapScreen } from '../screens/MapScreen.tsx'
import { NotFoundScreen } from '../screens/NotFoundScreen.tsx'
import { QuizScreen } from '../screens/quiz/QuizScreen.tsx'
import { ReviewScreen } from '../screens/ReviewScreen.tsx'
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
          <Route path="levels" element={<LevelsScreen />} />
          <Route path="journey" element={<JourneyScreen />} />
          <Route path="map" element={<MapScreen />} />
          <Route path="classification/:id" element={<ClassificationScreen />} />
          <Route path="mission/:id" element={<QuizScreen />} />
          <Route path="codex" element={<CodexScreen />} />
          <Route path="review" element={<ReviewScreen />} />
          <Route path="settings" element={<SettingsScreen />} />
          <Route path="*" element={<NotFoundScreen />} />
        </Route>
      </Routes>
    </ProgressProvider>
  )
}
