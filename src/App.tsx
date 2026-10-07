import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { BuildPage } from './pages/BuildPage'
import { OverviewPage } from './pages/OverviewPage'
import { AdjustPage } from './pages/AdjustPage'
import { CoursePage } from './pages/CoursePage'
import { StudyPage } from './pages/StudyPage'
import { NotFoundPage } from './pages/NotFoundPage'

export function App() {
  return <Routes>
    <Route element={<AppShell />}>
      <Route index element={<Navigate replace to="/build" />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="build" element={<BuildPage />} />
      <Route path="overview" element={<OverviewPage />} />
      <Route path="adjust" element={<AdjustPage />} />
      <Route path="courses/:courseId" element={<CoursePage />} />
      <Route path="study" element={<StudyPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
}
