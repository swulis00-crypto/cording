import { Route, Routes } from 'react-router'
import { Layout } from '../components/Layout.tsx'
import { ClassificationScreen } from '../screens/ClassificationScreen.tsx'
import { CodexScreen } from '../screens/CodexScreen.tsx'
import { HomeScreen } from '../screens/HomeScreen.tsx'
import { MapScreen } from '../screens/MapScreen.tsx'
import { NotFoundScreen } from '../screens/NotFoundScreen.tsx'
import { TutorialScreen } from '../screens/TutorialScreen.tsx'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomeScreen />} />
        <Route path="tutorial" element={<TutorialScreen />} />
        <Route path="map" element={<MapScreen />} />
        <Route path="classification/:id" element={<ClassificationScreen />} />
        <Route path="codex" element={<CodexScreen />} />
        <Route path="*" element={<NotFoundScreen />} />
      </Route>
    </Routes>
  )
}
