import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CompletedResourceEditProvider } from './contexts/CompletedResourceEditContext'
import { ResourcesListPage } from './pages/ResourcesListPage'
import { ResourceOverviewPage } from './pages/ResourceOverviewPage'
import { ResourceDetailsPage } from './pages/ResourceDetailsPage'
import { BasicInfoPage } from './pages/BasicInfoPage'
import { ProjectDetailsPage } from './pages/ProjectDetailsPage'

function App() {
  return (
    <CompletedResourceEditProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/resources" element={<ResourcesListPage />} />
          <Route path="/resources/:resourceId" element={<ResourceOverviewPage />} />
          <Route path="/resources/:resourceId/details" element={<ResourceDetailsPage />} />
          <Route path="/resources/:resourceId/basic-info" element={<BasicInfoPage />} />
          <Route path="/resources/:resourceId/project-details" element={<ProjectDetailsPage />} />
          <Route path="*" element={<Navigate replace to="/resources" />} />
        </Routes>
      </BrowserRouter>
    </CompletedResourceEditProvider>
  )
}

export default App
